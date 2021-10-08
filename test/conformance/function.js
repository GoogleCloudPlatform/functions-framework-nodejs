/* eslint-disable node/no-missing-require */
const fs = require('fs');
const functions = require('@google-cloud/functions-framework');
const fileName = 'function_output.json';

functions.http('writeHttpDeclarative', (req, res) => {
  writeJson(req.body);
  res.end(200);
});

functions.cloudevent('writeCloudEventDeclarative', cloudevent => {
  cloudevent.datacontenttype = 'application/json';
  writeJson(cloudevent);
});

function writeHttp(req, res) {
  writeJson(req.body);
  res.end(200);
}

function writeCloudEvent(cloudevent) {
  cloudevent.datacontenttype = 'application/json';
  writeJson(cloudevent);
}

function writeLegacyEvent(data, context) {
  const content = {
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
  const json = JSON.stringify(content);
  fs.writeFileSync(fileName, json);
}

module.exports = {
  writeHttp,
  writeCloudEvent,
  writeLegacyEvent,
};
