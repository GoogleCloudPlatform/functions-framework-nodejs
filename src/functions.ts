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

// Type Interfaces for the Node Functions Framework.
// **If changing files, please change package.json!**

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as express from 'express';

/**
 * A HTTP function handler.
 * @public
 */
export interface HttpFunction {
  (req: express.Request, res: express.Response): any;
}
/**
 * A legacy event function handler.
 * @public
 */
export interface EventFunction {
  (data: {}, context: Context): any;
}
/**
 * A legacy event function handler with callback.
 * @public
 */
export interface EventFunctionWithCallback {
  (data: {}, context: Context, callback: Function): any;
}
/**
 * A cloudevent function handler.
 * @public
 */
export interface CloudEventFunction {
  (cloudevent: CloudEventsContext): any;
}
/**
 * A cloudevent function handler with callback.
 * @public
 */
export interface CloudEventFunctionWithCallback {
  (cloudevent: CloudEventsContext, callback: Function): any;
}
/**
 * A function handler.
 * @public
 */
export type HandlerFunction =
  | HttpFunction
  | EventFunction
  | EventFunctionWithCallback
  | CloudEventFunction
  | CloudEventFunctionWithCallback;

/**
 * A legacy event.
 * @public
 */
export interface LegacyEvent {
  data: {[key: string]: any};
  context: CloudFunctionsContext;
}

/**
 * A data object used for legacy event functions.
 */
interface Data {
  data: object;
}
/**
 * A legacy event function context.
 * @public
 */
export type LegacyCloudFunctionsContext = CloudFunctionsContext | Data;

/**
 * The Cloud Functions context object for the event.
 * {@link https://cloud.google.com/functions/docs/writing/background#function_parameters}
 * @public
 */
export interface CloudFunctionsContext {
  /**
   * A unique ID for the event. For example: "70172329041928".
   */
  eventId?: string;
  /**
   * The date/time this event was created. For example: "2018-04-09T07:56:12.975Z"
   * This will be formatted as ISO 8601.
   */
  timestamp?: string;
  /**
   * The type of the event. For example: "google.pubsub.topic.publish".
   */
  eventType?: string;
  /**
   * The resource that emitted the event.
   */
  resource?: string | {[key: string]: string};
}

/**
 * The CloudEvents v1.0 context object for the event.
 * {@link https://github.com/cloudevents/spec/blob/master/spec.md#context-attributes}
 * @public
 */
export interface CloudEventsContext {
  /**
   * Type of occurrence which has happened.
   */
  type?: string;
  /**
   * The version of the CloudEvents specification which the event uses.
   */
  specversion?: string;
  /**
   * The event producer.
   */
  source?: string;
  /**
   * ID of the event.
   */
  id?: string;
  /**
   * Timestamp of when the event happened.
   */
  time?: string;
  /**
   * Describes the subject of the event in the context of the event producer.
   */
  subject?: string;
  /**
   * A link to the schema that the event data adheres to.
   */
  dataschema?: string;
  /**
   * Content type of the event data.
   */
  datacontenttype?: string;
  /**
   * The event data.
   */
  data?:
    | Record<string, unknown | string | number | boolean>
    | string
    | number
    | boolean
    | null
    | unknown;
  /**
   * The traceparent string, containing a trace version, trace ID, span ID, and trace options.
   * @see https://github.com/cloudevents/spec/blob/master/extensions/distributed-tracing.md
   */
  traceparent?: string;
}

/**
 * The function's context.
 * @public
 */
export type Context = CloudFunctionsContext | CloudEventsContext;
