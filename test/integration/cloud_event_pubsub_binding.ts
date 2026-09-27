// Copyright 2026 Google LLC
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
import * as functions from '../../src/index';
import * as sinon from 'sinon';
import {getServer} from '../../src/server';
import {getTestServer} from '../../src/testing';
import {SignatureType} from '../../src/types';
import * as supertest from 'supertest';

const PUBSUB_BINDING_PATH = '/?__GCP_CloudEventsMode=CE_PUBSUB_BINDING';

// Non-UTF-8 bytes standing in for a protobuf payload.
const PROTOBUF_DATA = Buffer.from([0x0a, 0x80, 0x01, 0xff, 0x00, 0x20]);

// CloudEvent attributes as Eventarc sends them for a Firestore document whose ID
// ends with a space, which can't be sent as an HTTP header value.
const FIRESTORE_ATTRIBUTES = {
  'ce-database': '(default)',
  'ce-datacontenttype': 'application/protobuf',
  'ce-dataschema':
    'https://github.com/googleapis/google-cloudevents/blob/main/proto/google/events/cloud/firestore/v1/data.proto',
  'ce-document': 'users/trailing-space ',
  'ce-id': '2e182641-ccd6-44c4-bfa4-556fa3a151eb',
  'ce-location': 'us-central1',
  'ce-namespace': '(default)',
  'ce-project': 'my-project',
  'ce-source':
    '//firestore.googleapis.com/projects/my-project/databases/(default)',
  'ce-specversion': '1.0',
  'ce-subject': 'documents/users/trailing-space ',
  'ce-time': '2026-09-24T16:59:46.187599Z',
  'ce-type': 'google.cloud.firestore.document.v1.written',
};

const FIRESTORE_CLOUD_EVENT = {
  database: '(default)',
  datacontenttype: 'application/protobuf',
  dataschema:
    'https://github.com/googleapis/google-cloudevents/blob/main/proto/google/events/cloud/firestore/v1/data.proto',
  document: 'users/trailing-space ',
  id: '2e182641-ccd6-44c4-bfa4-556fa3a151eb',
  location: 'us-central1',
  namespace: '(default)',
  project: 'my-project',
  source: '//firestore.googleapis.com/projects/my-project/databases/(default)',
  specversion: '1.0',
  subject: 'documents/users/trailing-space ',
  time: '2026-09-24T16:59:46.187599Z',
  type: 'google.cloud.firestore.document.v1.written',
};

/**
 * Builds a Pub/Sub push request body in the shape Eventarc sends.
 */
const pushBody = (
  attributes: {[key: string]: string},
  data?: Buffer | string,
) => ({
  message: {
    attributes,
    ...(data === undefined ? {} : {data: Buffer.from(data).toString('base64')}),
    messageId: '21969564336459644',
    message_id: '21969564336459644',
    publishTime: '2026-09-24T16:59:46.243Z',
    publish_time: '2026-09-24T16:59:46.243Z',
  },
  subscription: 'projects/my-project/subscriptions/eventarc-nam5-trigger-sub',
});

