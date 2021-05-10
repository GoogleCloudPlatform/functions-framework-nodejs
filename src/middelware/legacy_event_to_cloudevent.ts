// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import {Request, Response, NextFunction} from 'express';
import * as cloudevents from '../cloudevents';
import {CE_TO_BACKGROUND_TYPE} from './ce_to_legacy_event';
import {CloudFunctionsContext, LegacyEvent} from '../functions';

const BACKGROUND_TO_CE_TYPE = new Map<string, string>(
  [...CE_TO_BACKGROUND_TYPE].map(x => [x[1], x[0]])
);
BACKGROUND_TO_CE_TYPE.set(
  'providers/cloud.storage/eventTypes/object.change',
  'google.cloud.storage.object.v1.finalized'
);
BACKGROUND_TO_CE_TYPE.set(
  'providers/cloud.pubsub/eventTypes/topic.publish',
  'google.cloud.pubsub.topic.v1.messagePublished'
);

// Maps background event services to their equivalent CloudEvent services.
const SERVICE_BACKGROUND_TO_CE = new Map(
  Object.entries({
    'providers/cloud.firestore/': cloudevents.FIRESTORE_CE_SERVICE,
    'providers/google.firebase.analytics/': cloudevents.FIREBASE_CE_SERVICE,
    'providers/firebase.auth/': cloudevents.FIREBASE_AUTH_CE_SERVICE,
    'providers/google.firebase.database/': cloudevents.FIREBASE_DB_CE_SERVICE,
    'providers/cloud.pubsub/': cloudevents.PUBSUB_CE_SERVICE,
    'providers/cloud.storage/': cloudevents.STORAGE_CE_SERVICE,
    'google.pubsub': cloudevents.PUBSUB_CE_SERVICE,
    'google.storage': cloudevents.STORAGE_CE_SERVICE,
  })
);

/**
 * Maps CloudEvent service strings to regular expressions used to split a background
 * event resource string into CloudEvent resource and subject strings. Each regex
 * must have exactly two capture groups: the first for the resource and the second
 * for the subject.
 */
const CE_SERVICE_TO_RESOURCE_RE = new Map([
  [cloudevents.FIREBASE_CE_SERVICE, /^(projects\/[^/]+)\/(events\/[^/]+)$/],
  [
    cloudevents.FIREBASE_DB_CE_SERVICE,
    /^(projects\/[^/]\/instances\/[^/]+)\/(refs\/.+)$/,
  ],
  [
    cloudevents.FIRESTORE_CE_SERVICE,
    /^(projects\/[^/]+\/databases\/\(default\))\/(documents\/.+)$/,
  ],
  [
    cloudevents.STORAGE_CE_SERVICE,
    /^(projects\/[^/]\/buckets\/[^/]+)\/(objects\/.+)$/,
  ],
]);

/**
 * Is this request a known GCF event that can be converted to a cloud event.
 * @param req the express request object
 * @returns true if this request can be converted to a CloudEvent
 */
const isConvertableLegacyEvent = (req: Request): boolean => {
  const {body} = req;
  const context = 'context' in body ? body.context : body;
  return (
    !cloudevents.isBinaryCloudEvent(req) &&
    'data' in body &&
    'eventType' in context &&
    'resource' in context &&
    BACKGROUND_TO_CE_TYPE.has(context.eventType)
  );
};

/**
 * Convert the given HTTP request into the GCF Legacy Event data / context format.
 * @param body the express request object
 * @returns a marshalled legacy event
 */
const getLegacyEvent = (request: Request): LegacyEvent => {
  let {context} = request.body;
  const {data} = request.body;
  if (!context) {
    context = request.body;
    context.data = undefined;
    delete context.data;
  }
  return {context, data};
};

interface ParsedResource {
  service: string;
  resource: string;
  subject: string;
}

/**
 * Splits a background event's resource into a CloudEvent service, resource, and subject.
 */
export const splitResource = (
  context: CloudFunctionsContext
): ParsedResource => {
  let service = '';
  let resource = '';
  let subject = '';
  if (typeof context.resource === 'string') {
    resource = context.resource;
    service = '';
  } else if (context.resource !== undefined) {
    resource = context.resource.name ?? '';
    service = context.resource.service;
  }

  if (!service) {
    for (const [backgroundService, ceService] of SERVICE_BACKGROUND_TO_CE) {
      if (context.eventType?.startsWith(backgroundService)) {
        service = ceService;
      }
    }
  }

  if (!service) {
    throw new cloudevents.EventConversionError(
      `Unable to find equivalent CloudEvent service for ${context.eventType}.`
    );
  }

  const regex = CE_SERVICE_TO_RESOURCE_RE.get(service);
  if (regex) {
    const match = resource.match(regex);
    if (match) {
      resource = match[1];
      subject = match[2];
    } else {
      throw new cloudevents.EventConversionError(
        `Resource string did not match expected format: ${resource}.`
      );
    }
  }
  return {
    service,
    resource,
    subject,
  };
};

/**
 * Express middleware to convert legacy GCF requests to cloud events. This enables functions
 * using the "CLOUD_EVENT" signature type to accept requests from a legacy event producer.
 * @param req express request object
 * @param res express response object
 * @param next function used to pass control to the next middleware function in the stack
 */
export const legacyEventToCloudEventMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (isConvertableLegacyEvent(req)) {
    // eslint-disable-next-line prefer-const
    let {context, data} = getLegacyEvent(req);
    const newType = BACKGROUND_TO_CE_TYPE.get(context.eventType ?? '');
    if (!newType) {
      throw new cloudevents.EventConversionError(
        `Unable to find equivalent CloudEvent type for ${context.eventType}`
      );
    }
    // eslint-disable-next-line prefer-const
    let {service, resource, subject} = splitResource(context);

    if (service === cloudevents.PUBSUB_CE_SERVICE) {
      // PubSub data is nested under the "message" key.
      data = {message: data};
    }

    if (service === cloudevents.FIREBASE_AUTH_CE_SERVICE) {
      if ('metadata' in data) {
        // Some metadata are not consistent between cloudevents and legacy events
        const metadata: object = data.metadata;
        data.metadata = {};
        // eslint-disable-next-line prefer-const
        for (let [k, v] of Object.entries(metadata)) {
          k = k === 'createdAt' ? 'createTime' : k;
          k = k === 'lastSignedInAt' ? 'lastSignInTime' : k;
          data.metadata[k] = v;
        }
        // Subject comes from the 'uid' field in the data payload.
        if ('uid' in data) {
          subject = `users/${data.uid}`;
        }
      }
    }

    const cloudEvent: {[k: string]: string | object | undefined} = {
      id: context.eventId,
      time: context.timestamp,
      specversion: '1.0',
      datacontenttype: 'application/json',
      type: newType,
      source: `//${service}/${resource}`,
      data,
    };
    if (subject) {
      cloudEvent.subject = subject;
    }
    req.body = cloudEvent;
  }
  next();
};
