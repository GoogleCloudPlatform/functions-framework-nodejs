/**
 * Test HTTP function to test function loading.
 *
 * @param {!Object} req request context.
 * @param {!Object} res response context.
 */
function testHttpFunction (res, req) {
  return 'PASS'
};

/**
 * Test event function to test function loading.
 *
 * @param {!Object} data event payload.
 * @param {!Object} context event metadata.
 */
function testEventFunction (data, context) {
  console.log(data);
  console.log(context);
  return 'PASS';
};

/**
 * Test cloudevent function to test function loading.
 *
 * @param {!Object} cloudevent CloudEvents context.
 */
function testCloudEventFunction (cloudevent) {
  console.log(`specversion: ${cloudevent.specversion || 'undefined'}`);
  console.log(`type: ${cloudevent.type || 'undefined'}`);
  console.log(`source: ${cloudevent.source || 'undefined'}`);
  console.log(`subject: ${cloudevent.subject || 'undefined'}`);
  console.log(`id: ${cloudevent.id || 'undefined'}`);
  console.log(`time: ${cloudevent.time || 'undefined'}`);
  console.log(`datacontenttype: ${cloudevent.datacontenttype || 'undefined'}`);
  return 'PASS';
};

module.exports = {
  testHttpFunction,
  testEventFunction,
  testCloudEventFunction,
}
