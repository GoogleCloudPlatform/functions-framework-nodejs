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
import * as express from 'express';
import {LegacyEvent, CloudEventsContext} from './functions';

/**
 * Downcasts a CloudEvent to a legacy event.
 * @param req The express request.
 * @returns The legacy event.
 */
export function convertCloudEventToLegacyEvent(
  req: express.Request
): LegacyEvent {
  const data = {};
  const context = {};

  // TODO
  return {
    data,
    context,
  };
}

/**
 * Upcasts a legacy event to a CloudEvent.
 * @param req The express request.
 * @returns The CloudEvent.
 */
export function convertLegacyEventToCloudEvent(
  req: express.Request
): CloudEventsContext {
  // TODO
  return {};
}
