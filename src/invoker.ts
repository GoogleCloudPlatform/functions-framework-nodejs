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

import * as bodyParser from 'body-parser';
import * as domain from 'domain';
import * as express from 'express';
import * as http from 'http';
import * as onFinished from 'on-finished';

// HTTP header field that is added to Worker response to signalize problems with
// executing the client function.
const FUNCTION_STATUS_HEADER_FIELD = 'X-Google-Status';

/**
 * The Cloud Functions context object for the event.
 *
 * @link https://cloud.google.com/functions/docs/writing/background#function_parameters
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
  resource?: string;
}

/**
 * The CloudEvents v0.2 context object for the event.
 *
 * @link https://github.com/cloudevents/spec/blob/v0.2/spec.md#context-attributes
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
   * A link to the schema that the event data adheres to.
   */
  schemaurl?: string;
  /**
   * Content type of the event data.
   */
  contenttype?: string;

  // tslint:disable-next-line:no-any CloudEvents extension attributes.
  [key: string]: any;
}

export type Context = CloudFunctionsContext | CloudEventsContext;

export interface HttpFunction {
  // tslint:disable-next-line:no-any express interface.
  (req: express.Request, res: express.Response): any;
}
export interface EventFunctionWithCallback {
  // tslint:disable-next-line:no-any
  (data: {}, context: Context, callback: Function): any;
}
export interface EventFunction {
  // tslint:disable-next-line:no-any
  (data: {}, context: Context): any;
}
export type HandlerFunction =
  | HttpFunction
  | EventFunction
  | EventFunctionWithCallback;

// We optionally annotate the express Request with a rawBody field.
// Express leaves the Express namespace open to allow merging of new fields.
declare global {
  namespace Express {
    export interface Request {
      rawBody?: Buffer;
    }
  }
}

export enum SignatureType {
  HTTP,
  EVENT,
}

/**
 * Checks whether the given user's function is an HTTP function.
 * @param fn User's function.
 * @param functionSignatureType Type of user's function signature.
 * @return True if user's function is an HTTP function, false otherwise.
 */
function isHttpFunction(
  fn: HandlerFunction,
  functionSignatureType: SignatureType
): fn is HttpFunction {
  return functionSignatureType === SignatureType.HTTP;
}

/**
 * Returns user's function from function file.
 * Returns null if function can't be retrieved.
 * @return User's function or null.
 */
export function getUserFunction(
  codeLocation: string,
  functionTarget: string
): HandlerFunction | null {
  try {
    const functionModulePath = getFunctionModulePath(codeLocation);
    if (functionModulePath === null) {
      console.error('Provided code is not a loadable module.');
      return null;
    }

    const functionModule = require(functionModulePath);
    let userFunction = functionTarget
      .split('.')
      .reduce((code, functionTargetPart) => {
        if (typeof code === 'undefined') {
          return undefined;
        } else {
          return code[functionTargetPart];
        }
      }, functionModule);

    // TODO: do we want 'function' fallback?
    if (typeof userFunction === 'undefined') {
      if (functionModule.hasOwnProperty('function')) {
        userFunction = functionModule['function'];
      } else {
        console.error(
          `Function '${functionTarget}' is not defined in the provided ` +
            'module.\nDid you specify the correct target function to execute?'
        );
        return null;
      }
    }

    if (typeof userFunction !== 'function') {
      console.error(
        `'${functionTarget}' needs to be of type function. Got: ` +
          `${typeof userFunction}`
      );
      return null;
    }

    return userFunction as HandlerFunction;
  } catch (ex) {
    let additionalHint: string;
    // TODO: this should be done based on ex.code rather than string matching.
    if (ex.stack && ex.stack.includes('Cannot find module')) {
      additionalHint =
        'Did you list all required modules in the package.json ' +
        'dependencies?\n';
    } else {
      additionalHint = 'Is there a syntax error in your code?\n';
    }
    console.error(
      `Provided module can't be loaded.\n${additionalHint}` +
        `Detailed stack trace: ${ex.stack}`
    );
    return null;
  }
}

// Response object for the most recent request.
let latestRes: express.Response | null = null;

/**
 * Returns resolved path to the module containing the user function.
 * Returns null if the module can not be identified.
 * @param codeLocation Directory with user's code.
 * @return Resolved path or null.
 */
function getFunctionModulePath(codeLocation: string): string | null {
  let path: string | null = null;
  try {
    path = require.resolve(codeLocation);
  } catch (ex) {
    try {
      // TODO: Decide if we want to keep this fallback.
      path = require.resolve(codeLocation + '/function.js');
    } catch (ex) {}
  }
  return path;
}

/**
 * Sends back a response to the incoming request.
 * @param result Output from function execution.
 * @param err Error from function execution.
 * @param res Express response object.
 */
// tslint:disable-next-line:no-any
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
 * Logs an error message and sends back an error response to the incoming
 * request.
 * @param err Error to be logged and sent.
 * @param res Express response object.
 * @param callback A function to be called synchronously.
 */
function logAndSendError(
  // tslint:disable-next-line:no-any
  err: Error | any,
  res: express.Response | null,
  callback?: Function
) {
  console.error(err.stack || err);

  // If user function has already sent response headers, the response with
  // error message cannot be sent. This check is done inside the callback,
  // right before sending the response, to make sure that no concurrent
  // execution sends the response between the check and 'send' call below.
  if (res && !res.headersSent) {
    res.set(FUNCTION_STATUS_HEADER_FIELD, 'crash');
    res.send(err.message || err);
  }
  if (callback) {
    callback();
  }
}

// Set limit to a value larger than 32MB, which is maximum limit of higher level
// layers anyway.
const requestLimit = '1024mb';

