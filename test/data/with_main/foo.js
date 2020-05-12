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
  return 'PASS';
};

module.exports = {
  testHttpFunction,
  testEventFunction,
}
