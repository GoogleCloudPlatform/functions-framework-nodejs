import * as sinon from 'sinon';
import * as assert from 'assert';
import {splitArgs, getModifiedData} from '../src/logger';
import * as executionContext from '../src/execution_context';

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
  const expectedExecutionContext = {
    'logging.googleapis.com/labels': {
      executionId: 'testExecutionId',
    },
    'logging.googleapis.com/trace': 'testTraceId',
    'logging.googleapis.com/spanId': 'testSpanId',
  };
  const expectedTextOutput =
    JSON.stringify({
      ...expectedExecutionContext,
      message: sampleText,
    }) + '\n';
  const expectedJSONOutput =
    JSON.stringify({
      ...expectedExecutionContext,
      ...JSON.parse(sampleJSON),
    }) + '\n';

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

  it('uint8array', () => {
    const modifiedData = getModifiedData(Buffer.from(sampleText));
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
    const modifiedData = getModifiedData(Buffer.from(sampleText), 'hex');
    assert.equal(modifiedData, expectedTextOutput);
  });

  it('simple text with error', () => {
    const modifiedData = getModifiedData(sampleText, undefined, true);
    const expectedOutput =
      JSON.stringify({
        ...expectedExecutionContext,
        message: sampleText,
        severity: 'ERROR',
      }) + '\n';
    assert.equal(modifiedData, expectedOutput);
  });

  it('json with error', () => {
    const modifiedData = getModifiedData(sampleJSON, undefined, true);
    const expectedOutput =
      JSON.stringify({
        ...expectedExecutionContext,
        ...JSON.parse(sampleJSON),
        severity: 'ERROR',
      }) + '\n';
    assert.equal(modifiedData, expectedOutput);
  });
});
