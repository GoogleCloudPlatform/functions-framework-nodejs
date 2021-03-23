const fs = require("fs");
const fileName = "function_output.json";

function writeHttp(req, res) {
  writeJson(req.body);
  res.send('All good.');
}

function writeCloudEvent(cloudevent) {
  cloudevent.datacontenttype = "application/json"
  writeJson(cloudevent);
}

function writeLegacyEvent(data, context) {
  content = {
    data: data,
    context: {
      eventId: context.eventId,
      timestamp: context.timestamp,
      eventType: context.eventType,
      resource: context.resource,
    },
  };
  writeJson(content);
}

function writeJson(content) {
  json = JSON.stringify(content);
  fs.writeFileSync(fileName, json);
}

module.exports = {
  writeHttp,
  writeCloudEvent,
  writeLegacyEvent,
};
