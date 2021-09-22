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
import {getUserFunction} from './loader';
import {ErrorHandler} from './invoker';
import {getServer} from './server';
import {parseOptions, helpText, OptionsError} from './options';

(async () => {
  try {
    const options = parseOptions();

    if (options.printHelp) {
      console.error(helpText);
      return;
    }
    const userFunction = await getUserFunction(
      options.sourceLocation,
      options.target
    );
    if (!userFunction) {
      console.error('Could not load the function, shutting down.');
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
    const server = getServer(userFunction!, options.signatureType);
    const errorHandler = new ErrorHandler(server);
    server
      .listen(options.port, () => {
        errorHandler.register();
        if (process.env.NODE_ENV !== 'production') {
          console.log('Serving function...');
          console.log(`Function: ${options.target}`);
          console.log(`Signature type: ${options.signatureType}`);
          console.log(`URL: http://localhost:${options.port}/`);
        }
      })
      .setTimeout(0); // Disable automatic timeout on incoming connections.
  } catch (e) {
    if (e instanceof OptionsError) {
      console.error(e.message);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
    throw e;
  }
})();
