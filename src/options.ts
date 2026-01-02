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

import * as minimist from 'minimist';
import * as semver from 'semver';
import {resolve} from 'path';
import {isValidSignatureType, SignatureType} from './types';

/**
 * Error thrown when an invalid option is provided.
 */
export class OptionsError extends Error {}

/**
 * The set of all options that can be used to configure the behaviour of
 * the framework.
 */
export interface FrameworkOptions {
  /**
   * The port on which this server listens to all HTTP requests.
   */
  port: string;
  /**
   * The name of the function within user's node module to execute. If such a
   * function is not defined, then falls back to 'function' name.
   */
  target: string;
  /**
   * The path to the source code file containing the client function.
   */
  sourceLocation: string;
  /**
   * The signature type of the client function.
   */
  signatureType: SignatureType;
  /**
   * Whether or not the --help CLI flag was provided.
   */
  printHelp: boolean;
  /**
   * Whether or not to enable execution id support.
   */
  enableExecutionId: boolean;
  /**
   * The request timeout.
   */
  timeoutMilliseconds: number;
  /**
   * Routes that should return a 404 without invoking the function.
   */
  ignoredRoutes: string | null;
  /**
   * Whether or not to propagate framework errors to the client.
   */
  propagateFrameworkErrors: boolean;
}

/**
 * Helper class for parsing an configurable option from provided CLI flags
 * or environment variables.
 */
class ConfigurableOption<T> {
  constructor(
    /**
     * The CLI flag that can be use to configure this option.
     */
    public readonly cliOption: string,
    /**
     * The name of the environment variable used to configure this option.
     */
    private envVar: string,
    /**
     * The default value used when this option is not configured via a CLI flag
     * or environment variable.
     */
    private defaultValue: T,
    /**
     * A function used to valid the user provided value.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private validator: (x: any) => T = x => x as T,
  ) {}

  parse(cliArgs: minimist.ParsedArgs, envVars: NodeJS.ProcessEnv): T {
    return this.validator(
      cliArgs[this.cliOption] ?? envVars[this.envVar] ?? this.defaultValue,
    );
  }
}

const PortOption = new ConfigurableOption('port', 'PORT', '8080');
const FunctionTargetOption = new ConfigurableOption(
  'target',
  'FUNCTION_TARGET',
  'function',
);
const SourceLocationOption = new ConfigurableOption(
  'source',
  'FUNCTION_SOURCE',
  '',
  resolve,
);
const SignatureOption = new ConfigurableOption(
  'signature-type',
  'FUNCTION_SIGNATURE_TYPE',
  'http' as SignatureType,
  x => {
    if (isValidSignatureType(x)) {
      return x;
    }
    throw new OptionsError(
      `Function signature type must be one of: ${SignatureType.join(', ')}.`,
    );
  },
);
const TimeoutOption = new ConfigurableOption(
  'timeout',
  'CLOUD_RUN_TIMEOUT_SECONDS',
  0,
  (x: string | number) => {
    if (typeof x === 'string') {
      x = parseInt(x, 10);
    }
    if (isNaN(x) || x < 0) {
      throw new OptionsError('Timeout must be a positive integer');
    }
    return x * 1000;
  },
);
const IgnoredRoutesOption = new ConfigurableOption<string | null>(
  'ignored-routes',
  'IGNORED_ROUTES',
  null, // null by default so we can detect if it is explicitly set to ""
);

export const requiredNodeJsVersionForLogExecutionID = '13.0.0';
const ExecutionIdOption = new ConfigurableOption(
  'log-execution-id',
  'LOG_EXECUTION_ID',
  false,
  x => {
    const nodeVersion = process.versions.node;
    const isVersionSatisfied = semver.gte(
      nodeVersion,
      requiredNodeJsVersionForLogExecutionID,
    );
    const isTrue =
      (typeof x === 'boolean' && x) ||
      (typeof x === 'string' && x.toLowerCase() === 'true');
    if (isTrue && !isVersionSatisfied) {
      console.warn(
        `Execution id is only supported with Node.js versions
        ${requiredNodeJsVersionForLogExecutionID} and above. Your
        current version is ${nodeVersion}. Please upgrade.`,
      );
      console.warn('Proceeding with execution id support disabled...');
      return false;
    }
    return isTrue;
  },
);

const PropagateFrameworkErrorsOption = new ConfigurableOption(
  'propagate-framework-errors',
  'PROPAGATE_FRAMEWORK_ERRORS',
  false,
  x => {
    return (
      (typeof x === 'boolean' && x) ||
      (typeof x === 'string' && x.toLowerCase() === 'true')
    );
  }
);

export const helpText = `Example usage:
  functions-framework --target=helloWorld --port=8080
Documentation:
  https://github.com/GoogleCloudPlatform/functions-framework-nodejs`;

/**
 * Parse the configurable framework options from the provided CLI arguments and
 * environment variables.
 * @param cliArgs - The raw command line arguments
 * @param envVars - The environment variables to parse options from
 * @returns The parsed options that should be used to configure the framework
 */
export const parseOptions = (
  cliArgs: string[] = process.argv,
  envVars: NodeJS.ProcessEnv = process.env,
): FrameworkOptions => {
  const argv = minimist(cliArgs, {
    string: [
      PortOption.cliOption,
      FunctionTargetOption.cliOption,
      SignatureOption.cliOption,
      SourceLocationOption.cliOption,
      TimeoutOption.cliOption,
      IgnoredRoutesOption.cliOption,
      PropagateFrameworkErrorsOption.cliOption,
    ],
  });
  return {
    port: PortOption.parse(argv, envVars),
    target: FunctionTargetOption.parse(argv, envVars),
    sourceLocation: SourceLocationOption.parse(argv, envVars),
    signatureType: SignatureOption.parse(argv, envVars),
    timeoutMilliseconds: TimeoutOption.parse(argv, envVars),
    printHelp: cliArgs[2] === '-h' || cliArgs[2] === '--help',
    enableExecutionId: ExecutionIdOption.parse(argv, envVars),
    ignoredRoutes: IgnoredRoutesOption.parse(argv, envVars),
    propagateFrameworkErrors: PropagateFrameworkErrorsOption.parse(
      argv,
      envVars
    ),
  };
};
