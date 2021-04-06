// Copyright 2021 Google LLC
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

// This file supports converting very legacy events to normal events.
import {LegacyEvent, CloudEventsContext} from './functions';

// Maps background/legacy event types to their equivalent CloudEvent types.
// For more info on event mappings see
// https://github.com/GoogleCloudPlatform/functions-framework-conformance/blob/master/docs/mapping.md
const BACKGROUND_TO_CE_TYPE: Record<string, string> = {
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

// CloudEvent service names.
const CE_SERVICE = {
  FIREBASE_AUTH: 'firebaseauth.googleapis.com',
  FIREBASE: 'firebase.googleapis.com',
  FIREBASE_DB: 'firebasedatabase.googleapis.com',
  FIRESTORE: 'firestore.googleapis.com',
  PUBSUB: 'pubsub.googleapis.com',
  STORAGE: 'storage.googleapis.com',
};

// Maps background event services to their equivalent CloudEvent services.
const BACKGROUND_SERVICE_PREFIX_TO_CE_SERVICE = {
  'providers/cloud.firestore/': CE_SERVICE.FIRESTORE,
  'providers/google.firebase.analytics/': CE_SERVICE.FIREBASE,
  'providers/firebase.auth/': CE_SERVICE.FIREBASE_AUTH,
  'providers/google.firebase.database/': CE_SERVICE.FIREBASE_DB,
  'providers/cloud.pubsub/': CE_SERVICE.PUBSUB,
  'providers/cloud.storage/': CE_SERVICE.STORAGE,
  'google.pubsub': CE_SERVICE.PUBSUB,
  'google.storage': CE_SERVICE.STORAGE,
};

// Maps CloudEvent service strings to regular expressions used to split a background
// event resource string into CloudEvent resource and subject strings. Each regex
// must have exactly two capture groups: the first for the resource and the second
// for the subject.
/* eslint-disable  @typescript-eslint/no-unused-vars */
const CE_SERVICE_TO_RESOURCE_RE = {
  [CE_SERVICE.FIREBASE]: new RegExp('^(projects/[^/]+)/(events/[^/]+)$'),
  [CE_SERVICE.FIREBASE_DB]: new RegExp(
    '^(projects/_/instances/[^/]+)/(refs/.+)$'
  ),
  [CE_SERVICE.FIRESTORE]: new RegExp(
    '^(projects/[^/]+/databases/\\(default\\))/(documents/.+)$'
  ),
  [CE_SERVICE.STORAGE]: new RegExp('^(projects/_/buckets/[^/]+)/(objects/.+)$'),
};

// Maps Firebase Auth fields to CE fields
const BACKGROUND_FIREBASE_AUTH_METADATA_FIELDS_TO_CE = {
  createdAt: 'createTime',
  lastSignedInAt: 'lastSignInTime',
};

/**
 * Downcasts a CloudEvent to a legacy event.
 * @param req The express request.
 * @returns The legacy event.
 */
export function convertCloudEventToLegacyEvent(
  headers: {},
  body: {}
): LegacyEvent {
  const legacyEvent: LegacyEvent = {
    context: {
      eventId: '',
      eventType: '',
      resource: {},
      timestamp: '',
    },
    data: {},
  };
  // TODO
  console.log(headers);
  console.log(body);
  return legacyEvent;
}

/**
 * Upcasts a legacy event to a CloudEvent.
 * @param req The express request.
 * @returns The CloudEvent.
 */
export function convertLegacyEventToCloudEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
): CloudEventsContext {
  const context = body?.context || '';
  const eventType = context?.eventType || body?.eventType;
  let resource = context?.resource || body?.resource;
  if (typeof resource !== 'string') {
    // Handle object case
    resource = resource.name;
  }

  // Service
  let service: string = resource?.service;
  if (!service) {
    for (const [servicePrefix, ceService] of Object.entries(
      BACKGROUND_SERVICE_PREFIX_TO_CE_SERVICE
    )) {
      if (
        typeof eventType === 'string' &&
        eventType.startsWith(servicePrefix)
      ) {
        service = ceService;
        break;
      }
    }
  }

  // Time
  const time =
    context?.timestamp || body?.timestamp || new Date().toISOString();

  // Data
  let data = body.data;
  if (service === 'pubsub.googleapis.com') {
    data = {
      message: data,
    };
  }
  // Convert firebase metadata fields if appropriate
  if (data?.metadata) {
    for (const [oldKey, newKey] of Object.entries(
      BACKGROUND_FIREBASE_AUTH_METADATA_FIELDS_TO_CE
    )) {
      const val = data.metadata[oldKey];
      data.metadata[newKey] = val;
      delete data.metadata[oldKey];
    }
  }

  // Subject: Add subject if available
  let subject;
  if (service === 'firebaseauth.googleapis.com' && data.uid) {
    subject = `users/${data.uid}`;
  }

  // Create CloudEvent
  const ce: CloudEventsContext = {
    specversion: '1.0',
    id: body?.eventId || context.eventId,
    source: `//${service}/${resource}`,
    time,
    type: BACKGROUND_TO_CE_TYPE[eventType],
    datacontenttype: 'application/json',
    ...(subject && {subject}), // conditionally add "subject" key
    data,
  };
  return ce;
}
