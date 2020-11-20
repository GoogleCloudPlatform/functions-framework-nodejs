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
  CloudEventsContext,
  CloudFunctionsResource,
} from './functions';
import {
  isBinaryCloudEvent,
  isCloudEvent,
  getBinaryCloudEventContext,
} from './cloudevents';

/**
 * Mapping between background event types and CloudEvent types.
 */
const typeBackgroundToCloudEvent: Record<string, string> = {
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
const serviceBackgroundToCloudEvent: Record<string, string> = {
  'providers/cloud.firestore/': 'firestore.googleapis.com',
  'providers/google.firebase.analytics/': 'firebase.googleapis.com',
  'providers/firebase.auth/': 'firebase.googleapis.com',
  'providers/google.firebase.database/': 'firebase.googleapis.com',
  'providers/cloud.pubsub/': 'pubsub.googleapis.com',
  'providers/cloud.storage/': 'storage.googleapis.com',
  'google.pubsub': 'pubsub.googleapis.com',
  'google.storage': 'storage.googleapis.com',
};

/**
 * Get CloudEvent from the request object.
 * @param req Express request object.
 * @return CloudEvent object or null.
 */
export function getCloudEvent(req: express.Request): CloudEventsContext | null {
  let cloudevent: CloudEventsContext;

  // Handle a CloudEvent in binary mode.
  if (isBinaryCloudEvent(req)) {
    cloudevent = getBinaryCloudEventContext(req);
    cloudevent.data = req.body;
    return cloudevent;
  }

  // Handle a CloudEvent in structured mode.
  if (isCloudEvent(req)) {
    cloudevent = req.body as CloudEventsContext;
    return cloudevent;
  }

  console.log('Converting from background event to CloudEvent');
  const event = getBackgroundEvent(req);
  if (event === null) {
    console.error('Unable to extract background event');
    return null;
  }

  const context = event.context;
  const data = event.data;

  // Determine CloudEvent type attribute.
  if (typeof context.eventType === 'undefined') {
    console.error('Unable to find background event type');
    return null;
  }
  const ceType = typeBackgroundToCloudEvent[context.eventType];

  // Determine CloudEvent service attribute.
  if (typeof context.resource === 'undefined') {
    console.error('Unable to find background event resource');
    return null;
  }

  // Resource is a raw path.
  // We need to determine the background event service from its type.
  let ceSource: string;
  if (typeof context.resource === 'string') {
    let service = '';
    for (const bService in serviceBackgroundToCloudEvent) {
      const ceService = serviceBackgroundToCloudEvent[bService];
      if (context.eventType.startsWith(bService)) {
        service = ceService;
        break;
      }
    }
    if (service === '') {
      console.error('Unable to find background event service');
      return null;
    }
    ceSource = `//${service}/${context.resource}`;
  } else {
    // Resource is structured data.
    const resource: CloudFunctionsResource = context.resource;
    ceSource = `//${resource.service}/${resource.name}`;
  }

  cloudevent = {
    contenttype: 'application/json',
    id: context.eventId,
    specversion: '1.0',
    time: context.timestamp,
    data: data,
    source: ceSource,
    type: ceType,
  };

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
  } else if (context === undefined) {
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