describe('CloudEvent Function with Pub/Sub protocol binding', () => {
  let receivedCloudEvent: functions.CloudEvent<unknown> | null;
  before(() => {
    functions.cloudEvent(
      'testPubSubBindingFunction',
      (ce: functions.CloudEvent<unknown>) => {
        receivedCloudEvent = ce;
      },
    );
  });

  beforeEach(() => {
    receivedCloudEvent = null;
    // Prevent log spew from requests handled as Pub/Sub messages.
    sinon.stub(console, 'warn');
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    (console.warn as sinon.SinonSpy).restore();
    (console.error as sinon.SinonSpy).restore();
  });

  const post = (path: string, body: object) =>
    supertest(getTestServer('testPubSubBindingFunction')).post(path).send(body);

  it('decodes a binary mode CloudEvent with protobuf data', async () => {
    await post(
      PUBSUB_BINDING_PATH,
      pushBody(FIRESTORE_ATTRIBUTES, PROTOBUF_DATA),
    ).expect(204);
    assert.deepStrictEqual(receivedCloudEvent, {
      ...FIRESTORE_CLOUD_EVENT,
      data: PROTOBUF_DATA,
    });
  });

  it('decodes a binary mode CloudEvent with JSON data', async () => {
    await post(
      PUBSUB_BINDING_PATH,
      pushBody(
        {
          ...FIRESTORE_ATTRIBUTES,
          'ce-datacontenttype': 'application/json; charset=utf-8',
        },
        JSON.stringify({value: {name: 'doc'}}),
      ),
    ).expect(204);
    assert.deepStrictEqual(receivedCloudEvent, {
      ...FIRESTORE_CLOUD_EVENT,
      datacontenttype: 'application/json; charset=utf-8',
      data: {value: {name: 'doc'}},
    });
  });

  it('decodes a binary mode CloudEvent with text data', async () => {
    await post(
      PUBSUB_BINDING_PATH,
      pushBody(
        {...FIRESTORE_ATTRIBUTES, 'ce-datacontenttype': 'text/plain'},
        'hello',
      ),
    ).expect(204);
    assert.deepStrictEqual(receivedCloudEvent, {
      ...FIRESTORE_CLOUD_EVENT,
      datacontenttype: 'text/plain',
      data: 'hello',
    });
  });

  it('uses the content-type attribute as datacontenttype', async () => {
    const attributes: {[key: string]: string} = {
      ...FIRESTORE_ATTRIBUTES,
      'content-type': 'application/json',
    };
    delete attributes['ce-datacontenttype'];
    await post(PUBSUB_BINDING_PATH, pushBody(attributes, '{"a":1}')).expect(
      204,
    );
    assert.deepStrictEqual(receivedCloudEvent, {
      ...FIRESTORE_CLOUD_EVENT,
      datacontenttype: 'application/json',
      data: {a: 1},
    });
  });

  it('omits data when the message has none', async () => {
    await post(PUBSUB_BINDING_PATH, pushBody(FIRESTORE_ATTRIBUTES)).expect(204);
    assert.deepStrictEqual(receivedCloudEvent, FIRESTORE_CLOUD_EVENT);
  });

  it('rejects JSON data that fails to parse', async () => {
    await post(
      PUBSUB_BINDING_PATH,
      pushBody(
        {...FIRESTORE_ATTRIBUTES, 'ce-datacontenttype': 'application/json'},
        '{not json',
      ),
    ).expect(400);
    assert.strictEqual(receivedCloudEvent, null);
  });

  it('prefers CloudEvent headers over the Pub/Sub envelope', async () => {
    await post(PUBSUB_BINDING_PATH, pushBody(FIRESTORE_ATTRIBUTES, 'x'))
      .set({
        'ce-specversion': '1.0',
        'ce-type': 'com.example.header',
        'ce-source': '//example.com',
        'ce-id': 'header-id',
      })
      .expect(204);
    assert.strictEqual(receivedCloudEvent!.type, 'com.example.header');
  });

  describe('leaves other Pub/Sub push requests unchanged', () => {
    const unchanged = [
      {
        name: 'without the CE_PUBSUB_BINDING query parameter',
        path: '/',
        attributes: FIRESTORE_ATTRIBUTES,
      },
      {
        name: 'with a different CloudEvents mode',
        path: '/?__GCP_CloudEventsMode=CUSTOM_PUBSUB_projects%2Fp%2Ftopics%2Ft',
        attributes: FIRESTORE_ATTRIBUTES,
      },
      {
        name: 'missing a required CloudEvent attribute',
        path: PUBSUB_BINDING_PATH,
        attributes: (() => {
          const attributes: {[key: string]: string} = {
            ...FIRESTORE_ATTRIBUTES,
          };
          delete attributes['ce-specversion'];
          return attributes;
        })(),
      },
      {
        name: 'with unprefixed attributes',
        path: PUBSUB_BINDING_PATH,
        attributes: {
          specversion: '1.0',
          id: 'order-1',
          source: 'web',
          type: 'order',
        },
      },
      {
        name: 'in structured content mode',
        path: PUBSUB_BINDING_PATH,
        attributes: {
          ...FIRESTORE_ATTRIBUTES,
          'content-type': 'application/cloudevents+json',
        },
      },
    ];
    unchanged.forEach(test => {
      it(test.name, async () => {
        await post(test.path, pushBody(test.attributes, 'x')).expect(204);
        assert.strictEqual(
          receivedCloudEvent!.type,
          'google.cloud.pubsub.topic.v1.messagePublished',
        );
        assert.deepStrictEqual(
          (receivedCloudEvent!.data as {message: {attributes: object}}).message
            .attributes,
          test.attributes,
        );
      });
    });
  });

  it('is not applied to event functions', async () => {
    let receivedData: {attributes?: object} | null = null;
    const server = getServer(
      (data: {attributes?: object}) => {
        receivedData = data;
      },
      {
        signatureType: 'event' as SignatureType,
        enableExecutionId: false,
        timeoutMilliseconds: 0,
        port: '0',
        target: '',
        sourceLocation: '',
        printHelp: false,
        ignoredRoutes: null,
      },
    );
    await supertest(server)
      .post(PUBSUB_BINDING_PATH)
      .send(pushBody(FIRESTORE_ATTRIBUTES, PROTOBUF_DATA))
      .expect(204);
    assert.deepStrictEqual(receivedData!.attributes, FIRESTORE_ATTRIBUTES);
  });
});
