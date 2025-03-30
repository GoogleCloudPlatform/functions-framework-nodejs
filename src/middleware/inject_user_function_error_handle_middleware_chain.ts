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
import {Express} from 'express';
import {HandlerFunction} from '../functions';
import {ILayer} from 'express-serve-static-core';

/**
 * Common properties that exists on Express object instances. Extracted by calling
 * `Object.getOwnPropertyNames` on an express instance.
 */
const COMMON_EXPRESS_OBJECT_PROPERTIES = [
  '_router',
  'use',
  'get',
  'post',
  'put',
  'delete',
];

/** The number of parameters on an express error handler. */
const EXPRESS_ERROR_HANDLE_PARAM_LENGTH = 4;

/**
 * Injects the user function error handle middleware and its subsequent middleware
 * chain into the framework. This enables users to handle framework errors that would
 * otherwise be handled by the default Express error handle.
 * @param frameworkApp - Framework app
 * @param userFunction - User handler function
 */
export const injectUserFunctionErrorHandleMiddlewareChain = (
  frameworkApp: Express,
  userFunction: HandlerFunction
) => {
  // Check if user function is an express app that can register middleware.
  if (!isExpressApp(userFunction)) {
    return;
  }

  // Get the index of the user's first error handle middleware.
  const firstErrorHandleMiddlewareIndex =
    getFirstUserFunctionErrorHandleMiddlewareIndex(userFunction);
  if (!firstErrorHandleMiddlewareIndex) {
    return;
  }

  // Inject their error handle middleware chain into the framework app.
  const middlewares = (userFunction as Express)._router.stack;
  for (
    let index = firstErrorHandleMiddlewareIndex;
    index < middlewares.length;
    index++
  ) {
    const middleware = middlewares[index];

    // We don't care about routes.
    if (middleware.route) {
      continue;
    }

    frameworkApp.use(middleware.handle);
  }
};

/**
 * Returns if the user function contains common properties of an Express app.
 * @param userFunction
 */
const isExpressApp = (userFunction: HandlerFunction): boolean => {
  const userFunctionProperties = Object.getOwnPropertyNames(userFunction);
  return COMMON_EXPRESS_OBJECT_PROPERTIES.every(prop =>
    userFunctionProperties.includes(prop)
  );
};

/**
 * Returns the index of the first error handle middleware in the user function.
 */
const getFirstUserFunctionErrorHandleMiddlewareIndex = (
  userFunction: HandlerFunction
): number | null => {
  const middlewares: ILayer[] = (userFunction as Express)._router.stack;
  for (let index = 0; index < middlewares.length; index++) {
    const middleware = middlewares[index];
    if (
      middleware.handle &&
      middleware.handle.length === EXPRESS_ERROR_HANDLE_PARAM_LENGTH
    ) {
      return index;
    }
  }

  return null;
};
