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

import * as assert from 'assert';
import {getServer} from '../src/server';
import {SignatureType} from '../src/types';
import * as supertest from 'supertest';
import {Context, LegacyEvent} from '../src/functions';
import {convertLegacyEventToCloudEvent} from '../src/eventConverter';
import {
  TEST_CLOUDEVENT_BINARY_FULL,
  TEST_CLOUDEVENT_STRUCTURED,
} from './data/testHTTPData';

describe('EventConverter: Legacy -> CE', () => {
  it('should upcast Pub/Sub events', async () => {
    // Pub/Sub
    const PUBSUB_LEGACY_EVENT_1 = {
      context: {
        eventId: '1215011316659232',
        timestamp: '2020-05-18T12:13:19Z',
        eventType: 'google.pubsub.topic.publish',
        resource: {
          service: 'pubsub.googleapis.com',
          name: 'projects/sample-project/topics/gcf-test',
          type: 'type.googleapis.com/google.pubsub.v1.PubsubMessage',
        },
      },
      data: {
        data: '10',
      },
    };
    const PUBSUB_LEGACY_EVENT_2 = {
      eventId: '1215011316659232',
      timestamp: '2020-05-18T12:13:19Z',
      eventType: 'providers/cloud.pubsub/eventTypes/topic.publish',
      resource: 'projects/sample-project/topics/gcf-test',
      data: {
        data: '10',
      },
    };
    const PUBSUB_CLOUDEVENT = {
      specversion: '1.0',
      id: '1215011316659232',
      source: '//pubsub.googleapis.com/projects/sample-project/topics/gcf-test',
      time: '2020-05-18T12:13:19Z',
      type: 'google.cloud.pubsub.topic.v1.messagePublished',
      datacontenttype: 'application/json',
      data: {
        message: {
          data: '10',
        },
      },
    };

    const ce1 = convertLegacyEventToCloudEvent({}, PUBSUB_LEGACY_EVENT_1);
    assert.deepStrictEqual(ce1, PUBSUB_CLOUDEVENT);

    const ce2 = convertLegacyEventToCloudEvent({}, PUBSUB_LEGACY_EVENT_2);
    assert.deepStrictEqual(ce2, PUBSUB_CLOUDEVENT);
  });

  it('should upcase Firebase Auth events', async () => {
    // Firebase Auth
    const FIREBASE_AUTH_LEGACY = {
      data: {
        email: 'test@nowhere.com',
        metadata: {
          createdAt: '2020-05-26T10:42:27Z',
          lastSignedInAt: '2020-10-24T11:00:00Z',
        },
        providerData: [
          {
            email: 'test@nowhere.com',
            providerId: 'password',
            uid: 'test@nowhere.com',
          },
        ],
        uid: 'UUpby3s4spZre6kHsgVSPetzQ8l2',
      },
      eventId: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
      eventType: 'providers/firebase.auth/eventTypes/user.create',
      notSupported: {},
      resource: 'projects/my-project-id',
      timestamp: '2020-09-29T11:32:00.000Z',
    };
    const FIREBASE_AUTH_CLOUDEVENT = {
      specversion: '1.0',
      type: 'google.firebase.auth.user.v1.created',
      source: '//firebaseauth.googleapis.com/projects/my-project-id',
      subject: 'users/UUpby3s4spZre6kHsgVSPetzQ8l2',
      id: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
      time: '2020-09-29T11:32:00.000Z',
      datacontenttype: 'application/json',
      data: {
        email: 'test@nowhere.com',
        metadata: {
          createTime: '2020-05-26T10:42:27Z',
          lastSignInTime: '2020-10-24T11:00:00Z',
        },
        providerData: [
          {
            email: 'test@nowhere.com',
            providerId: 'password',
            uid: 'test@nowhere.com',
          },
        ],
        uid: 'UUpby3s4spZre6kHsgVSPetzQ8l2',
      },
    };

    const convertedCE1 = convertLegacyEventToCloudEvent(
      {},
      FIREBASE_AUTH_LEGACY
    );
    assert.deepStrictEqual(convertedCE1, FIREBASE_AUTH_CLOUDEVENT);
  });
});
