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

// Note: the test data in this file should contain the same data.
const PAYLOAD = 'test payload';

// https://github.com/GoogleCloudPlatform/functions-framework-conformance/blob/master/events/generate/data/storage-cloudevent-input.json
export const TEST_CLOUDEVENT_STORAGE_INPUT: TestHTTPRequest = {
  headers: {
    'Content-Type': 'application/cloudevents+json',
  },
  body: {
    specversion: '1.0',
    type: 'google.cloud.storage.object.v1.finalized',
    source: '//storage.googleapis.com/projects/_/buckets/some-bucket',
    subject: 'objects/folder/Test.cs',
    id: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
    time: '2020-09-29T11:32:00.000Z',
    datacontenttype: 'application/json',
    data: {
      bucket: 'some-bucket',
      contentType: 'text/plain',
      crc32c: 'rTVTeQ==',
      etag: 'CNHZkbuF/ugCEAE=',
      generation: '1587627537231057',
      id: 'some-bucket/folder/Test.cs/1587627537231057',
      kind: 'storage#object',
      md5Hash: 'kF8MuJ5+CTJxvyhHS1xzRg==',
      mediaLink:
        'https://www.googleapis.com/download/storage/v1/b/some-bucket/o/folder%2FTest.cs?generation=1587627537231057\u0026alt=media',
      metageneration: '1',
      name: 'folder/Test.cs',
      selfLink:
        'https://www.googleapis.com/storage/v1/b/some-bucket/o/folder/Test.cs',
      size: '352',
      storageClass: 'MULTI_REGIONAL',
      timeCreated: '2020-04-23T07:38:57.230Z',
      timeStorageClassUpdated: '2020-04-23T07:38:57.230Z',
      updated: '2020-04-23T07:38:57.230Z',
    },
  },
};

// // https://github.com/GoogleCloudPlatform/functions-framework-conformance/blob/master/events/generate/data/storage-cloudevent-output.json
export const TEST_CLOUDEVENT_STORAGE_OUTPUT = {
  context: {
    eventId: 'aaaaaa-1111-bbbb-2222-cccccccccccc',
    timestamp: '2020-09-29T11:32:00.000Z',
    eventType: 'google.storage.object.finalize',
    resource: {
      service: 'storage.googleapis.com',
      name: 'projects/_/buckets/some-bucket/objects/folder/Test.cs',
      type: 'storage#object',
    },
  },
  data: {
    bucket: 'some-bucket',
    contentType: 'text/plain',
    crc32c: 'rTVTeQ==',
    etag: 'CNHZkbuF/ugCEAE=',
    generation: '1587627537231057',
    id: 'some-bucket/folder/Test.cs/1587627537231057',
    kind: 'storage#object',
    md5Hash: 'kF8MuJ5+CTJxvyhHS1xzRg==',
    mediaLink:
      'https://www.googleapis.com/download/storage/v1/b/some-bucket/o/folder%2FTest.cs?generation=1587627537231057\u0026alt=media',
    metageneration: '1',
    name: 'folder/Test.cs',
    selfLink:
      'https://www.googleapis.com/storage/v1/b/some-bucket/o/folder/Test.cs',
    size: '352',
    storageClass: 'MULTI_REGIONAL',
    timeCreated: '2020-04-23T07:38:57.230Z',
    timeStorageClassUpdated: '2020-04-23T07:38:57.230Z',
    updated: '2020-04-23T07:38:57.230Z',
  },
};

/**
 * A test CloudEvent in structured mode.
 */
export const TEST_CLOUDEVENT_STRUCTURED: TestHTTPRequest = {
  headers: {},
  body: {
    specversion: '1.0',
    type: 'com.google.cloud.storage',
    source: 'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
    subject: 'test-subject',
    id: 'test-1234-1234',
    time: '2020-05-13T01:23:45Z',
    datacontenttype: 'application/json',
    data: {
      some: PAYLOAD,
    },
  },
};

/**
 * A test CloudEvent in structured mode that is invalid
 */
export const TEST_CLOUDEVENT_STRUCTURED_INVALID: TestHTTPRequest = {
  headers: {},
  body: {
    specversion: '1.0',
    time: '2020-05-13T01:23:45Z',
    datacontenttype: 'application/json',
    data: {
      some: PAYLOAD,
    },
  },
};

/**
 * A test CloudEvent in binary mode with all fields.
 */
export const TEST_CLOUDEVENT_BINARY_FULL: TestHTTPRequest = {
  headers: {
    ['ce-specversion']: '1.0',
    ['ce-type']: 'com.google.cloud.storage',
    ['ce-source']:
      'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
    ['ce-subject']: 'test-subject',
    ['ce-id']: 'test-1234-1234',
    ['ce-time']: '2020-05-13T01:23:45Z',
    ['ce-datacontenttype']: 'application/json',
  },
  body: {
    some: PAYLOAD,
  },
};

/**
 * A test CloudEvent in binary mode with partial fields.
 */
export const TEST_CLOUDEVENT_BINARY_PARTIAL: TestHTTPRequest = {
  headers: {
    ['ce-specversion']: '1.0',
    ['ce-type']: 'com.google.cloud.storage',
    ['ce-source']:
      'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
    ['ce-id']: 'test-1234-1234',
    ['ce-datacontenttype']: 'application/json',
  },
  body: {
    some: PAYLOAD,
  },
};

/**
 * A test CloudEvent in binary mode that is invalid.
 */
export const TEST_CLOUDEVENT_BINARY_INVALID: TestHTTPRequest = {
  headers: {
    ['ce-specversion']: '1.0',
    ['ce-type']: 'com.google.cloud.storage',
    ['ce-source']:
      'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
  },
  body: {
    some: PAYLOAD,
  },
};

/**
 * Test data for accepting legacy events.
 */
export interface TestEventData {
  // The name of the test data
  name: string;
  // The HTTP body input
  body: {};
  // The expected HTTP body
  expectedResource: {};
}

/**
 * A test HTTP request.
 */
export interface TestHTTPRequest {
  headers: {[key: string]: string};
  body: {[key: string]: string | object};
}
