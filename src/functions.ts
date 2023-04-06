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
import {Request as ExpressRequest, Response} from 'express';
import {CloudEventV1 as CloudEvent} from 'cloudevents';

/**
 * @public
 */
export {CloudEvent};

/**
 * @public
 */
export interface Request extends ExpressRequest {
  /**
   * A buffer which provides access to the request's raw HTTP body.
   */
  rawBody?: Buffer;
}

/**
 * @public
 */
export {Response};

/**
 * A HTTP function handler.
 * @public
 */
export interface HttpFunction {
  (req: Request, res: Response): any;
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
 * A CloudEvent function handler.
 * @public
 */
export interface CloudEventFunction<T = unknown> {
  (cloudEvent: CloudEvent<T>): any;
}
/**
 * A CloudEvent function handler with callback.
 * @public
 */
export interface CloudEventFunctionWithCallback<T = unknown> {
  (cloudEvent: CloudEvent<T>, callback: Function): any;
}

/**
 * A Typed function handler that may return a value or a promise.
 * @public
 */
export interface TypedFunction<T = unknown, U = unknown> {
  handler: (req: T) => U | Promise<U>;
  format: InvocationFormat<T, U>;
}

/**
 * A function handler.
 * @public
 */
export type HandlerFunction<T = unknown, U = unknown> =
  | HttpFunction
  | EventFunction
  | EventFunctionWithCallback
  | CloudEventFunction<T>
  | CloudEventFunctionWithCallback<T>
  | TypedFunction<T, U>;

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
 * @public
 */
export interface Data {
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
 * The function's context.
 * @public
 */
export type Context = CloudFunctionsContext | CloudEvent<unknown>;

/**
 * InvocationRequest represents the properties of an invocation over HTTP.
 * @public
 */
export interface InvocationRequest {
  /** Returns the request body as either a string or a Buffer if the body is binary. */
  body(): string | Buffer;
  /** Header returns the value of the specified header */
  header(header: string): string | undefined;
}

/**
 * InvocationResponse interface describes the properties that can be set on
 * an invocation response.
 * @public
 */
export interface InvocationResponse {
  /** Sets a header on the response. */
  setHeader(key: string, value: string): void;
  /** Writes a chunk of data to the response. */
  write(data: string | Buffer): void;
  /** Ends the response, must be called once at the end of writing. */
  end(data: string | Buffer): void;
}

/**
 * The contract for a request deserializer and response serializer.
 * @public
 */
export interface InvocationFormat<T, U> {
  /**
   * Creates an instance of the request type from an invocation request.
   *
   * @param request the request body as raw bytes
   */
  deserializeRequest(request: InvocationRequest): T | Promise<T>;

  /**
   * Writes the response type to the invocation result.
   *
   * @param responseWriter interface for writing to the invocation result
   * @param response the response object
   */
  serializeResponse(
    responseWriter: InvocationResponse,
    response: U
  ): void | Promise<void>;
}

/**
 * Default invocation format for JSON requests.
 * @public
 */
export class JsonInvocationFormat<T, U> implements InvocationFormat<T, U> {
  deserializeRequest(request: InvocationRequest): T {
    const body = request.body();
    if (typeof body !== 'string') {
      throw new Error('Unsupported Content-Type, expected application/json');
    }
    try {
      return JSON.parse(body);
    } catch (e) {
      throw new Error(
        'Failed to parse malformatted JSON in request: ' +
          (e as SyntaxError).message
      );
    }
  }

  serializeResponse(responseWriter: InvocationResponse, response: U): void {
    responseWriter.setHeader('content-type', 'application/json');
    responseWriter.end(JSON.stringify(response));
  }
}
