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
 * The event data when a message is published to a topic.
 */
export interface MessagePublishedData {
  /**
   * The message that was published.
   */
  message: PubsubMessage;

  /**
   * The resource name of the subscription for which this event was
   * generated. The format of the value is
   * `projects/{project-id}/subscriptions/{subscription-id}`.
   */
  subscription: string;
}

/**
 * A message published to a topic.
 */
export interface PubsubMessage {
  /**
   * The binary data in the message.
   */
  data: string;

  /**
   * Attributes for this message.
   */
  attributes: object;

  /**
   * ID of this message, assigned by the server when the message is published.
   * Guaranteed to be unique within the topic.
   */
  messageId: string;

  /**
   * The time at which the message was published, populated by the server when
   * it receives the `Publish` call.
   */
  publishTime: string;

  /**
   * If non-empty, identifies related messages for which publish order should be
   * respected.
   */
  orderingKey: string;
}

/**
 * The CloudEvent schema emmitted by Cloud Pub/Sub.
 */
export interface MessagePublishedCloudEvent {
  type: 'google.cloud.pubsub.topic.v1.messagePublished';
  data: MessagePublishedData;
}
