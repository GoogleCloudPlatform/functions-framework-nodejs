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
import {Request} from 'express';
import {getBinaryCloudEventContext} from '../src/cloud_events';

// Simulates what Node.js HTTP parsing produces when UTF-8-encoded bytes arrive
// in a header and are decoded as Latin-1 (binary). This is what req.header()
// returns in practice when non-ASCII Unicode is sent in CloudEvent extension
// attributes by services like Firestore.
function asNodeHttpHeader(s: string): string {
  return Buffer.from(s, 'utf-8').toString('binary');
}

function makeMockRequest(headers: Record<string, string>): Request {
  const lowercased = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    headers: lowercased,
    header: (name: string) => lowercased[name.toLowerCase()],
  } as unknown as Request;
}

describe('getBinaryCloudEventContext', () => {
  describe('binary-encoded UTF-8 extension attributes (Firestore path params)', () => {
    const cases = [
      {
        name: 'latin script with diacritics',
        input: 'HelvÃ©tios',
        expected: 'Helvétios',
      },
      {
        name: 'CJK text',
        input: asNodeHttpHeader('中文'),
        expected: '中文',
      },
      {
        name: 'emoji',
        input: asNodeHttpHeader('😀'),
        expected: '😀',
      },
      {
        name: 'Hindi text',
        input: asNodeHttpHeader('हिन्दी'),
        expected: 'हिन्दी',
      },
      {
        name: 'Arabic text',
        input: asNodeHttpHeader('اَلْعَرَبِيَّةُ'),
        expected: 'اَلْعَرَبِيَّةُ',
      },
    ];

    for (const {name, input, expected} of cases) {
      it(`decodes ${name}`, () => {
        const req = makeMockRequest({
          'ce-specversion': '1.0',
          'ce-type': 'google.cloud.firestore.document.v1.created',
          'ce-source': '//firestore.googleapis.com/projects/my-project',
          'ce-id': 'test-id',
          'ce-document': input,
        });
        const context = getBinaryCloudEventContext(req);
        assert.strictEqual(context['document' as keyof typeof context], expected);
      });
    }

    it('decodes mojibake embedded in a longer path', () => {
      const req = makeMockRequest({
        'ce-specversion': '1.0',
        'ce-type': 'google.cloud.firestore.document.v1.created',
        'ce-source': '//firestore.googleapis.com/projects/my-project',
        'ce-id': 'test-id',
        'ce-document': asNodeHttpHeader('users/Helvétios/posts/café'),
      });
      const context = getBinaryCloudEventContext(req);
      assert.strictEqual(
        context['document' as keyof typeof context],
        'users/Helvétios/posts/café',
      );
    });
  });

  describe('ASCII extension attributes', () => {
    it('passes through ASCII values without modification', () => {
      const req = makeMockRequest({
        'ce-specversion': '1.0',
        'ce-type': 'google.cloud.firestore.document.v1.created',
        'ce-source': '//firestore.googleapis.com/projects/my-project',
        'ce-id': 'test-id',
        'ce-document': 'users/hello-world',
      });
      const context = getBinaryCloudEventContext(req);
      assert.strictEqual(
        context['document' as keyof typeof context],
        'users/hello-world',
      );
    });
  });
});
