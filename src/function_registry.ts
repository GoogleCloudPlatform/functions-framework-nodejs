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

import {HttpFunction, CloudEventFunction, HandlerFunction} from './functions';
import {CastToDataFunction, noopCastToDataFunction} from './cloudevent_types';
import {SignatureType} from './types';

interface RegisteredFunction {
  signatureType: SignatureType;
  userFunction: HandlerFunction;
  eventDataTypeFunction: CastToDataFunction;
}

/**
 * Singleton map to hold the registered functions
 */
const registrationContainer = new Map<string, RegisteredFunction>();

/**
 * Helper method to store a registered function in the registration container
 */
const register = ({
  functionName,
  signatureType,
  userFunction,
  eventDataTypeFunction,
}: {
  functionName: string;
  signatureType: SignatureType;
  userFunction: HandlerFunction;
  eventDataTypeFunction?: CastToDataFunction;
}): void => {
  registrationContainer.set(functionName, {
    signatureType,
    userFunction,
    eventDataTypeFunction: eventDataTypeFunction || noopCastToDataFunction,
  });
};

/**
 * Get a declaratively registered function
 * @param functionName the name with which the function was registered
 * @returns the registered function and signature type or undefined no function matching
 * the provided name has been registered.
 */
export const getRegisteredFunction = (
  functionName: string
): RegisteredFunction | undefined => {
  return registrationContainer.get(functionName);
};

/**
 * Register a function that responds to HTTP requests.
 * @param functionName - the name of the function
 * @param userFunction - the function to invoke when handling HTTP requests
 * @public
 */
export const http = (
  functionName: string,
  userFunction: HttpFunction
): void => {
  register({
    functionName,
    signatureType: 'http',
    userFunction,
  });
};

/**
 * Register a function that handles CloudEvents.
 * @param functionName - the name of the function
 * @param handler - the function to trigger when handling cloudevents
 * @public
 */
export const cloudevent = (
  functionName: string,
  eventDataTypeOrCloudEventFunction: CastToDataFunction | CloudEventFunction,
  userFunction?: CloudEventFunction
): void => {
  // If only two arguments are provided, the second argument is the handler.
  if (!userFunction) {
    register({
      functionName,
      signatureType: 'cloudevent',
      userFunction: eventDataTypeOrCloudEventFunction as HandlerFunction,
    });
  } else {
    register({
      functionName,
      signatureType: 'cloudevent',
      userFunction,
      eventDataTypeFunction: eventDataTypeOrCloudEventFunction,
    });
  }
};
