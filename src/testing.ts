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

// This module provides a set of utility functions that are useful for unit testing Cloud Functions.
import {Server} from 'http';

import {HandlerFunction} from '.';
import {getRegisteredFunction} from './function_registry';
import {getServer} from './server';

/**
 * Testing utility for retrieving a function registered with the Functions Framework
 * @param functionName the name of the function to get
 * @returns a function that was registered with the Functions Framework
 *
 * @beta
 */
export const getFunction = (
  functionName: string
): HandlerFunction | undefined => {
  return getRegisteredFunction(functionName)?.userFunction;
};

/**
 * Create an Express server that is configured to invoke a function that was
 * registered with the Functions Framework. This is a useful utility for testing functions
 * using [supertest](https://www.npmjs.com/package/supertest).
 * @param functionName the name of the function to wrap in the test server
 * @returns a function that was registered with the Functions Framework
 *
 * @beta
 */
export const getTestServer = (functionName: string): Server => {
  const registeredFunction = getRegisteredFunction(functionName);
  if (!registeredFunction) {
    throw new Error(
      `The provided function "${functionName}" was not registered. Did you forget to require the module that defined it?`
    );
  }
  return getServer(
    registeredFunction.userFunction,
    registeredFunction.signatureType
  );
};
