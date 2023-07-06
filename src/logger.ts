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
import {FUNCTION_STATUS_HEADER_FIELD} from './types';

/**
 * Logs an error message and sends back an error response to the incoming
 * request.
 * @param err Error to be logged and sent.
 * @param res Express response object.
 * @param callback A function to be called synchronously.
 */
export function sendCrashResponse({
  err,
  res,
  callback,
  silent = false,
  statusHeader = 'crash',
  statusOverride = 500,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: Error | any;
  res: express.Response | null;
  callback?: Function;
  silent?: boolean;
  statusHeader?: string;
  statusOverride?: number;
}) {
  if (!silent) {
    console.error(err.stack || err);
  }

  // If user function has already sent response headers, the response with
  // error message cannot be sent. This check is done inside the callback,
  // right before sending the response, to make sure that no concurrent
  // execution sends the response between the check and 'send' call below.
  if (res && !res.headersSent) {
    res.set(FUNCTION_STATUS_HEADER_FIELD, statusHeader);

    if (process.env.NODE_ENV !== 'production') {
      res.status(statusOverride);
      res.send((err.message || err) + '');
    } else {
      res.sendStatus(statusOverride);
    }
  }
  if (callback) {
    callback();
  }
}
