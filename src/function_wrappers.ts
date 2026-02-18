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

// eslint-disable-next-line n/no-deprecated-api
import * as domain from 'domain';
import {Request, Response, RequestHandler} from 'express';
import {sendCrashResponse} from './logger';
import {sendResponse} from './invoker';
import {isBinaryCloudEvent, getBinaryCloudEventContext} from './cloud_events';
import {
  HttpFunction,
  EventFunction,
  EventFunctionWithCallback,
  Context,
  CloudEventFunction,
  CloudEventFunctionWithCallback,
  HandlerFunction,
} from './functions';
import {CloudEvent} from './functions';
import {SignatureType} from './types';

/**
 * The handler function used to signal completion of event functions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OnDoneCallback = (err: Error | null, result: any) => void;

/**
 * Get a completion handler that can be used to signal completion of an event function.
 * @param res - The response object of the request the completion handler is for
 * @returns An OnDoneCallback for the provided request.
 */
const getOnDoneCallback = (res: Response): OnDoneCallback => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (process as any).domain.bind((err: Error | null, result: any) => {
    if (res.locals.functionExecutionFinished) {
      console.log('Ignoring extra callback call');
    } else {
      res.locals.functionExecutionFinished = true;
      sendResponse(result, err, res);
    }
  });
};

/**
 * Helper function to parse a CloudEvent object from an HTTP request.
 * @param req - An Express HTTP request
 * @returns A CloudEvent parsed from the request
 */
const parseCloudEventRequest = (req: Request): CloudEvent<unknown> => {
  let cloudEvent = req.body;
  if (isBinaryCloudEvent(req)) {
    cloudEvent = getBinaryCloudEventContext(req);
    cloudEvent.data = req.body;
  }
  // Populate the traceparent header.
  if (req.header('traceparent')) {
    cloudEvent.traceparent = req.header('traceparent');
  }
  return cloudEvent;
};

/**
 * Helper function to background event context and data payload object from an HTTP
 * request.
 * @param req - An Express HTTP request
 * @returns The data payload and event context parsed from the request
 */
const parseBackgroundEvent = (req: Request): {data: {}; context: Context} => {
  const event = req.body;
  const data = event.data;
  let context = event.context;
  if (context === undefined) {
    // Support legacy events and CloudEvents in structured content mode, with
    // context properties represented as event top-level properties.
    // Context is everything but data.
    context = event;
    // Clear the property before removing field so the data object
    // is not deleted.
    context.data = undefined;
    delete context.data;
  }
  return {data, context};
};

/**
 * Wraps the provided function into an Express handler function with additional
 * instrumentation logic.
 * @param execute - Runs user's function
 * @return An Express handler function
 */
const wrapHttpFunction = (execute: HttpFunction): RequestHandler => {
  return (req: Request, res: Response) => {
    const d = domain.create();
    const errorHandler = (err: Error) => {
      if (res.locals.functionExecutionFinished) {
        console.error(`Exception from a finished function: ${err}`);
      } else {
        res.locals.functionExecutionFinished = true;
        sendCrashResponse({err, res});
      }
    };

    // Catch unhandled errors originating from this request.
    d.on('error', errorHandler);

    d.run(() => {
      process.nextTick(() => {
        const ret = execute(req, res);
        // Catch rejected promises if the function is async.
        if (ret instanceof Promise) {
          ret.catch(errorHandler);
        }
      });
    });
  };
};

/**
 * Wraps an async CloudEvent function in an express RequestHandler.
 * @param userFunction - User's function
 * @return An Express handler function that invokes the user function
 */
const wrapCloudEventFunction = (
  userFunction: CloudEventFunction,
): RequestHandler => {
  const httpHandler = (req: Request, res: Response) => {
    const callback = getOnDoneCallback(res);
    const cloudEvent = parseCloudEventRequest(req);
    Promise.resolve()
      .then(() => userFunction(cloudEvent))
      .then(
        result => callback(null, result),
        err => callback(err, undefined),
      );
  };
  return wrapHttpFunction(httpHandler);
};

/**
 * Wraps callback style CloudEvent function in an express RequestHandler.
 * @param userFunction - User's function
 * @return An Express handler function that invokes the user function
 */
const wrapCloudEventFunctionWithCallback = (
  userFunction: CloudEventFunctionWithCallback,
): RequestHandler => {
  const httpHandler = (req: Request, res: Response) => {
    const callback = getOnDoneCallback(res);
    const cloudEvent = parseCloudEventRequest(req);
    return userFunction(cloudEvent, callback);
  };
  return wrapHttpFunction(httpHandler);
};

/**
 * Wraps an async event function in an express RequestHandler.
 * @param userFunction - User's function
 * @return An Express handler function that invokes the user function
 */
const wrapEventFunction = (userFunction: EventFunction): RequestHandler => {
  const httpHandler = (req: Request, res: Response) => {
    const callback = getOnDoneCallback(res);
    const {data, context} = parseBackgroundEvent(req);
    Promise.resolve()
      .then(() => userFunction(data, context))
      .then(
        result => callback(null, result),
        err => callback(err, undefined),
      );
  };
  return wrapHttpFunction(httpHandler);
};

/**
 * Wraps a callback style event function in an express RequestHandler.
 * @param userFunction - User's function
 * @return An Express handler function that invokes the user function
 */
const wrapEventFunctionWithCallback = (
  userFunction: EventFunctionWithCallback,
): RequestHandler => {
  const httpHandler = (req: Request, res: Response) => {
    const callback = getOnDoneCallback(res);
    const {data, context} = parseBackgroundEvent(req);
    return userFunction(data, context, callback);
  };
  return wrapHttpFunction(httpHandler);
};

/**
 * Wraps a user function with the provided signature type in an express
 * RequestHandler.
 * @param userFunction User's function.
 * @return An Express handler function that invokes the user function.
 */
export const wrapUserFunction = <T = unknown>(
  userFunction: HandlerFunction<T>,
  signatureType: SignatureType,
): RequestHandler => {
  switch (signatureType) {
    case 'http':
      return wrapHttpFunction(userFunction as HttpFunction);
    case 'event':
      // Callback style if user function has more than 2 arguments.
      if (userFunction instanceof Function && userFunction!.length > 2) {
        return wrapEventFunctionWithCallback(
          userFunction as EventFunctionWithCallback,
        );
      }
      return wrapEventFunction(userFunction as EventFunction);
    case 'cloudevent':
      if (userFunction instanceof Function && userFunction!.length > 1) {
        // Callback style if user function has more than 1 argument.
        return wrapCloudEventFunctionWithCallback(
          userFunction as CloudEventFunctionWithCallback,
        );
      }
      return wrapCloudEventFunction(userFunction as CloudEventFunction);
  }
};
