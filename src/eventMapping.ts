// Copyright 2020 Google LLC
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

import * as express from 'express';
import {
  BackgroundEvent,
  CloudFunctionsContext,
  CloudFunctionsResource,
  CloudEventsContext,
} from './functions';
import {
  isBinaryCloudEvent,
  isStructuredCloudEvent,
  getBinaryCloudEventContext,
} from './cloudevents';

/**
 * Mapping between background event types and CloudEvent types.
 */
const BACKGROUND_TO_CLOUDEVENT_EVENT_TYPE_MAP: Record<string, string> = {
  'google.pubsub.topic.publish':
    'google.cloud.pubsub.topic.v1.messagePublished',
  'providers/cloud.pubsub/eventTypes/topic.publish':
    'google.cloud.pubsub.topic.v1.messagePublished',
  'google.storage.object.finalize': 'google.cloud.storage.object.v1.finalized',
  'google.storage.object.delete': 'google.cloud.storage.object.v1.deleted',
  'google.storage.object.archive': 'google.cloud.storage.object.v1.archived',
  'google.storage.object.metadataUpdate':
    'google.cloud.storage.object.v1.metadataUpdated',
  'providers/cloud.firestore/eventTypes/document.write':
    'google.cloud.firestore.document.v1.written',
  'providers/cloud.firestore/eventTypes/document.create':
    'google.cloud.firestore.document.v1.created',
  'providers/cloud.firestore/eventTypes/document.update':
    'google.cloud.firestore.document.v1.updated',
  'providers/cloud.firestore/eventTypes/document.delete':
    'google.cloud.firestore.document.v1.deleted',
  'providers/firebase.auth/eventTypes/user.create':
    'google.firebase.auth.user.v1.created',
  'providers/firebase.auth/eventTypes/user.delete':
    'google.firebase.auth.user.v1.deleted',
  'providers/google.firebase.analytics/eventTypes/event.log':
    'google.firebase.analytics.log.v1.written',
  'providers/google.firebase.database/eventTypes/ref.create':
    'google.firebase.database.document.v1.created',
  'providers/google.firebase.database/eventTypes/ref.write':
    'google.firebase.database.document.v1.written',
  'providers/google.firebase.database/eventTypes/ref.update':
    'google.firebase.database.document.v1.updated',
  'providers/google.firebase.database/eventTypes/ref.delete':
    'google.firebase.database.document.v1.deleted',
  'providers/cloud.storage/eventTypes/object.change':
    'google.cloud.storage.object.v1.finalized',
};

/**
 * Mapping between background event services and CloudEvent services.
 */
const BACKGROUND_TO_CLOUDEVENT_SERVICE_MAP: Record<string, string> = {
  'providers/cloud.firestore/': 'firestore.googleapis.com',
  'providers/google.firebase.analytics/': 'firebaseauth.googleapis.com',
  'providers/firebase.auth/': 'firebaseauth.googleapis.com',
  'providers/google.firebase.database/': 'firebasedatabase.googleapis.com',
  'providers/cloud.pubsub/': 'pubsub.googleapis.com',
  'providers/cloud.storage/': 'storage.googleapis.com',
  'google.pubsub': 'pubsub.googleapis.com',
  'google.storage': 'storage.googleapis.com',
};

// Default CloudEvent spec version.
const CE_SPEC_VERSION = '1.0';
// Default CloudEvent content type.
const CE_CONTENT_TYPE = 'application/json';

/**
 * Get CloudEvent from the request object.
 * @param req Express request object.
 * @return CloudEvent object or null.
 */
export function getCloudEvent(req: express.Request): CloudEventsContext {
  let cloudevent: CloudEventsContext;

  // Handle a CloudEvent in binary content mode.
  if (isBinaryCloudEvent(req)) {
    cloudevent = getBinaryCloudEventContext(req);
    cloudevent.data = req.body;
    return cloudevent;
  }

  // Handle a CloudEvent in structured content mode.
  if (isStructuredCloudEvent(req)) {
    cloudevent = req.body as CloudEventsContext;
    return cloudevent;
  }

  const event = getBackgroundEvent(req);
  if (!event) {
    throw new Error('Unable to extract background event');
  }

  const context = event.context;
  const data = event.data;

  cloudevent = {
    contenttype: CE_CONTENT_TYPE,
    id: context.eventId,
    specversion: CE_SPEC_VERSION,
    time: context.timestamp,
    data: data,
  };

  // Determine CloudEvent type attribute.
  if (!context.eventType) {
    throw new Error('Unable to find background event type');
  }
  const ceType = BACKGROUND_TO_CLOUDEVENT_EVENT_TYPE_MAP[context.eventType];

  // Determine CloudEvent service attribute.
  if (!context.resource) {
    throw new Error ('Unable to find background event resource');
  }
  let ceSource: string;
  if (typeof context.resource === 'string') {
    // Resource is a raw path.
    // We need to determine the background event service from its type.
    let service = '';
    for (const [bService, ceService] of Object.entries(BACKGROUND_TO_CLOUDEVENT_SERVICE_MAP)) {
      if (context.eventType.startsWith(bService)) {
        service = ceService;
        break;
      }
    }
    if (!service) {
      throw new Error('Unable to find background event service');
    }
    ceSource = `//${service}/${context.resource}`;
  } else {
    // Resource is structured data.
    const resource: CloudFunctionsResource = context.resource;
    ceSource = `//${resource.service}/${resource.name}`;
  }

  return cloudevent;
}

/**
 * Get BackgroundEvent object from the request object.
 * @param req Express request object.
 * @return BackgroundEvent object or null.
 */
export function getBackgroundEvent(req: express.Request): BackgroundEvent {
  const event = req.body;
  let data = event.data;
  let context = event.context;
  if (isBinaryCloudEvent(req)) {
    // Support CloudEvents in binary content mode, with data being the whole
    // request body and context attributes retrieved from request headers.
    data = event;
    context = getBinaryCloudEventContext(req);
  } else if (!context) {
    // Support legacy events and CloudEvents in structured content mode, with
    // context properties represented as event top-level properties.
    // Context is everything but data.
    context = event;
    // Clear the property before removing field so the data object
    // is not deleted.
    context.data = undefined;
    delete context.data;
  }
  const backgroundEvent: BackgroundEvent = {
    data: data,
    context: context as CloudFunctionsContext,
  };
  return backgroundEvent;
}
