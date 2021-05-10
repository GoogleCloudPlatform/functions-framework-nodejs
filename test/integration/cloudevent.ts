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
import * as functions from '../../src/functions';
import * as sinon from 'sinon';
import {getServer} from '../../src/server';
import {SignatureType} from '../../src/types';
import * as supertest from 'supertest';

const TEST_CLOUD_EVENT = {
  specversion: '1.0',
  type: 'com.google.cloud.storage',
  source: 'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
  subject: 'test-subject',
  id: 'test-1234-1234',
  time: '2020-05-13T01:23:45Z',
  datacontenttype: 'application/json',
  data: {
    some: 'payload',
  },
};

describe('CloudEvent Function', () => {
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    // Prevent log spew from the PubSub emulator request.
    sinon.stub(console, 'warn');
  });

  afterEach(() => {
    clock.restore();
    (console.warn as sinon.SinonSpy).restore();
  });

  const testData = [
    {
      name: 'CloudEvents v1.0 structured content request',
      headers: {'Content-Type': 'application/cloudevents+json'},
      body: TEST_CLOUD_EVENT,
      expectedCloudEvent: TEST_CLOUD_EVENT,
    },
    {
      name: 'CloudEvents v1.0 binary content request',
      headers: {
        'Content-Type': 'application/json',
        'ce-specversion': TEST_CLOUD_EVENT.specversion,
        'ce-type': TEST_CLOUD_EVENT.type,
        'ce-source': TEST_CLOUD_EVENT.source,
        'ce-subject': TEST_CLOUD_EVENT.subject,
        'ce-id': TEST_CLOUD_EVENT.id,
        'ce-time': TEST_CLOUD_EVENT.time,
        'ce-datacontenttype': TEST_CLOUD_EVENT.datacontenttype,
      },
      body: TEST_CLOUD_EVENT.data,
      expectedCloudEvent: TEST_CLOUD_EVENT,
    },
    {
      name: 'PubSub GCF event request',
      headers: {},
      body: {
        context: {
          eventId: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
          timestamp: '2020-09-29T11:32:00.000Z',
          eventType: 'google.pubsub.topic.publish',
          resource: {
            service: 'pubsub.googleapis.com',
            name: 'projects/sample-project/topics/gcf-test',
            type: 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
          },
        },
        data: {
          '@type': 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
          data: 'AQIDBA==',
        },
      },
      expectedCloudEvent: {
        specversion: '1.0',
        type: 'google.cloud.pubsub.topic.v1.messagePublished',
        source:
          '//pubsub.googleapis.com/projects/sample-project/topics/gcf-test',
        id: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
        time: '2020-09-29T11:32:00.000Z',
        datacontenttype: 'application/json',
        data: {
          message: {
            '@type': 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
            data: 'AQIDBA==',
          },
        },
      },
    },
    {
      name: 'Legacy PubSub GCF event request',
      headers: {},
      body: {
        eventId: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
        timestamp: '2020-09-29T11:32:00.000Z',
        eventType: 'providers/cloud.pubsub/eventTypes/topic.publish',
        resource: 'projects/sample-project/topics/gcf-test',
        data: {
          '@type': 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
          attributes: {
            attribute1: 'value1',
          },
          data: 'VGhpcyBpcyBhIHNhbXBsZSBtZXNzYWdl',
        },
      },
      expectedCloudEvent: {
        specversion: '1.0',
        type: 'google.cloud.pubsub.topic.v1.messagePublished',
        source:
          '//pubsub.googleapis.com/projects/sample-project/topics/gcf-test',
        id: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
        time: '2020-09-29T11:32:00.000Z',
        datacontenttype: 'application/json',
        data: {
          message: {
            '@type': 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
            attributes: {
              attribute1: 'value1',
            },
            data: 'VGhpcyBpcyBhIHNhbXBsZSBtZXNzYWdl',
          },
        },
      },
    },
    {
      name: 'PubSub emulator request',
      headers: {},
      body: {
        subscription: 'projects/FOO/subscriptions/BAR_SUB',
        message: {
          data: 'VGhpcyBpcyBhIHNhbXBsZSBtZXNzYWdl',
          messageId: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
          attributes: {
            attribute1: 'value1',
          },
        },
      },
      expectedCloudEvent: {
        specversion: '1.0',
        type: 'google.cloud.pubsub.topic.v1.messagePublished',
        source: '//pubsub.googleapis.com/',
        id: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
        time: '1970-01-01T00:00:00.000Z',
        datacontenttype: 'application/json',
        data: {
          message: {
            '@type': 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
            attributes: {
              attribute1: 'value1',
            },
            data: 'VGhpcyBpcyBhIHNhbXBsZSBtZXNzYWdl',
          },
        },
      },
    },
    {
      name: 'Firebase Database GCF event request',
      headers: {},
      body: {
        eventType: 'providers/google.firebase.database/eventTypes/ref.write',
        params: {
          child: 'xyz',
        },
        auth: {
          admin: true,
        },
        data: {
          data: null,
          delta: {
            grandchild: 'other',
          },
        },
        resource: 'projects/_/instances/my-project-id/refs/gcf-test/xyz',
        timestamp: '2020-09-29T11:32:00.000Z',
        eventId: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
      },
      expectedCloudEvent: {
        specversion: '1.0',
        type: 'google.firebase.database.document.v1.written',
        source:
          '//firebasedatabase.googleapis.com/projects/_/instances/my-project-id',
        subject: 'refs/gcf-test/xyz',
        id: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
        time: '2020-09-29T11:32:00.000Z',
        datacontenttype: 'application/json',
        data: {
          data: null,
          delta: {
            grandchild: 'other',
          },
        },
      },
    },
  ];
  testData.forEach(test => {
    it(`${test.name}`, async () => {
      let receivedCloudEvent: functions.CloudEventsContext | null = null;
      const server = getServer((cloudevent: functions.CloudEventsContext) => {
        receivedCloudEvent = cloudevent as functions.CloudEventsContext;
      }, SignatureType.CLOUDEVENT);
      await supertest(server)
        .post('/')
        .set(test.headers)
        .send(test.body)
        .expect(204);
      assert.deepStrictEqual(receivedCloudEvent, test.expectedCloudEvent);
    });
  });
});
