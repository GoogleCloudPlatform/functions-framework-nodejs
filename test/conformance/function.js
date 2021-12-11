/* eslint-disable node/no-missing-require */
const fs = require('fs');
const functions = require('@google-cloud/functions-framework');
const fileName = 'function_output.json';

functions.http('writeHttpDeclarative', (req, res) => {
  writeJson(req.body);
  res.status(200).end();
});

functions.cloudEvent('writeCloudEventDeclarative', cloudEvent => {
  cloudEvent.datacontenttype = 'application/json';
  writeJson(cloudEvent);
});

function writeHttp(req, res) {
  writeJson(req.body);
  res.status(200).end();
}

function writeCloudEvent(cloudEvent) {
  cloudEvent.datacontenttype = 'application/json';
  writeJson(cloudEvent);
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
