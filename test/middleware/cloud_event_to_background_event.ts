import * as assert from 'assert';
import * as sinon from 'sinon';
import {Response, Request} from 'express';

import {
  cloudEventToBackgroundEventMiddleware,
  parseSource,
} from '../../src/middleware/cloud_event_to_background_event';
import {EventConversionError} from '../../src/cloud_events';

const ceHeaders = (eventType: string, source: string) => ({
  'ce-id': 'my-id',
  'ce-type': eventType,
  'ce-source': source,
  'ce-specversion': '1.0',
  'ce-subject': 'my/subject',
  'ce-time': '2020-08-16T13:58:54.471765',
});

describe('parseSource', () => {
  const testData = [
    {
      name: 'firebasedatabase CE source string',
      source:
        '//firebasedatabase.googleapis.com/projects/_/instances/my-project-id',
      expectedService: 'firebasedatabase.googleapis.com',
      expectedName: 'projects/_/instances/my-project-id',
    },
    {
      name: 'firebaseauth CE source string',
      source: '//firebaseauth.googleapis.com/projects/my-project-id',
      expectedService: 'firebaseauth.googleapis.com',
      expectedName: 'projects/my-project-id',
    },
    {
      name: 'firestore CE source string',
      source:
        '//firestore.googleapis.com/projects/project-id/databases/(default)',
      expectedService: 'firestore.googleapis.com',
      expectedName: 'projects/project-id/databases/(default)',
    },
  ];

  testData.forEach(testCase => {
    it(testCase.name, () => {
      const {service, name} = parseSource(testCase.source);
      assert.strictEqual(service, testCase.expectedService);
      assert.strictEqual(name, testCase.expectedName);
    });
  });

  it('throws an exception on invalid input', () => {
    assert.throws(() => parseSource('invalid'), EventConversionError);
  });
});

describe('cloudEventToBackgroundEventMiddleware', () => {
  const testData = [
    {
      name: 'Non-CE-Request is not altered',
      headers: {foo: 'bar'},
      body: {some: 'value'},
      expectedBody: {some: 'value'},
    },
    {
      name: 'Firebase database request',
      headers: ceHeaders(
        'google.firebase.database.ref.v1.written',
        '//firebasedatabase.googleapis.com/projects/_/locations/europe-west1/instances/my-project-id'
      ),
      body: {some: 'value'},
      expectedBody: {
        context: {
          eventId: 'my-id',
          eventType: 'providers/google.firebase.database/eventTypes/ref.write',
          resource: 'projects/_/instances/my-project-id/my/subject',
          timestamp: '2020-08-16T13:58:54.471765',
        },
        data: {
          some: 'value',
        },
      },
    },
    {
      name: 'PubSub request',
      headers: ceHeaders(
        'google.cloud.pubsub.topic.v1.messagePublished',
        '//pubsub.googleapis.com/projects/sample-project/topics/gcf-test'
      ),
      body: {
        message: {
          data: 'value',
        },
      },
      expectedBody: {
        data: {
          data: 'value',
        },
        context: {
          eventId: 'my-id',
          eventType: 'google.pubsub.topic.publish',
          resource: {
            name: 'projects/sample-project/topics/gcf-test',
            service: 'pubsub.googleapis.com',
            type: 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
          },
          timestamp: '2020-08-16T13:58:54.471765',
        },
      },
    },
    {
      name: 'Cloud Storage request',
      headers: ceHeaders(
        'google.cloud.storage.object.v1.finalized',
        '//storage.googleapis.com/projects/_/buckets/some-bucket'
      ),
      body: {
        some: 'value',
        kind: 'storage#object',
      },
      expectedBody: {
        data: {
          some: 'value',
          kind: 'storage#object',
        },
        context: {
          eventId: 'my-id',
          eventType: 'google.storage.object.finalize',
          resource: {
            name: 'projects/_/buckets/some-bucket/my/subject',
            service: 'storage.googleapis.com',
            type: 'storage#object',
          },
          timestamp: '2020-08-16T13:58:54.471765',
        },
      },
    },
    {
      name: 'Firebase auth request',
      headers: ceHeaders(
        'google.firebase.auth.user.v1.created',
        '//firebaseauth.googleapis.com/projects/my-project-id'
      ),
      body: {
        metadata: {
          createTime: '2020-05-26T10:42:27Z',
          lastSignInTime: '2020-10-24T11:00:00Z',
        },
        uid: 'my-id',
      },
      expectedBody: {
        data: {
          metadata: {
            createdAt: '2020-05-26T10:42:27Z',
            lastSignedInAt: '2020-10-24T11:00:00Z',
          },
          uid: 'my-id',
        },
        context: {
          eventId: 'my-id',
          eventType: 'providers/firebase.auth/eventTypes/user.create',
          resource: 'projects/my-project-id',
          timestamp: '2020-08-16T13:58:54.471765',
        },
      },
    },
  ];

  testData.forEach(test => {
    it(test.name, () => {
      const next = sinon.spy();
      const request = {
        body: test.body,
        headers: test.headers as object,
        header: (key: string) => (test.headers as {[key: string]: string})[key],
      };
      cloudEventToBackgroundEventMiddleware(
        request as Request,
        {} as Response,
        next
      );
      assert.deepStrictEqual(request.body, test.expectedBody);
      assert.strictEqual(next.called, true);
    });
  });
});
