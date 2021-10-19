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

describe('function_registry', () => {
  it('can register http functions', () => {
    FunctionRegistry.http('httpFunction', () => 'HTTP_PASS');
    const {
      userFunction,
      signatureType,
    } = FunctionRegistry.getRegisteredFunction('httpFunction')!;
    assert.deepStrictEqual('http', signatureType);
    assert.deepStrictEqual((userFunction as () => string)(), 'HTTP_PASS');
  });

  it('can register cloudevent functions', () => {
    FunctionRegistry.cloudevent('ceFunction', () => 'CE_PASS');
    const {
      userFunction,
      signatureType,
    } = FunctionRegistry.getRegisteredFunction('ceFunction')!;
    assert.deepStrictEqual('cloudevent', signatureType);
    assert.deepStrictEqual((userFunction as () => string)(), 'CE_PASS');
  });

  it('can register cloudevent functions with types', () => {
    interface MyInterface {
      greeting: string;
    }

    const castFn = (o: object) => o as MyInterface;
    FunctionRegistry.cloudevent('ceFunction', castFn, () => 'CE_PASS');
    const {
      userFunction,
      signatureType,
    } = FunctionRegistry.getRegisteredFunction('ceFunction')!;
    assert.deepStrictEqual('cloudevent', signatureType);
    assert.deepStrictEqual((userFunction as () => string)(), 'CE_PASS');
  });
});
