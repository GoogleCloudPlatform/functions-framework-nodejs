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
import * as express from 'express';
import * as semver from 'semver';
import * as functions from '../src/functions';
import * as loader from '../src/loader';
import * as FunctionRegistry from '../src/function_registry';

describe('loading function', () => {
  interface TestData {
    name: string;
    codeLocation: string;
    target: string;
  }

  const testData: TestData[] = [
    {
      name: 'function without "main" in package.json',
      codeLocation: '/test/data/without_main',
      target: 'testFunction',
    },
    {
      name: 'function with "main" in package.json',
      codeLocation: '/test/data/with_main',
      target: 'testFunction',
    },
  ];

  for (const test of testData) {
    it(`should load ${test.name}`, async () => {
      const loadedFunction = await loader.getUserFunction(
        process.cwd() + test.codeLocation,
        test.target,
        'http'
      );
      const userFunction =
        loadedFunction?.userFunction as functions.HttpFunction;
      const returned = userFunction(express.request, express.response);
      assert.strictEqual(returned, 'PASS');
    });
  }

  const esmTestData: TestData[] = [
    {
      name: 'specified in package.json type field',
      codeLocation: '/test/data/esm_type',
      target: 'testFunction',
    },
    {
      name: 'nested dir, specified in package.json type field',
      codeLocation: '/test/data/esm_nested',
      target: 'testFunction',
    },
    {
      name: '.mjs extension',
      codeLocation: '/test/data/esm_mjs',
      target: 'testFunction',
    },
  ];

  for (const test of esmTestData) {
    const loadFn: () => Promise<functions.HttpFunction> = async () => {
      const loadedFunction = await loader.getUserFunction(
        process.cwd() + test.codeLocation,
        test.target,
        'http'
      );
      return loadedFunction?.userFunction as functions.HttpFunction;
    };
    if (semver.lt(process.version, loader.MIN_NODE_VERSION_ESMODULES)) {
      it(`should fail to load function in an ES module ${test.name}`, async () => {
        assert.rejects(loadFn);
      });
    } else {
      it(`should load function in an ES module ${test.name}`, async () => {
        const loadedFunction = await loadFn();
        const returned = loadedFunction(express.request, express.response);
        assert.strictEqual(returned, 'PASS');
      });
    }
  }

  it('fails to load a module that does not exist', async () => {
    const loadedFunction = await loader.getUserFunction(
      process.cwd() + '/test/data/does_not_exist',
      'functionDoesNotExist',
      'http'
    );

    assert.strictEqual(loadedFunction, null);
  });

  it('fails to load a function that does not exist', async () => {
    const loadedFunction = await loader.getUserFunction(
      process.cwd() + '/test/data/with_main',
      'functionDoesNotExist',
      'http'
    );

    assert.strictEqual(loadedFunction, null);
  });

  it('loads a declaratively registered function', async () => {
    FunctionRegistry.http('registeredFunction', () => {
      return 'PASS';
    });
    const loadedFunction = await loader.getUserFunction(
      process.cwd() + '/test/data/with_main',
      'registeredFunction',
      'http'
    );
    const userFunction = loadedFunction?.userFunction as functions.HttpFunction;
    const returned = userFunction(express.request, express.response);
    assert.strictEqual(returned, 'PASS');
  });

  it('allows a mix of registered and non registered functions', async () => {
    FunctionRegistry.http('registeredFunction', () => {
      return 'FAIL';
    });
    const loadedFunction = await loader.getUserFunction(
      process.cwd() + '/test/data/with_main',
      'testFunction',
      'http'
    );
    const userFunction = loadedFunction?.userFunction as functions.HttpFunction;
    const returned = userFunction(express.request, express.response);
    assert.strictEqual(returned, 'PASS');
  });

  it('respects the registered signature type', async () => {
    FunctionRegistry.cloudEvent('registeredFunction', () => {});
    const loadedFunction = await loader.getUserFunction(
      process.cwd() + '/test/data/with_main',
      'registeredFunction',
      'http'
    );
    assert.strictEqual(loadedFunction?.signatureType, 'cloudevent');
  });
});
