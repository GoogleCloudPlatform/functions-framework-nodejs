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

const PUBSUB_EVENT_TYPE = 'google.pubsub.topic.publish';
const PUBSUB_MESSAGE_TYPE =
  'type.googleapis.com/google.pubsub.v1.PubsubMessage';
const PUBSUB_SERVICE = 'pubsub.googleapis.com';

interface RawPubSubBody {
  subscription: string;
  message: {
    data: string;
    messageId: string;
    attributes: {[key: string]: string};
  };
}

interface PubSubEventBody {
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

interface RawPubSubRequest extends Request {
  body: RawPubSubBody;
}

interface MarshalledPubSubRequest extends Request {
  body: PubSubEventBody;
}

/**
 * Type predicate that checks if a given Request is a RawPubSubRequest
 * @param request a Request object to typecheck
 * @returns true if this Request is a RawPubSubRequest
 */
const isRawPubSubRequest = (request: Request): request is RawPubSubRequest => {
  return !!(
    request.body &&
    request.body.subscription &&
    request.body.message &&
    request.body.message.data &&
    request.body.message.messageId
  );
};

/**
 * Extract the Pub/Sub topic name from the HTTP request path.
 * @param path the URL path of the http request
 * @returns the Pub/Sub topic name if the path matches the expected format,
 * null otherwise
 */
const extractTopic = (path: string): string | null => {
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
 * @param req an unmarshalled http request from a Pub/Sub push subscription
 * @returns the marshalled request body expected by wrapEventFunction
 */
const marshalPubSubRequestBody = (req: RawPubSubRequest): PubSubEventBody => ({
  context: {
    eventId: req.body.message.messageId,
    timestamp: new Date().toISOString(),
    eventType: PUBSUB_EVENT_TYPE,
    resource: {
      service: PUBSUB_SERVICE,
      type: PUBSUB_MESSAGE_TYPE,
      name: extractTopic(req.path),
    },
  },
  data: {
    '@type': PUBSUB_MESSAGE_TYPE,
    data: req.body.message.data,
    attributes: req.body.message.attributes,
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
  if (isRawPubSubRequest(req)) {
    ((req as unknown) as MarshalledPubSubRequest).body = marshalPubSubRequestBody(
      req
    );
  }
  next();
};
