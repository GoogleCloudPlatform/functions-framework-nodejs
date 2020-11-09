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

// Node.js server that runs user's code on HTTP request. HTTP response is sent
// once user's function has completed.
// The server accepts following HTTP requests:
//   - POST '/*' for executing functions (only for servers handling functions
//     with non-HTTP trigger).
//   - ANY (all methods) '/*' for executing functions (only for servers handling
//     functions with HTTP trigger).

// eslint-disable-next-line node/no-deprecated-api
import * as domain from 'domain';
import * as express from 'express';
import * as http from 'http';
import {FUNCTION_STATUS_HEADER_FIELD} from './types';
import {sendCrashResponse} from './logger';
import {isBinaryCloudEvent, getBinaryCloudEventContext} from './cloudevents';
import {
  HttpFunction,
  EventFunction,
  EventFunctionWithCallback,
  CloudEventFunction,
  CloudEventFunctionWithCallback,
} from './functions';

// We optionally annotate the express Request with a rawBody field.
// Express leaves the Express namespace open to allow merging of new fields.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      rawBody?: Buffer;
    }
  }
}

/**
 * Response object for the most recent request.
 * Used for sending errors to the user.
 */
let latestRes: express.Response | null = null;
export const setLatestRes = (res: express.Response) => {
  latestRes = res;
};

/**
 * Sends back a response to the incoming request.
 * @param result Output from function execution.
 * @param err Error from function execution.
 * @param res Express response object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendResponse(result: any, err: Error | null, res: express.Response) {
  if (err) {
    res.set(FUNCTION_STATUS_HEADER_FIELD, 'error');
    // Sending error message back is fine for Pub/Sub-based functions as they do
    // not reach the caller anyway.
    res.send(err.message);
    return;
  }
  if (typeof result === 'undefined' || result === null) {
    res.sendStatus(204); // No Content
  } else if (typeof result === 'number') {
    // This isn't technically compliant but numbers otherwise cause us to set
    // the status code to that number instead of sending the number as a body.
    res.json(result);
  } else {
    try {
      res.send(result);
    } catch (sendErr) {
      // If a customer passes a non-serializeable object (e.g. one with a cycle)
      // then res.send will throw. Customers don't always put a lot of thought
      // into the return value because it's currently only used for
      // CallFunction. The most sane resolution here is to succeed the function
      // (this was the customer's clear intent) but send a 204 (NO CONTENT) and
      // log an error message explaining why their content wasn't sent.
      console.error('Error serializing return value: ' + sendErr.toString());
      res.sendStatus(204); // No Content
    }
  }
}

/**
 * Wraps the provided function into an Express handler function with additional
 * instrumentation logic.
 * @param execute Runs user's function.
 * @return An Express handler function.
 */
export function makeHttpHandler(execute: HttpFunction): express.RequestHandler {
  return (req: express.Request, res: express.Response) => {
    const d = domain.create();
    // Catch unhandled errors originating from this request.
    d.on('error', err => {
      if (res.locals.functionExecutionFinished) {
        console.error(`Exception from a finished function: ${err}`);
      } else {
        res.locals.functionExecutionFinished = true;
        sendCrashResponse({err, res});
      }
    });
    d.run(() => {
      process.nextTick(() => {
        execute(req, res);
      });
    });
  };
}

/**
 * Wraps cloudevent function (or cloudevent function with callback) in HTTP
 * function signature.
 * @param userFunction User's function.
 * @return HTTP function which wraps the provided event function.
 */
export function wrapCloudEventFunction(
  userFunction: CloudEventFunction | CloudEventFunctionWithCallback
): HttpFunction {
  return (req: express.Request, res: express.Response) => {
    const callback = process.domain.bind(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: Error | null, result: any) => {
        if (res.locals.functionExecutionFinished) {
          console.log('Ignoring extra callback call');
        } else {
          res.locals.functionExecutionFinished = true;
          if (err) {
            console.error(err.stack);
          }
          sendResponse(result, err, res);
        }
      }
    );
    let cloudevent = req.body;
    if (isBinaryCloudEvent(req)) {
      cloudevent = getBinaryCloudEventContext(req);
      cloudevent.data = req.body;
    }
    // Callback style if user function has more than 1 argument.
    if (userFunction!.length > 1) {
      const fn = userFunction as CloudEventFunctionWithCallback;
      return fn(cloudevent, callback);
    }

    const fn = userFunction as CloudEventFunction;
    Promise.resolve()
      .then(() => {
        const result = fn(cloudevent);
        return result;
      })
      .then(
        result => {
          callback(null, result);
        },
        err => {
          callback(err, undefined);
        }
      );
  };
}

/**
 * Wraps event function (or event function with callback) in HTTP function
 * signature.
 * @param userFunction User's function.
 * @return HTTP function which wraps the provided event function.
 */
export function wrapEventFunction(
  userFunction: EventFunction | EventFunctionWithCallback
): HttpFunction {
  return (req: express.Request, res: express.Response) => {
    const event = req.body;
    const callback = process.domain.bind(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: Error | null, result: any) => {
        if (res.locals.functionExecutionFinished) {
          console.log('Ignoring extra callback call');
        } else {
          res.locals.functionExecutionFinished = true;
          if (err) {
            console.error(err.stack);
          }
          sendResponse(result, err, res);
        }
      }
    );
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
    // Callback style if user function has more than 2 arguments.
    if (userFunction!.length > 2) {
      const fn = userFunction as EventFunctionWithCallback;
      return fn(data, context, callback);
    }

    const fn = userFunction as EventFunction;
    Promise.resolve()
      .then(() => {
        const result = fn(data, context);
        return result;
      })
      .then(
        result => {
          callback(null, result);
        },
        err => {
          callback(err, undefined);
        }
      );
  };
}

// Use an exit code which is unused by Node.js:
// https://nodejs.org/api/process.html#process_exit_codes
const killInstance = process.exit.bind(process, 16);

/**
 * Enables registration of error handlers.
 * @param server HTTP server which invokes user's function.
 * @constructor
 */
export class ErrorHandler {
  constructor(private readonly server: http.Server) {
    this.server = server;
  }
  /**
   * Registers handlers for uncaught exceptions and other unhandled errors.
   */
  register() {
    process.on('uncaughtException', err => {
      console.error('Uncaught exception');
      sendCrashResponse({err, res: latestRes, callback: killInstance});
    });

    process.on('unhandledRejection', err => {
      console.error('Unhandled rejection');
      sendCrashResponse({err, res: latestRes, callback: killInstance});
    });

    process.on('exit', code => {
      sendCrashResponse({
        err: new Error(`Process exited with code ${code}`),
        res: latestRes,
        silent: code === 0,
      });
    });

    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal as NodeJS.Signals, () => {
        console.log(`Received ${signal}`);
        this.server.close(() => {
          // eslint-disable-next-line no-process-exit
          process.exit();
        });
      });
    });
  }
}
