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
import {Request, Response, NextFunction} from 'express';
import {isBinaryCloudEvent} from './cloud_events';

const PUBSUB_EVENT_TYPE = 'google.pubsub.topic.publish';
const PUBSUB_MESSAGE_TYPE =
  'type.googleapis.com/google.pubsub.v1.PubsubMessage';
const PUBSUB_SERVICE = 'pubsub.googleapis.com';

/**
 * The request body of an HTTP request received directly from a Pub/Sub subscription.
 *
 * {@link https://cloud.google.com/pubsub/docs/push?hl=en#receiving_messages}
 */
export interface RawPubSubBody {
  /**
   * The name of the subscription for which this request was made. Format is:
   * projects/{project}/subscriptions/{sub}.
   */
  subscription: string;
  /**
   * A message that is published by publishers and consumed by subscribers. The message must
   * contain either a non-empty data field or at least one attribute.
   *
   * {@link https://cloud.google.com/pubsub/docs/reference/rest/v1/PubsubMessage}
   */
  message: {
    /**
     * Attributes for this message. If this field is empty, the message must contain non-empty
     * data.
     */
    attributes?: {[key: string]: string};
    /**
     * Base64 encoded message data. If this field is empty, the message must contain at least one
     * attribute.
     */
    data: string;
    /**
     * ID of this message, assigned by the server when the message is published. Guaranteed to be
     * unique within the topic.
     */
    messageId: string;
    /**
     * If non-empty, identifies related messages for which publish order should be respected. This
     * field is not set by the Pub/Sub emulator.
     */
    orderingKey?: string;
    /**
     * The time at which the message was published, formatted as timestamp in RFC3339 UTC "Zulu"
     * format. This field is not set by the Pub/Sub emulator.
     */
    publishTime?: string;
  };
}

/**
 * The request body schema that is expected by the downstream by the function loader for Pub/Sub
 * event functions.
 */
export interface MarshalledPubSubBody {
  context: {
    eventId: string;
    timestamp: string;
    eventType: typeof PUBSUB_EVENT_TYPE;
    resource: {
      service: typeof PUBSUB_SERVICE;
      type: typeof PUBSUB_MESSAGE_TYPE;
      name: string | null;
    };
  };
  data: {
    '@type': typeof PUBSUB_MESSAGE_TYPE;
    data: string;
    attributes: {[key: string]: string};
  };
}

/**
 * Type predicate that checks if a given Request is a RawPubSubRequest
 * @param request a Request object to typecheck
 * @returns true if this Request is a RawPubSubRequest
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isRawPubSubRequestBody = (body: any): body is RawPubSubBody => {
  return !!(
    body &&
    !body.context &&
    body.subscription &&
    body.message &&
    body.message.data &&
    body.message.messageId
  );
};

/**
 * Extract the Pub/Sub topic name from the HTTP request path.
 * @param path the URL path of the http request
 * @returns the Pub/Sub topic name if the path matches the expected format,
 * null otherwise
 */
const extractPubSubTopic = (path: string): string | null => {
  const parsedTopic = path.match(/projects\/[^/?]+\/topics\/[^/?]+/);
  if (parsedTopic) {
    return parsedTopic[0];
  }
  console.warn('Failed to extract the topic name from the URL path.');
  console.warn(
    "Configure your subscription's push endpoint to use the following path: ",
    'projects/PROJECT_NAME/topics/TOPIC_NAME'
  );
  return null;
};

/**
 * Marshal the body of an HTTP request from a Pub/Sub subscription
 * @param body an unmarshalled http request body from a Pub/Sub push subscription
 * @param path the HTTP request path
 * @returns the marshalled request body expected by wrapEventFunction
 */
const marshalPubSubRequestBody = (
  body: RawPubSubBody,
  path: string
): MarshalledPubSubBody => ({
  context: {
    eventId: body.message.messageId,
    timestamp: body.message.publishTime || new Date().toISOString(),
    eventType: PUBSUB_EVENT_TYPE,
    resource: {
      service: PUBSUB_SERVICE,
      type: PUBSUB_MESSAGE_TYPE,
      name: extractPubSubTopic(path),
    },
  },
  data: {
    '@type': PUBSUB_MESSAGE_TYPE,
    data: body.message.data,
    attributes: body.message.attributes || {},
  },
});

/**
 * Express middleware used to marshal the HTTP request body received directly from a
 * Pub/Sub subscription into the format that is expected downstream by wrapEventFunction
 * @param req express request object
 * @param res express response object
 * @param next function used to pass control to the next middle middleware function in the stack
 */
export const legacyPubSubEventMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {body, path} = req;
  if (isRawPubSubRequestBody(body) && !isBinaryCloudEvent(req)) {
    req.body = marshalPubSubRequestBody(body, path);
  }
  next();
};
