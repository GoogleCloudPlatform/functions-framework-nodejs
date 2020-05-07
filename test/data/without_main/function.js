/**
 * 
 *
 * @param {!Object} req request context.
 * @param {!Object} res response context.
 */
function testHttpFunction (res, req) {
  return 'PASS'
};

/**
 * 
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
