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
import {convertCloudEventToLegacyEvent} from '../src/eventConverter';
import {
  TestHTTPRequest,
  TEST_CLOUDEVENT_BINARY_FULL,
  TEST_CLOUDEVENT_STRUCTURED,
} from './data/testHTTPData';

describe('Invoker: CE -> Legacy', () => {
  // Downcas CE to legacy
  interface CEToLegacyTestCase {
    name?: string;
    input: TestHTTPRequest;
    expectedOutput: LegacyEvent;
  }
  // Upcast legacy to CE
  interface LegacyToCETestCase {
    name?: string;
    input: LegacyEvent;
    expectedOutput: TestHTTPRequest;
  }

  // Our test input / output
  const cloudeventTestData: CEToLegacyTestCase[] = [
    {
      name: 'CloudEvents v1.0 structured content mode',
      // https://github.com/GoogleCloudPlatform/functions-framework-conformance/blob/master/events/generate/data/storage-cloudevent-input.json
      input: {
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
      },
      // https://github.com/GoogleCloudPlatform/functions-framework-conformance/blob/master/events/generate/data/storage-cloudevent-output.json
      expectedOutput: {
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
      },
    },
  ];
  // cloudeventTestData.forEach(test => {
  //   it(`should receive data and context from ${test.name}`, async () => {
  //     let receivedData: {} | null = null;
  //     let receivedContext: Context | null = null;
  //     const server = getServer((data: {}, context: Context) => {
  //       receivedData = data;
  //       receivedContext = context;
  //     }, SignatureType.EVENT);
  //     await supertest(server)
  //       .post('/')
  //       .set(test.input.headers)
  //       .send(test.input.body)
  //       .expect(204);
  //     assert.deepStrictEqual(receivedData, test.expectedOutput.data);
  //     assert.deepStrictEqual(receivedContext, test.expectedOutput.context);
  //   });
  // });
});
