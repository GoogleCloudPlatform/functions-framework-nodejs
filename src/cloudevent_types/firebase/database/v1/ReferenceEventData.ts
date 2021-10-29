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

/* eslint-disable @typescript-eslint/no-explicit-any*/

/**
 * The data within all Firebase Real Time Database reference events.
 *
 * @public
 */
export interface ReferenceEventData {
  /**
   * `Value` represents a dynamically typed value which can be either
   * null, a number, a string, a boolean, a recursive struct value, or a
   * list of values. A producer of value is expected to set one of that
   * variants, absence of any variant indicates an error.
   *
   * The JSON representation for `Value` is JSON value.
   */
  data: any[] | boolean | number | object | string;

  /**
   * `Value` represents a dynamically typed value which can be either
   * null, a number, a string, a boolean, a recursive struct value, or a
   * list of values. A producer of value is expected to set one of that
   * variants, absence of any variant indicates an error.
   *
   * The JSON representation for `Value` is JSON value.
   */
  delta: any[] | boolean | number | object | string;
}
