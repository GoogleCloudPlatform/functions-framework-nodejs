/**
 * Test HTTP function to test function loading.
 *
 * @param {!Object} req request context.
 * @param {!Object} res response context.
 */
function testFunction (req, res) {
  return 'PASS'
};

module.exports = {
  testFunction,
}
