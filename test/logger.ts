import * as sinon from 'sinon';
import * as assert from 'assert';
import {splitArgs, getModifiedData} from '../src/logger';
import * as executionContext from '../src/async_local_storage';

describe('splitArgs', () => {
  const expectedCallback = () => {};
  const expectedEncoding = 'utf-8';

  it('empty', () => {
    const {encoding, cb} = splitArgs([]);
    assert.equal(encoding, undefined);
    assert.equal(cb, undefined);
  });

  it('callback', () => {
    const {encoding, cb} = splitArgs([expectedCallback]);
    assert.equal(encoding, undefined);
    assert.equal(cb, expectedCallback);
  });

  it('encoding', () => {
    const {encoding, cb} = splitArgs([expectedEncoding]);
    assert.equal(encoding, expectedEncoding);
    assert.equal(cb, undefined);
  });

  it('encoding and callback', () => {
    const {encoding, cb} = splitArgs([expectedEncoding, expectedCallback]);
    assert.equal(encoding, expectedEncoding);
    assert.equal(cb, expectedCallback);
  });

  it('invalid args', () => {
    const {encoding, cb} = splitArgs(['error-encoding', expectedCallback]);
    assert.equal(encoding, undefined);
    assert.equal(cb, undefined);
  });
});

describe('getModifiedData', () => {
  const sampleText = 'abc';
  const sampleJSON = JSON.stringify({
    text: 'default text.',
    component: 'arbitrary-property',
  });
  const sampleUint8Arr = new Uint8Array(Buffer.from(sampleText));
  const expectedExecutionContext = {
    executionId: 'testExecutionId',
    traceId: 'testTraceId',
    spanId: 'testSpanId',
  };
  const expectedMetadata = {
    'logging.googleapis.com/labels': {
      execution_id: 'testExecutionId',
    },
    'logging.googleapis.com/trace': 'testTraceId',
    'logging.googleapis.com/spanId': 'testSpanId',
  };
  const expectedTextOutput =
    JSON.stringify(Object.assign({message: sampleText}, expectedMetadata)) +
    '\n';
  const expectedJSONOutput =
    JSON.stringify(Object.assign(JSON.parse(sampleJSON), expectedMetadata)) +
    '\n';

  function utf8ToHex(data: string) {
    return Buffer.from(data, 'utf-8').toString('hex');
  }

  let getCurrentContextStub: sinon.SinonStub;
  beforeEach(() => {
    getCurrentContextStub = sinon.stub(executionContext, 'getCurrentContext');
    getCurrentContextStub.returns(expectedExecutionContext);
  });

  afterEach(() => {
    getCurrentContextStub.restore();
  });

  it('simple text', () => {
    const modifiedData = getModifiedData(sampleText);
    assert.equal(modifiedData, expectedTextOutput);
  });

  it('json', () => {
    const modifiedData = getModifiedData(sampleJSON);
    assert.equal(modifiedData, expectedJSONOutput);
  });

  it('json with user label', () => {
    const data = JSON.stringify({
      text: 'default text.',
      component: 'arbitrary-property',
      'logging.googleapis.com/labels': {user_label_1: 'value_1'},
    });
    const expectedOutput =
      JSON.stringify({
        text: 'default text.',
        component: 'arbitrary-property',
        'logging.googleapis.com/labels': {
          user_label_1: 'value_1',
          execution_id: 'testExecutionId',
        },
        'logging.googleapis.com/trace': 'testTraceId',
        'logging.googleapis.com/spanId': 'testSpanId',
      }) + '\n';
    const modifiedData = getModifiedData(data);
    assert.equal(modifiedData, expectedOutput);
  });

  it('uint8array', () => {
    const modifiedData = getModifiedData(sampleUint8Arr);
    assert.equal(modifiedData, expectedTextOutput);
  });

  it('simple text with encoding', () => {
    const modifiedData = getModifiedData(utf8ToHex(sampleText), 'hex');
    assert.equal(modifiedData, expectedTextOutput);
  });

  it('json with encoding', () => {
    const modifiedData = getModifiedData(utf8ToHex(sampleJSON), 'hex');
    assert.equal(modifiedData, expectedJSONOutput);
  });

  it('uint8Array with encoding', () => {
    // Encoding will be ignored when the first parameter is Uint8Array.
    // This behavious is the same as process.stdout[/stderr].write.
    const modifiedData = getModifiedData(sampleUint8Arr, 'hex');
    assert.equal(modifiedData, expectedTextOutput);
  });

  it('simple text with error', () => {
    const modifiedData = getModifiedData(sampleText, undefined, true);
    const expectedOutput =
      JSON.stringify(
        Object.assign(JSON.parse(expectedTextOutput))
      ) + '\n';
    assert.equal(modifiedData, expectedOutput);
  });

  it('json with error', () => {
    const modifiedData = getModifiedData(sampleJSON, undefined, true);
    const expectedOutput =
      JSON.stringify(
        Object.assign(JSON.parse(expectedJSONOutput), {severity: 'ERROR'})
      ) + '\n';
    assert.equal(modifiedData, expectedOutput);
  });

  it('parses firebase warning severity and message', () => {
    const modifiedData = <string>(
      getModifiedData(
        '\u001b[33m{"severity":"WARNING","message":"testing warning log level"}\u001b[39m\n',
        undefined,
        true
      )
    );
    assert.equal('WARNING', JSON.parse(modifiedData)['severity']);
    assert.equal(
      'testing warning log level',
      JSON.parse(modifiedData)['message']
    );
  });

  it('parses firebase error severity and message', () => {
    const modifiedData = <string>(
      getModifiedData(
        '\u001b[31m{"severity":"ERROR","message":"testing error log level"}\u001b[39m\n',
        undefined,
        true
      )
    );
    assert.equal('ERROR', JSON.parse(modifiedData)['severity']);
    assert.equal(
      'testing error log level',
      JSON.parse(modifiedData)['message']
    );
  });
});
