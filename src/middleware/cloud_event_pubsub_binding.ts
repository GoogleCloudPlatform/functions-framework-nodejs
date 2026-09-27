// Copyright 2026 Google LLC
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
import {isBinaryCloudEvent} from '../cloud_events';

/**
 * Query parameter Eventarc appends to the push endpoint of a Pub/Sub subscription
 * that carries CloudEvents in the Google Cloud Pub/Sub protocol binding.
 */
const CLOUD_EVENTS_MODE_PARAM = '__GCP_CloudEventsMode';
const PUBSUB_BINDING_MODE = 'CE_PUBSUB_BINDING';

/**
 * Pub/Sub attribute prefix for CloudEvent attributes in binary content mode.
 *
 * {@link https://github.com/googleapis/google-cloudevents/blob/main/docs/spec/pubsub.md#3131-pubsub-attribute-names}
 */
const CE_ATTRIBUTE_PREFIX = 'ce-';

/**
 * CloudEvent attributes that must be present for a message to be treated as a
 * CloudEvent.
 */
const REQUIRED_CE_ATTRIBUTES = ['specversion', 'id', 'source', 'type'];

/**
 * The parts of a Pub/Sub push request body used to decode a CloudEvent.
 */
interface PubSubBindingBody {
  message: {
    attributes: {[key: string]: string};
    data?: string;
  };
}

/**
 * Checks whether the request is a CloudEvent delivered in binary content mode of
 * the Google Cloud Pub/Sub protocol binding, still wrapped in a Pub/Sub push
 * envelope.
 *
 * Eventarc normally converts these into HTTP binary content mode before they
 * reach the function. When a CloudEvent attribute can't be sent as an HTTP header
 * (for example, a value with trailing whitespace), the push request arrives
 * unconverted.
 * @param req - Express request object
 * @returns True if the request is an unconverted Pub/Sub binding CloudEvent
 */
const isPubSubBindingCloudEvent = (
  req: Request,
): req is Request & {body: PubSubBindingBody} => {
  if (req.query?.[CLOUD_EVENTS_MODE_PARAM] !== PUBSUB_BINDING_MODE) {
    return false;
  }
  if (isBinaryCloudEvent(req)) {
    return false;
  }
  const attributes = req.body?.message?.attributes;
  if (!attributes || typeof attributes !== 'object') {
    return false;
  }
  // Structured content mode carries the whole event in the message data.
  const contentType = attributes['content-type'];
  if (
    typeof contentType === 'string' &&
    contentType.toLowerCase().startsWith('application/cloudevents')
  ) {
    return false;
  }
  return REQUIRED_CE_ATTRIBUTES.every(
    name => typeof attributes[CE_ATTRIBUTE_PREFIX + name] === 'string',
  );
};

/**
 * Decodes the message data the same way the HTTP body parsers in server.ts
 * decode an HTTP binary content mode CloudEvent body.
 * @param data - Base64 encoded Pub/Sub message data
 * @param contentType - The CloudEvent datacontenttype, if any
 * @returns The decoded CloudEvent data
 */
const decodeData = (data: string, contentType: string | undefined): unknown => {
  const buffer = Buffer.from(data, 'base64');
  const mediaType = contentType?.split(';')[0].trim().toLowerCase();
  if (mediaType === 'application/json') {
    try {
      return JSON.parse(buffer.toString('utf8'));
    } catch (e) {
      const err = new Error(
        `Failed to parse CloudEvent data as JSON: ${(e as Error).message}`,
      ) as Error & {status: number};
      err.status = 400;
      throw err;
    }
  }
  if (mediaType === 'text/plain') {
    return buffer.toString('utf8');
  }
  return buffer;
};

/**
 * Express middleware that converts a CloudEvent delivered in binary content mode of
 * the Google Cloud Pub/Sub protocol binding into a structured CloudEvent request
 * body, as expected downstream by wrapCloudEventFunction.
 *
 * {@link https://github.com/googleapis/google-cloudevents/blob/main/docs/spec/pubsub.md}
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Function used to pass control to the next middleware function in the stack
 */
export const cloudEventPubSubBindingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!isPubSubBindingCloudEvent(req)) {
    next();
    return;
  }
  const {attributes, data} = req.body.message;
  const cloudEvent: {[key: string]: unknown} = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (name.startsWith(CE_ATTRIBUTE_PREFIX)) {
      cloudEvent[name.substring(CE_ATTRIBUTE_PREFIX.length)] = value;
    }
  }
  if (cloudEvent.datacontenttype === undefined && attributes['content-type']) {
    cloudEvent.datacontenttype = attributes['content-type'];
  }
  if (data) {
    try {
      cloudEvent.data = decodeData(
        data,
        cloudEvent.datacontenttype as string | undefined,
      );
    } catch (err) {
      next(err);
      return;
    }
  }
  req.body = cloudEvent;
  next();
};
