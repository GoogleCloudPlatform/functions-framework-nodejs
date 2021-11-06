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

/**
 * The CloudEvents v1.0 context attributes.
 * {@link https://github.com/cloudevents/spec/blob/v1.0.1/spec.md#context-attributes}
 * @public
 */
export interface CloudEventsContext {
  /**
   * ID of the event.
   */
  id: string;
  /**
   * The event producer.
   */
  source: string;
  /**
   * The version of the CloudEvents specification which the event uses.
   */
  specversion: string;
  /**
   * Type of occurrence which has happened.
   */
  type: string;
  /**
   * Timestamp of when the event happened.
   */
  time?: string;
  /**
   * Describes the subject of the event in the context of the event producer.
   */
  subject?: string;
  /**
   * A link to the schema that the event data adheres to.
   */
  dataschema?: string;
  /**
   * Content type of the event data.
   */
  datacontenttype?: string;
  /**
   * The traceparent string, containing a trace version, trace ID, span ID, and trace options.
   * @see https://github.com/cloudevents/spec/blob/master/extensions/distributed-tracing.md
   */
  traceparent?: string;
  /**
   * The event payload.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}
