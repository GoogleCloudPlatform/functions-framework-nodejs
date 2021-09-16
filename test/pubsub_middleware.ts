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
import * as assert from 'assert';
import * as sinon from 'sinon';
import {Response, Request} from 'express';
import {
  legacyPubSubEventMiddleware,
  MarshalledPubSubBody,
} from '../src/pubsub_middleware';

const PUB_SUB_TOPIC = 'projects/FOO/topics/BAR_TOPIC';
const RAW_PUBSUB_BODY = {
  subscription: 'projects/FOO/subscriptions/BAR_SUB',
  message: {
    data: 'eyJmb28iOiJiYXIifQ==',
    messageId: '1',
    attributes: {
      test: '123',
    },
  },
};

const marshalledPubSubBody = (topic: string | null): MarshalledPubSubBody => ({
  data: {
    '@type': 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
    data: 'eyJmb28iOiJiYXIifQ==',
    attributes: {
      test: '123',
    },
  },
  context: {
    eventId: '1',
    eventType: 'google.pubsub.topic.publish',
    resource: {
      name: topic,
      service: 'pubsub.googleapis.com',
      type: 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
    },
    timestamp: new Date().toISOString(),
  },
});

describe('legacyPubSubEventMiddleware', () => {
  beforeEach(() => {
    sinon.stub(console, 'warn');
  });

  afterEach(() => {
    (console.warn as sinon.SinonSpy).restore();
  });

  interface TestData {
    name: string;
    path: string;
    body: object;
    expectedBody: () => object;
  }

  const testData: TestData[] = [
    {
      name: 'raw pub/sub request',
      path: `/${PUB_SUB_TOPIC}?pubsub_trigger=true`,
      body: RAW_PUBSUB_BODY,
      expectedBody: () => marshalledPubSubBody(PUB_SUB_TOPIC),
    },
    {
      name: 'raw pub/sub request without topic in URL path',
      path: '/myfunction',
      body: RAW_PUBSUB_BODY,
      expectedBody: () => marshalledPubSubBody(null),
    },
    {
      name: 'non-pub/sub request',
      path: `/${PUB_SUB_TOPIC}?pubsub_trigger=true`,
      body: {foo: 'bar'},
      expectedBody: () => ({foo: 'bar'}),
    },
  ];

  testData.forEach((test: TestData) => {
    it(`correctly marshals the request of a ${test.name}`, () => {
      const clock = sinon.useFakeTimers();
      const next = sinon.spy();
      const request = {
        path: test.path,
        body: test.body,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        header: (_: string) => '',
      };
      legacyPubSubEventMiddleware(request as Request, {} as Response, next);
      assert.deepStrictEqual(request.body, test.expectedBody());
      assert.strictEqual(next.called, true);
      clock.restore();
    });
  });
});
