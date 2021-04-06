import {
  CloudEventsContext,
  LegacyCloudFunctionsContext,
  LegacyEvent,
} from '../../src/functions';

// Pub/Sub
export const PUBSUB_LEGACY_EVENT_1: LegacyEvent = {
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
export const PUBSUB_LEGACY_EVENT_2: LegacyCloudFunctionsContext = {
  eventId: '1215011316659232',
  timestamp: '2020-05-18T12:13:19Z',
  eventType: 'providers/cloud.pubsub/eventTypes/topic.publish',
  resource: 'projects/sample-project/topics/gcf-test',
  data: {
    data: '10',
  },
};
export const PUBSUB_CLOUDEVENT: CloudEventsContext = {
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

// Firebase Auth
export const FIREBASE_AUTH_LEGACY: LegacyCloudFunctionsContext = {
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
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore typescript-eslint/ban-ts-comment Ingore purposefully unsuported field
  notSupported: {},
  resource: 'projects/my-project-id',
  timestamp: '2020-09-29T11:32:00.000Z',
};
export const FIREBASE_AUTH_CLOUDEVENT: CloudEventsContext = {
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
