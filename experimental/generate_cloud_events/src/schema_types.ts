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

// A collection of interfaces that describe the structure of the JSON schema
// files in the googleapis/google-cloudevents repo.

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Schema of a string property
 */
export interface StringSchemaProperty {
  type: 'string';
  description: string;
}

/**
 * Schema of a number property
 */
export interface NumberSchemaProperty {
  type: 'number';
  description: string;
}

/**
 * Schema of a integer property
 */
export interface IntegerSchemaProperty {
  type: 'integer';
  description: string;
}

/**
 * Schema of a object property
 */
export interface ObjectSchemaProperty {
  type: 'object';
  description: string;
  additionalProperties: boolean;
}

/**
 * Schema of a boolean property
 */
export interface BooleanSchemaProperty {
  type: 'boolean';
  description: string;
}

/**
 * Schema of a ref property
 */
export interface RefSchemaProperty {
  $ref: string;
  additionalProperties: boolean;
  description: string;
}

/**
 * Schema of a enum property
 */
export interface EnumSchemaProperty {
  enum: {[key: string]: number};
  description: string;
}

/**
 * Schema of a array property
 */
export interface ArraySchemaProperty {
  type: 'array';
  items: SchemaProperty;
  description: string;
}

/**
 * Schema of a oneof property
 */
export interface OneOfSchemaProperty {
  oneOf: SchemaProperty[];
  description: string;
}

/**
 * Union of all known schema properties.
 */
export type SchemaProperty =
  | StringSchemaProperty
  | NumberSchemaProperty
  | ObjectSchemaProperty
  | RefSchemaProperty
  | BooleanSchemaProperty
  | EnumSchemaProperty
  | ArraySchemaProperty
  | IntegerSchemaProperty
  | OneOfSchemaProperty;

/**
 * The schema of an interface definition schema.
 */
export interface InterfaceDefinitionSchema {
  properties: {
    [key: string]: SchemaProperty;
  };
  description?: string;
}

/**
 * The top level schema of a cloudevent data payload.
 */
export interface TypeSchema {
  $id: string;
  name: string;
  examples: string[];
  package: string;
  datatype: string;
  cloudeventTypes: string[];
  product: string;
  $schema: string;
  $ref: string;
  definitions: {[key: string]: InterfaceDefinitionSchema};
}

/**
 * The catalog of all cloudevent data types included in the googleapis/google-cloudevents repo.
 *
 */
export interface EventCatalog {
  $schema: string;
  version: number;
  schemas: {
    url: string;
    product: string;
    name: string;
    description: string;
    datatype: string;
    cloudeventTypes: string[];
  }[];
}

/**
 * Type guard to check if a given schema property is a RefSchemaProperty
 * @param prop the schema property to check the type of
 * @returns true if the given property is a RefSchemaProperty
 */
export const isRefProp = (prop: any): prop is RefSchemaProperty =>
  !!prop['$ref'];

/**
 * Type guard to check if a given schema property is a EnumSchemaProperty
 * @param prop the schema property to check the type of
 * @returns true if the given property is a EnumSchemaProperty
 */
export const isEnumProp = (prop: any): prop is EnumSchemaProperty =>
  !!prop['enum'];

/**
 * Type guard to check if a given schema property is a OneOfSchemaProperty
 * @param prop the schema property to check the type of
 * @returns true if the given property is a OneOfSchemaProperty
 */
export const isOneOfProp = (prop: any): prop is OneOfSchemaProperty =>
  !!prop['oneOf'];
