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

// HTTP header field that is added to Worker response to signalize problems with
// executing the client function.
export const FUNCTION_STATUS_HEADER_FIELD = 'X-Google-Status';

/**
 * List of function signature types that are supported by the framework.
 */
export const SignatureType = ['http', 'event', 'cloudevent', 'typed'] as const;

/**
 * Union type of all valid function SignatureType values.
 */
export type SignatureType = typeof SignatureType[number];

/**
 * Type guard to test if a provided value is valid SignatureType
 * @param x the value to test
 * @returns true if the provided value is a valid SignatureType
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isValidSignatureType = (x: any): x is SignatureType => {
  return SignatureType.includes(x);
};
