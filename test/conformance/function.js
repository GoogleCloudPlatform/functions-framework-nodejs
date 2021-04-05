const fs = require('fs');
const fileName = 'function_output.json';

function writeHttp(req, res) {
  writeJson(req.body);
  res.status(200).send();
}

function writeCloudEvent(cloudevent) {
  // cloudevent.datacontenttype = "application/json"
  writeJson(cloudevent);
}

function writeLegacyEvent(data, context) {
  writeJson({data, context});
}

function writeJson(content) {
  const json = JSON.stringify(content);
  fs.writeFileSync(fileName, json);
}

module.exports = {
  writeHttp,
  writeCloudEvent,
  writeLegacyEvent,
};
