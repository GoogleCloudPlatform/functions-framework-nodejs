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
import {getCurrentContext, ExecutionContext} from './async_local_storage';
import {Buffer} from 'buffer';

export const EXECUTION_CONTEXT_LABELS_KEY = 'logging.googleapis.com/labels';
export const EXECUTION_CONTEXT_TRACE_KEY = 'logging.googleapis.com/trace';
export const EXECUTION_CONTEXT_SPAN_ID_KEY = 'logging.googleapis.com/spanId';
const SEVERITY = 'severity';

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

export function loggingHandlerAddExecutionContext() {
  interceptStdoutWrite();
  interceptStderrWrite();
}

function interceptStdoutWrite() {
  const originalStdoutWrite = process.stdout.write;
  process.stdout.write = (data, ...args) => {
    const {encoding, cb} = splitArgs(args);
    const modifiedData = getModifiedData(data, encoding);
    return originalStdoutWrite.apply(process.stdout, [modifiedData, cb]);
  };
}

function interceptStderrWrite() {
  const originalStderrWrite = process.stderr.write;
  process.stderr.write = (data, ...args) => {
    const {encoding, cb} = splitArgs(args);
    const modifiedData = getModifiedData(data, encoding, true);
    return originalStderrWrite.apply(process.stderr, [modifiedData, cb]);
  };
}

export const errorHandler = (
  err: Error | any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  interceptStderrWrite();
  res.status(500);
  res.render('error', {error: err});
};

export function splitArgs(args: any[]) {
  let encoding, cb;
  if (
    args.length > 0 &&
    (Buffer.isEncoding(args[0]) || typeof args[0] === 'undefined')
  ) {
    encoding = args[0];
    args.shift();
  }
  if (args.length > 0 && typeof args[0] === 'function') {
    cb = args[0];
  }
  return {encoding: encoding, cb: cb};
}

export function getModifiedData(
  data: Uint8Array | string,
  encoding?: BufferEncoding,
  stderr = false
) {
  const currentContext = getCurrentContext();
  if (!currentContext) {
    return data;
  }
  const {isJSON, processedData} = processData(data, encoding);
  let dataWithContext;
  if (isJSON) {
    dataWithContext = getJSONWithContext(processedData, currentContext);
  } else {
    dataWithContext = getTextWithContext(processedData, currentContext);
  }
  if (stderr) {
    dataWithContext[SEVERITY] = 'ERROR';
  }

  return JSON.stringify(dataWithContext) + '\n';
}

function getTextWithContext(
  data: Uint8Array | string,
  context: ExecutionContext
) {
  return {
    message: data,
    [EXECUTION_CONTEXT_LABELS_KEY]: {execution_id: context.executionId},
    [EXECUTION_CONTEXT_TRACE_KEY]: context.traceId,
    [EXECUTION_CONTEXT_SPAN_ID_KEY]: context.spanId,
  };
}

function getJSONWithContext(json: any, context: ExecutionContext) {
  if (EXECUTION_CONTEXT_LABELS_KEY in json) {
    json[EXECUTION_CONTEXT_LABELS_KEY]['execution_id'] = context.executionId;
  } else {
    json[EXECUTION_CONTEXT_LABELS_KEY] = {execution_id: context.executionId};
  }
  return {
    ...json,
    [EXECUTION_CONTEXT_TRACE_KEY]: context.traceId,
    [EXECUTION_CONTEXT_SPAN_ID_KEY]: context.spanId,
  };
}

function processData(data: Uint8Array | string, encoding?: BufferEncoding) {
  let decodedData;
  try {
    if (data instanceof Uint8Array) {
      decodedData = Buffer.from(data.buffer).toString();
    } else {
      decodedData = Buffer.from(data, encoding).toString();
    }
  } catch (e) {
    // Failed to decode, treat it as simple text.
    return {isJSON: false, processedData: data};
  }

  try {
    return {isJSON: true, processedData: JSON.parse(decodedData)};
  } catch (e) {
    return {isJSON: false, processedData: decodedData};
  }
}
