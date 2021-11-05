/**
 * The CloudEvents v1.0 context object for the event.
 * {@link https://github.com/cloudevents/spec/blob/master/spec.md#context-attributes}
 * @public
 */
export interface CloudEvent {
  /**
   * Type of occurrence which has happened.
   */
  type?: string;
  /**
   * The version of the CloudEvents specification which the event uses.
   */
  specversion?: string;
  /**
   * The event producer.
   */
  source?: string;
  /**
   * ID of the event.
   */
  id?: string;
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
   * The event data.
   */
  data?:
    | Record<string, unknown | string | number | boolean>
    | string
    | number
    | boolean
    | null
    | unknown;
  /**
   * The traceparent string, containing a trace version, trace ID, span ID, and trace options.
   * @see https://github.com/cloudevents/spec/blob/master/extensions/distributed-tracing.md
   */
  traceparent?: string;
}
