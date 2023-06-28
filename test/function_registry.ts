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
import * as FunctionRegistry from '../src/function_registry';
import {JsonInvocationFormat} from '../src';

describe('function_registry', () => {
  it('can register http functions', () => {
    FunctionRegistry.http('httpFunction', () => 'HTTP_PASS');
    const {userFunction, signatureType} =
      FunctionRegistry.getRegisteredFunction('httpFunction')!;
    assert.deepStrictEqual('http', signatureType);
    assert.deepStrictEqual((userFunction as () => string)(), 'HTTP_PASS');
  });

  it('can register CloudEvent functions', () => {
    FunctionRegistry.cloudEvent('ceFunction', () => 'CE_PASS');
    const {userFunction, signatureType} =
      FunctionRegistry.getRegisteredFunction('ceFunction')!;
    assert.deepStrictEqual('cloudevent', signatureType);
    assert.deepStrictEqual((userFunction as () => string)(), 'CE_PASS');
  });

  it('can register typed functions', () => {
    FunctionRegistry.typed('typedFunction', (identity: string) => identity);
    const {userFunction, signatureType} =
      FunctionRegistry.getRegisteredFunction('typedFunction')!;
    assert.deepStrictEqual('typed', signatureType);

    assert.ok(!(userFunction instanceof Function));
    assert.ok(userFunction.format instanceof JsonInvocationFormat);
  });

  it('throws an error if you try to register a function with an invalid URL', () => {
    // Valid function names
    const validFunctions = ['httpFunction', 'ceFunction', 'test-func'];
    validFunctions.forEach(functionName => {
      assert.doesNotThrow(() => {
        FunctionRegistry.http(functionName, () => 'OK');
      });
    });

    // Invalid function names
    const invalidFunctions = ['', 'foo bar', 'ស្ថានីយ'];
    invalidFunctions.forEach(functionName => {
      assert.throws(() => {
        FunctionRegistry.http(functionName, () => 'OK');
      });
    });
  });
});
