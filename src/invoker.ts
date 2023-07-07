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
import * as express from 'express';
import * as http from 'http';
import {sendCrashResponse} from './logger';

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

export function sendResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any,
  err: Error | null,
  res: express.Response
) {
  if (err) {
    sendCrashResponse({err, res, statusHeader: 'error'});
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
      console.error(
        'Error serializing return value: ' + (sendErr as Error).toString()
      );
      res.sendStatus(204); // No Content
    }
  }
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

    process.on('exit', (code: number | string) => {
      if (typeof code === 'string') {
        code = parseInt(code);
      }
      sendCrashResponse({
        err: new Error(`Process exited with code ${code}`),
        res: latestRes,
        silent: code === 0,
      });
    });

    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal as NodeJS.Signals, () => {
        sendCrashResponse({
          err: new Error(`Received ${signal}`),
          res: latestRes,
          silent: true,
          callback: () => {
            // eslint-disable-next-line no-process-exit
            process.exit();
          },
        });
      });
    });
  }
}
