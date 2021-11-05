import * as assert from 'assert';
import * as sinon from 'sinon';
import {Response, Request} from 'express';

import {
  splitResource,
  backgroundEventToCloudEventMiddleware,
} from '../../src/middleware/background_event_to_cloud_event';
import {CloudFunctionsContext} from '../../src/functions';
import {EventConversionError} from '../../src/cloud_events';

describe('splitResource', () => {
  const testData = [
    {
      name: 'background resource',
      context: {
        eventType: 'google.storage.object.finalize',
        resource: {
          service: 'storage.googleapis.com',
          name: 'projects/_/buckets/some-bucket/objects/folder/Test.cs',
          type: 'storage#object',
        },
      },
      expectedResult: {
        service: 'storage.googleapis.com',
        resource: 'projects/_/buckets/some-bucket',
        subject: 'objects/folder/Test.cs',
      },
    },

    {
      name: 'background resource without service',
      context: {
        eventType: 'google.storage.object.finalize',
        resource: {
          name: 'projects/_/buckets/some-bucket/objects/folder/Test.cs',
          type: 'storage#object',
        },
      },
      expectedResult: {
        service: 'storage.googleapis.com',
        resource: 'projects/_/buckets/some-bucket',
        subject: 'objects/folder/Test.cs',
      },
    },

    {
      name: 'background resource string',
      context: {
        eventType: 'google.storage.object.finalize',
        resource: 'projects/_/buckets/some-bucket/objects/folder/Test.cs',
      },
      expectedResult: {
        service: 'storage.googleapis.com',
        resource: 'projects/_/buckets/some-bucket',
        subject: 'objects/folder/Test.cs',
      },
    },
    {
      name: 'unknown service and event type',
      context: {
        eventType: 'unknown_event_type',
        resource: {
          service: 'not_a_known_service',
          name: 'projects/_/my/stuff/at/test.txt',
          type: 'storage#object',
        },
      },
      expectedResult: {
        service: 'not_a_known_service',
        resource: 'projects/_/my/stuff/at/test.txt',
        subject: '',
      },
    },
  ];

  testData.forEach(test => {
    it(test.name, () => {
      const result = splitResource(test.context as CloudFunctionsContext);
      assert.deepStrictEqual(result, test.expectedResult);
    });
  });

  it('throws an exception on unknown event type', () => {
    const context = {
      eventType: 'not_a_known_event_type',
      resource: {
        name: 'projects/_/buckets/some-bucket/objects/folder/Test.cs',
        type: 'storage#object',
      },
    };
    assert.throws(() => splitResource(context), EventConversionError);
  });

  it('throws an exception on unknown resource type', () => {
    const context = {
      eventType: 'google.storage.object.finalize',
      resource: {
        // This name will not match the regex associated with the service.
        name: 'foo/bar/baz',
        service: 'storage.googleapis.com',
        type: 'storage#object',
      },
    };
    assert.throws(() => splitResource(context), EventConversionError);
  });
});

describe('backgroundEventToCloudEventMiddleware', () => {
  const createBackgroundEventBody = (
    eventType: string,
    resource: {[k: string]: string} | string,
    data: object = {data: '10'}
  ) => ({
    context: {
      eventId: '1215011316659232',
      timestamp: '2020-05-18T12:13:19Z',
      eventType,
      resource,
    },
    data,
  });

  const createCloudEventBody = (
    type: string,
    source: string,
    data: object,
    subject?: string
  ) =>
    Object.assign(subject ? {subject} : {}, {
      specversion: '1.0',
      id: '1215011316659232',
      time: '2020-05-18T12:13:19Z',
      datacontenttype: 'application/json',
      type,
      source,
      data,
    });

  const testData = [
    {
      name: 'CloudEvent',
      body: {
        specversion: '1.0',
        type: 'com.google.cloud.storage',
        source:
          'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
        subject: 'test-subject',
        id: 'test-1234-1234',
        time: '2020-05-13T01:23:45Z',
        traceparent: '00-65088630f09e0a5359677a7429456db7-97f23477fb2bf5ec-01',
        datacontenttype: 'application/json',
        data: {
          some: 'payload',
        },
      },
      expectedCloudEvent: {
        specversion: '1.0',
        type: 'com.google.cloud.storage',
        source:
          'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
        subject: 'test-subject',
        id: 'test-1234-1234',
        time: '2020-05-13T01:23:45Z',
        traceparent: '00-65088630f09e0a5359677a7429456db7-97f23477fb2bf5ec-01',
        datacontenttype: 'application/json',
        data: {
          some: 'payload',
        },
      },
    },
    {
      name: 'PubSub request',
      body: createBackgroundEventBody('google.pubsub.topic.publish', {
        service: 'pubsub.googleapis.com',
        name: 'projects/sample-project/topics/gcf-test',
        type: 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
      }),
      expectedCloudEvent: createCloudEventBody(
        'google.cloud.pubsub.topic.v1.messagePublished',
        '//pubsub.googleapis.com/projects/sample-project/topics/gcf-test',
        {
          message: {
            data: '10',
            messageId: '1215011316659232',
            publishTime: '2020-05-18T12:13:19Z',
          },
        }
      ),
    },
    {
      name: 'Legacy PubSub request',
      body: createBackgroundEventBody(
        'providers/cloud.pubsub/eventTypes/topic.publish',
        'projects/sample-project/topics/gcf-test'
      ),
      expectedCloudEvent: createCloudEventBody(
        'google.cloud.pubsub.topic.v1.messagePublished',
        '//pubsub.googleapis.com/projects/sample-project/topics/gcf-test',
        {
          message: {
            data: '10',
            messageId: '1215011316659232',
            publishTime: '2020-05-18T12:13:19Z',
          },
        }
      ),
    },
    {
      name: 'Firebase auth event',
      body: createBackgroundEventBody(
        'providers/firebase.auth/eventTypes/user.create',
        'projects/my-project-id',
        {
          email: 'test@nowhere.com',
          metadata: {
            createdAt: '2020-05-26T10:42:27Z',
            lastSignedInAt: '2020-10-24T11:00:00Z',
          },
          uid: 'UUpby3s4spZre6kHsgVSPetzQ8l2',
        }
      ),
      expectedCloudEvent: createCloudEventBody(
        'google.firebase.auth.user.v1.created',
        '//firebaseauth.googleapis.com/projects/my-project-id',
        {
          email: 'test@nowhere.com',
          metadata: {
            createTime: '2020-05-26T10:42:27Z',
            lastSignInTime: '2020-10-24T11:00:00Z',
          },
          uid: 'UUpby3s4spZre6kHsgVSPetzQ8l2',
        },
        'users/UUpby3s4spZre6kHsgVSPetzQ8l2'
      ),
    },
  ];

  testData.forEach(test => {
    it(test.name, () => {
      const next = sinon.spy();
      const req = {
        body: test.body,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        header: (_: string) => '',
      };
      backgroundEventToCloudEventMiddleware(
        req as Request,
        {} as Response,
        next
      );
      assert.deepStrictEqual(req.body, test.expectedCloudEvent);
      assert.strictEqual(next.called, true);
    });
  });
});
