#!/usr/bin/env node

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

// Functions framework entry point that configures and starts Node.js server
// that runs user's code on HTTP request.
// The following environment variables can be set to configure the framework:
//   - PORT - defines the port on which this server listens to all HTTP
//     requests.
//   - FUNCTION_TARGET - defines the name of the function within user's
//     node module to execute. If such a function is not defined,
//     then falls back to 'function' name.
//   - FUNCTION_SIGNATURE_TYPE - defines the type of the client function
//     signature, 'http' for function signature with HTTP request and HTTP
//     response arguments, or 'event' for function signature with arguments
//     unmarshalled from an incoming request.

import * as minimist from 'minimist';
import {
  ErrorHandler,
  FunctionSignatureType,
  getServer,
  getUserFunction,
} from './invoker';

enum NodeEnv {
  PRODUCTION = 'production',
}

const argv = minimist(process.argv, {
  string: ['port', 'function-target', 'function-signature-type'],
});

const CODE_LOCATION = process.cwd();
const PORT = argv['port'] || process.env.PORT || '8080';
const FUNCTION_TARGET =
  argv['function-target'] || process.env.FUNCTION_TARGET || 'function';

const FUNCTION_SIGNATURE_TYPE_STRING =
  argv['function-signature-type'] ||
  process.env.FUNCTION_SIGNATURE_TYPE ||
  'http';
const FUNCTION_SIGNATURE_TYPE =
  FunctionSignatureType[
    FUNCTION_SIGNATURE_TYPE_STRING.toUpperCase() as keyof typeof FunctionSignatureType
  ];
if (FUNCTION_SIGNATURE_TYPE === undefined) {
  console.error(`FUNCTION_SIGNATURE_TYPE must be one of 'http' or 'event'.`);
  process.exit(1);
}

const USER_FUNCTION = getUserFunction(CODE_LOCATION, FUNCTION_TARGET);
if (!USER_FUNCTION) {
  console.error('Could not load the function, shutting down.');
  process.exit(1);
}

const SERVER = getServer(USER_FUNCTION!, FUNCTION_SIGNATURE_TYPE!);
const ERROR_HANDLER = new ErrorHandler(SERVER);
SERVER.listen(PORT, () => {
  ERROR_HANDLER.register();
  if (process.env.NODE_ENV !== NodeEnv.PRODUCTION) {
    console.log('Serving function...');
    console.log(`Function: ${FUNCTION_TARGET}`);
    console.log(`URL: http://localhost:${PORT}/`);
  }
}).setTimeout(0); // Disable automatic timeout on incoming connections.
