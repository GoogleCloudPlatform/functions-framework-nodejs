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
    CloudFunctionsContext,
    CloudEventsContext,
    BackgroundEvent
  } from './functions';
import {isBinaryCloudEvent, isCloudEvent, getBinaryCloudEventContext} from './cloudevents';

let typeBackgroundToCloudEvent: Record<string, string> = {
    "google.pubsub.topic.publish":                              "google.cloud.pubsub.topic.v1.messagePublished",
    "providers/cloud.pubsub/eventTypes/topic.publish":          "google.cloud.pubsub.topic.v1.messagePublished",
    "google.storage.object.finalize":                           "google.cloud.storage.object.v1.finalized",
    "google.storage.object.delete":                             "google.cloud.storage.object.v1.deleted",
    "google.storage.object.archive":                            "google.cloud.storage.object.v1.archived",
    "google.storage.object.metadataUpdate":                     "google.cloud.storage.object.v1.metadataUpdated",
    "providers/cloud.firestore/eventTypes/document.write":      "google.cloud.firestore.document.v1.written",
    "providers/cloud.firestore/eventTypes/document.create":     "google.cloud.firestore.document.v1.created",
    "providers/cloud.firestore/eventTypes/document.update":     "google.cloud.firestore.document.v1.updated",
    "providers/cloud.firestore/eventTypes/document.delete":     "google.cloud.firestore.document.v1.deleted",
    "providers/firebase.auth/eventTypes/user.create":           "google.firebase.auth.user.v1.created",
    "providers/firebase.auth/eventTypes/user.delete":           "google.firebase.auth.user.v1.deleted",
    "providers/google.firebase.analytics/eventTypes/event.log": "google.firebase.analytics.log.v1.written",
    "providers/google.firebase.database/eventTypes/ref.create": "google.firebase.database.document.v1.created",
    "providers/google.firebase.database/eventTypes/ref.write":  "google.firebase.database.document.v1.written",
    "providers/google.firebase.database/eventTypes/ref.update": "google.firebase.database.document.v1.updated",
    "providers/google.firebase.database/eventTypes/ref.delete": "google.firebase.database.document.v1.deleted",
    "providers/cloud.storage/eventTypes/object.change":         "google.cloud.storage.object.v1.finalized",
};
let typeCloudEventToBackground: Record<string, string> = {};
for (let key in typeBackgroundToCloudEvent) {
    let value = typeBackgroundToCloudEvent[key];
    typeCloudEventToBackground[value] = key;
}

let serviceBackgroundToCloudEvent: Record<string, string> = {
    "providers/cloud.firestore/":           "firestore.googleapis.com",
    "providers/google.firebase.analytics/": "firebase.googleapis.com",
    "providers/firebase.auth/":             "firebase.googleapis.com",
    "providers/google.firebase.database/":  "firebase.googleapis.com",
    "providers/cloud.pubsub/":              "pubsub.googleapis.com",
    "providers/cloud.storage/":             "storage.googleapis.com",
    "google.pubsub":                        "pubsub.googleapis.com",
    "google.storage":                       "storage.googleapis.com",
};
let serviceCloudEventToBackground: Record<string, string> = {};
for (let key in serviceBackgroundToCloudEvent) {
    let value = serviceBackgroundToCloudEvent[key];
    serviceCloudEventToBackground[value] = key;
}

export function getCloudEvent(req: express.Request): CloudEventsContext {
    let cloudevent: CloudEventsContext;

    if (isBinaryCloudEvent(req)) {
        cloudevent = getBinaryCloudEventContext(req);
        cloudevent.data = req.body;
        return cloudevent;
    }

    if (isCloudEvent(req)) {
        cloudevent = req.body as CloudEventsContext;
        return cloudevent;
    }

    console.log('Converting from background event to CloudEvent');
    let backgroundEvent = req.body;
    let data = backgroundEvent.data;
    let context = backgroundEvent.context as CloudFunctionsContext;
    cloudevent = {
        contenttype: "application/json",
        id: context.eventId,
        specversion: "1.0",
        time: context.timestamp,
        data: data
    }

    if (typeof context.resource !== 'undefined' ) {
        cloudevent.source = serviceBackgroundToCloudEvent[context.resource];
    }

    if (typeof context.eventType !== 'undefined' ) {
        cloudevent.type = serviceBackgroundToCloudEvent[context.eventType];
    }
    
    return cloudevent;
}

export function getBackgroundEvent(req: express.Request): BackgroundEvent {
    let backgroundEvent: BackgroundEvent;

    if (!isCloudEvent(req)) {
        backgroundEvent = {
            context: req.body.context,
            data: req.body.data,
        }
        return backgroundEvent
    }

    console.log('Converting from CloudEvent to background event');
    let cloudevent: CloudEventsContext;
    if (isBinaryCloudEvent(req)) {
        cloudevent = getBinaryCloudEventContext(req);
        cloudevent.data = req.body;
    } else {
        cloudevent = req.body as CloudEventsContext;
    }

    let context: CloudFunctionsContext;
    context = {
        eventId: cloudevent.id,
        timestamp: cloudevent.time,
    }

    if (typeof cloudevent.source !== 'undefined' ) {
        context.resource = serviceCloudEventToBackground[cloudevent.source];
    }

    if (typeof cloudevent.type !== 'undefined' ) {
        context.eventType = typeCloudEventToBackground[cloudevent.type];
    }

    backgroundEvent = {
        context: req.body.context,
        data: req.body.data,
    }

    return backgroundEvent;
}