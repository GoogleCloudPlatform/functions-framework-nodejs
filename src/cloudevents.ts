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
 * Checks whether the incoming request is a CloudEvents event in structured content
 * mode. This is verified by checking the presence of required body fields.
 *
 * @link https://github.com/cloudevents/spec/blob/master/http-protocol-binding.md#3-http-message-mapping
 *
 * @param req Express request object.
 * @return True if the request is a CloudEvents event in structured content mode,
 *     false otherwise.
 */
export function isStructuredCloudEvent(req: express.Request): boolean {
  return !!(
    req.body.specversion &&
    req.body.type &&
    req.body.source &&
    req.body.id
  );
}

/**
 * Returns true if the request is a CloudEvent.
 * @param req Express request object.
 * @returns True if the request is a CloudEvent.
 */
export function isCloudEvent(req: express.Request): boolean {
  return isBinaryCloudEvent(req) || isStructuredCloudEvent(req);
}

/**
 * Converts a request to a structured CloudEvent object. Handles:
 * - Binary CloudEvents (CloudEvent with "ce-" HTTP headers)
 * - Structured CloudEvents (CloudEvent with event in req.body, no-op)
 * @param req Express request object.
 * @returns A structured CloudEvent object.
 */
export function convertRequestToStructuredCE(
  req: express.Request
): CloudEventsContext {
  if (isBinaryCloudEvent(req)) {
    // Binary event.
    // Create an object with the CloudEvent properties.
    const ce: CloudEventsContext = {
      specversion: req.header('ce-specversion'),
      type: req.header('ce-type'),
      source: req.header('ce-source'),
      subject: req.header('ce-subject'),
      id: req.header('ce-id'),
      time: req.header('ce-time'),
      datacontenttype: req.header('ce-datacontenttype'),
      data: req.body,
    };
    // Remove undefined keys from CE object
    Object.keys(ce).forEach((key: string) =>
      ce[key] === undefined ? delete ce[key] : {}
    );
    return ce;
  } else {
    // Structured event. Just return the event, which is stored in the HTTP body.
    return req.body;
  }
}

/**
 * Returns a CloudEvents context from the given CloudEvents request. Context
 * attributes are retrieved from request headers.
 *
 * @param req Express request object.
 * @return CloudEvents context.
 */
export function getStructuredCloudEventContext(
  req: express.Request
): CloudEventsContext {
  const context: CloudEventsContext = {};
  if (isStructuredCloudEvent(req)) {
    return req.body;
  } else {
    for (const name in req.headers) {
      if (name.startsWith('ce-')) {
        const attributeName = name.substr('ce-'.length);
        context[attributeName] = req.header(name);
      }
    }
    context.data = req.body;
    return context;
  }
}
