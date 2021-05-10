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

import * as express from 'express';
import {CloudEventsContext} from './functions';

/**
 * Custom exception class to represent errors durring event conversions.
 */
export class EventConversionError extends Error {}

// CloudEvent service names.
export const FIREBASE_AUTH_CE_SERVICE = 'firebaseauth.googleapis.com';
export const FIREBASE_CE_SERVICE = 'firebase.googleapis.com';
export const FIREBASE_DB_CE_SERVICE = 'firebasedatabase.googleapis.com';
export const FIRESTORE_CE_SERVICE = 'firestore.googleapis.com';
export const PUBSUB_CE_SERVICE = 'pubsub.googleapis.com';
export const STORAGE_CE_SERVICE = 'storage.googleapis.com';

/**
 * Checks whether the incoming request is a CloudEvents event in binary content
 * mode. This is verified by checking the presence of required headers.
 *
 * @link https://github.com/cloudevents/spec/blob/master/http-protocol-binding.md#3-http-message-mapping
 *
 * @param req Express request object.
 * @return True if the request is a CloudEvents event in binary content mode,
 *     false otherwise.
 */
export function isBinaryCloudEvent(req: express.Request): boolean {
  return !!(
    req.header('ce-type') &&
    req.header('ce-specversion') &&
    req.header('ce-source') &&
    req.header('ce-id')
  );
}

/**
 * Returns a CloudEvents context from the given CloudEvents request. Context
 * attributes are retrieved from request headers.
 *
 * @param req Express request object.
 * @return CloudEvents context.
 */
export function getBinaryCloudEventContext(
  req: express.Request
): CloudEventsContext {
  const context: CloudEventsContext = {};
  for (const name in req.headers) {
    if (name.startsWith('ce-')) {
      const attributeName = name.substr(
        'ce-'.length
      ) as keyof CloudEventsContext;
      context[attributeName] = req.header(name);
    }
  }
  return context;
}
