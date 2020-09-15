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
import * as onFinished from 'on-finished';
import {HandlerFunction} from './functions';
import {SignatureType} from './types';
import {
  makeHttpHandler,
  wrapEventFunction,
  wrapCloudEventFunction,
} from './invoker';
import {
  HttpFunction,
  EventFunction,
  EventFunctionWithCallback,
  CloudEventFunction,
  CloudEventFunctionWithCallback,
} from './functions';

/**
 * Registers handler functions for route paths.
 * @param app Express application object.
 * @param userFunction User's function.
 * @param functionSignatureType Type of user's function signature.
 */
export function registerFunctionRoutes(
  app: express.Application,
  userFunction: HandlerFunction,
  functionSignatureType: SignatureType
) {
  if (functionSignatureType === SignatureType.HTTP) {
    app.use('/favicon.ico|/robots.txt', (req, res) => {
      // Neither crawlers nor browsers attempting to pull the icon find the body
      // contents particularly useful, so we send nothing in the response body.
      res.status(404).send(null);
    });

    app.use('/*', (req, res, next) => {
      onFinished(res, (err, res) => {
        res.locals.functionExecutionFinished = true;
      });
      next();
    });

    app.all('/*', (req, res, next) => {
      const handler = makeHttpHandler(userFunction as HttpFunction);
      handler(req, res, next);
    });
  } else if (functionSignatureType === SignatureType.EVENT) {
    app.post('/*', (req, res, next) => {
      const wrappedUserFunction = wrapEventFunction(
        userFunction as EventFunction | EventFunctionWithCallback
      );
      const handler = makeHttpHandler(wrappedUserFunction);
      handler(req, res, next);
    });
  } else {
    app.post('/*', (req, res, next) => {
      const wrappedUserFunction = wrapCloudEventFunction(
        userFunction as CloudEventFunction | CloudEventFunctionWithCallback
      );
      const handler = makeHttpHandler(wrappedUserFunction);
      handler(req, res, next);
    });
  }
}
