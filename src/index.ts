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

// Functions Framework entrypoint configures and starts a Node.js server
// that invokes a function in response to an HTTP request.

import * as minimist from 'minimist';

import {
  ErrorHandler,
  SignatureType,
  getServer,
  getUserFunction,
} from './invoker';

// Supported command-line flags
const FLAG = {
  PORT: 'port',
  TARGET: 'target',
  SIGNATURE_TYPE: 'signature-type', // dash
};

// Supported environment variables
const ENV = {
  PORT: 'PORT',
  TARGET: 'FUNCTION_TARGET',
  SIGNATURE_TYPE: 'FUNCTION_SIGNATURE_TYPE', // underscore
};

enum NodeEnv {
  PRODUCTION = 'production',
}

const argv = minimist(process.argv, {
  string: [FLAG.PORT, FLAG.TARGET, FLAG.SIGNATURE_TYPE],
});

const CODE_LOCATION = process.cwd();
const PORT = argv[FLAG.PORT] || process.env[ENV.PORT] || '8080';
const TARGET = argv[FLAG.TARGET] || process.env[ENV.TARGET] || 'function';

const SIGNATURE_TYPE_STRING =
  argv[FLAG.SIGNATURE_TYPE] || process.env[ENV.SIGNATURE_TYPE] || 'http';
const SIGNATURE_TYPE =
  SignatureType[
    SIGNATURE_TYPE_STRING.toUpperCase() as keyof typeof SignatureType
  ];
if (SIGNATURE_TYPE === undefined) {
  console.error(`Function signature type must be one of 'http' or 'event'.`);
  process.exit(1);
}

const USER_FUNCTION = getUserFunction(CODE_LOCATION, TARGET);
if (!USER_FUNCTION) {
  console.error('Could not load the function, shutting down.');
  process.exit(1);
}

const SERVER = getServer(USER_FUNCTION!, SIGNATURE_TYPE!);
const ERROR_HANDLER = new ErrorHandler(SERVER);
SERVER.listen(PORT, () => {
  ERROR_HANDLER.register();
  if (process.env.NODE_ENV !== NodeEnv.PRODUCTION) {
    console.log('Serving function...');
    console.log(`Function: ${TARGET}`);
    console.log(`URL: http://localhost:${PORT}/`);
  }
}).setTimeout(0); // Disable automatic timeout on incoming connections.