/**
 * Retains a reference to the raw body buffer to allow access to the raw body
 * for things like request signature validation.  This is used as the "verify"
 * function in body-parser options.
 * @param req Express request object.
 * @param res Express response object.
 * @param buf Buffer to be saved.
 */
function rawBodySaver(
  req: express.Request,
  res: express.Response,
  buf: Buffer
) {
  req.rawBody = buf;
}

const defaultBodySavingOptions = {
  limit: requestLimit,
  verify: rawBodySaver,
};

const cloudEventsBodySavingOptions = {
  type: 'application/cloudevents+json',
  limit: requestLimit,
  verify: rawBodySaver,
};

// The parser will process ALL content types so must come last.
const rawBodySavingOptions = {
  limit: requestLimit,
  verify: rawBodySaver,
  type: '*/*',
};

// Use extended query string parsing for URL-encoded bodies.
const urlEncodedOptions = {
  limit: requestLimit,
  verify: rawBodySaver,
  extended: true,
};

/**
 * Wraps the provided function into an Express handler function with additional
 * instrumentation logic.
 * @param execute Runs user's function.
 * @return An Express handler function.
 */
function makeHttpHandler(execute: HttpFunction): express.RequestHandler {
  return (req: express.Request, res: express.Response) => {
    const d = domain.create();
    // Catch unhandled errors originating from this request.
    d.on('error', err => {
      if (res.locals.functionExecutionFinished) {
        console.error(`Exception from a finished function: ${err}`);
      } else {
        res.locals.functionExecutionFinished = true;
        logAndSendError(err, res);
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
 * Checks whether the incoming request is a CloudEvents event in binary content
 * mode. This is verified by checking the presence of required headers.
 *
 * @link https://github.com/cloudevents/spec/blob/master/http-transport-binding.md#31-binary-content-mode
 *
 * @param req Express request object.
 * @return True if the request is a CloudEvents event in binary content mode,
 *     false otherwise.
 */
function isBinaryCloudEvent(req: express.Request): boolean {
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
function getBinaryCloudEventContext(req: express.Request): CloudEventsContext {
  const context: CloudEventsContext = {};
  for (const name in req.headers) {
    if (name.startsWith('ce-')) {
      const attributeName = name.substr('ce-'.length);
      context[attributeName] = req.header(name);
    }
  }
  return context;
}

/**
 * Wraps event function (or event function with callback) in HTTP function
 * signature.
 * @param userFunction User's function.
 * @return HTTP function which wraps the provided event function.
 */
function wrapEventFunction(
  userFunction: EventFunction | EventFunctionWithCallback
): HttpFunction {
  return (req: express.Request, res: express.Response) => {
    const event = req.body;
    const callback = process.domain.bind(
      // tslint:disable-next-line:no-any
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
    // Populating data for behavior compliant with parameter settings of Cloud PubSub
    // https://cloud.google.com/functions/docs/writing/background#function_parameters
    if (!data && event.message) {
      data = event.message!.data;
      if (!context.eventId) {
        context.eventId = event.message.messageId;
      }
      if (!context.timestamp) {
        context.timestamp =
          event.message.publishTime || new Date().toISOString();
      }
      if (!context.eventType) {
        context.eventType = 'google.pubsub.topic.publish';
      }
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

/**
 * Registers handler functions for route paths.
 * @param app Express application object.
 * @param userFunction User's function.
 * @param functionSignatureType Type of user's function signature.
 */
function registerFunctionRoutes(
  app: express.Application,
  userFunction: HandlerFunction,
  functionSignatureType: SignatureType
) {
  if (isHttpFunction(userFunction!, functionSignatureType)) {
    app.use('/favicon.ico|/robots.txt', (req, res, next) => {
      res.sendStatus(404);
    });

    app.use('/*', (req, res, next) => {
      onFinished(res, (err, res) => {
        res.locals.functionExecutionFinished = true;
      });
      next();
    });

    app.all('/*', (req, res, next) => {
      const handler = makeHttpHandler(userFunction);
      handler(req, res, next);
    });
  } else {
    app.post('/*', (req, res, next) => {
      const wrappedUserFunction = wrapEventFunction(userFunction);
      const handler = makeHttpHandler(wrappedUserFunction);
      handler(req, res, next);
    });
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
      logAndSendError(err, latestRes, killInstance);
    });

    process.on('unhandledRejection', err => {
      console.error('Unhandled rejection');
      logAndSendError(err, latestRes, killInstance);
    });

    process.on('exit', code => {
      logAndSendError(new Error(`Process exited with code ${code}`), latestRes);
    });

    process.on('SIGTERM', () => {
      this.server.close(() => {
        process.exit();
      });
    });
  }
}

/**
 * Creates and configures an Express application and returns an HTTP server
 * which will run it.
 * @param userFunction User's function.
 * @param functionSignatureType Type of user's function signature.
 * @return HTTP server.
 */
export function getServer(
  userFunction: HandlerFunction,
  functionSignatureType: SignatureType
): http.Server {
  // App to use for function executions.
  const app = express();

  // Set request-specific values in the very first middleware.
  app.use('/*', (req, res, next) => {
    latestRes = res;
    res.locals.functionExecutionFinished = false;
    next();
  });

  app.use(bodyParser.json(cloudEventsBodySavingOptions));
  app.use(bodyParser.json(defaultBodySavingOptions));
  app.use(bodyParser.text(defaultBodySavingOptions));
  app.use(bodyParser.urlencoded(urlEncodedOptions));

  // MUST be last in the list of body parsers as subsequent parsers will be
  // skipped when one is matched.
  app.use(bodyParser.raw(rawBodySavingOptions));

  registerFunctionRoutes(app, userFunction, functionSignatureType);

  app.enable('trust proxy'); // To respect X-Forwarded-For header.

  return http.createServer(app);
}
