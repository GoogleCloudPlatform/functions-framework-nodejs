/// <reference types="node" />

import * as express from 'express';

/**
 * Register a function that handles CloudEvents.
 * @param functionName - the name of the function
 * @param handler - the function to trigger when handling CloudEvents
 * @public
 */
export declare const cloudEvent: (functionName: string, handler: CloudEventFunction) => void;

/**
 * A CloudEvent function handler.
 * @public
 */
export declare interface CloudEventFunction {
    (cloudEvent: CloudEventsContext): any;
}

/**
 * A CloudEvent function handler with callback.
 * @public
 */
export declare interface CloudEventFunctionWithCallback {
    (cloudEvent: CloudEventsContext, callback: Function): any;
}

/**
 * The CloudEvents v1.0 context attributes.
 * {@link https://github.com/cloudevents/spec/blob/v1.0.1/spec.md#context-attributes}
 * @public
 */
export declare interface CloudEventsContext {
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
    data?: any;
}

/**
 * The Cloud Functions context object for the event.
 * {@link https://cloud.google.com/functions/docs/writing/background#function_parameters}
 * @public
 */
export declare interface CloudFunctionsContext {
    /**
     * A unique ID for the event. For example: "70172329041928".
     */
    eventId?: string;
    /**
     * The date/time this event was created. For example: "2018-04-09T07:56:12.975Z"
     * This will be formatted as ISO 8601.
     */
    timestamp?: string;
    /**
     * The type of the event. For example: "google.pubsub.topic.publish".
     */
    eventType?: string;
    /**
     * The resource that emitted the event.
     */
    resource?: string | {
        [key: string]: string;
    };
}

/**
 * The function's context.
 * @public
 */
export declare type Context = CloudFunctionsContext | CloudEventsContext;

/**
 * A data object used for legacy event functions.
 * @public
 */
export declare interface Data {
    data: object;
}

/**
 * A legacy event function handler.
 * @public
 */
export declare interface EventFunction {
    (data: {}, context: Context): any;
}

/**
 * A legacy event function handler with callback.
 * @public
 */
export declare interface EventFunctionWithCallback {
    (data: {}, context: Context, callback: Function): any;
}

/**
 * A function handler.
 * @public
 */
export declare type HandlerFunction = HttpFunction | EventFunction | EventFunctionWithCallback | CloudEventFunction | CloudEventFunctionWithCallback;

/**
 * Register a function that responds to HTTP requests.
 * @param functionName - the name of the function
 * @param handler - the function to invoke when handling HTTP requests
 * @public
 */
export declare const http: (functionName: string, handler: HttpFunction) => void;

/**
 * A HTTP function handler.
 * @public
 */
export declare interface HttpFunction {
    (req: Request_2, res: Response_2): any;
}

/**
 * A legacy event function context.
 * @public
 */
export declare type LegacyCloudFunctionsContext = CloudFunctionsContext | Data;

/**
 * A legacy event.
 * @public
 */
export declare interface LegacyEvent {
    data: {
        [key: string]: any;
    };
    context: CloudFunctionsContext;
}

/**
 * @public
 */
declare interface Request_2 extends express.Request {
    /**
     * A buffer which provides access to the request's raw HTTP body.
     */
    rawBody?: Buffer;
}
export { Request_2 as Request }

/**
 * @public
 */
declare type Response_2 = express.Response;
export { Response_2 as Response }

export { }
