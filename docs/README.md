# Functions Framework Docs

This directory contains advanced docs around the Functions Framework.

- [Testing events and Pub/Sub](events.md)
- [Debugging Functions](debugging.md)
- [Running and Deploying Docker Containers](docker.md)

## TODO Docs

- TODO: Run Multiple Cloud Functions [#23](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/23)
- TODO: Deploy to Cloud Run [#28](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/pull/28)

## Debugging functions

The Functions Framework works with standard tooling that you might use when writing a function for a Node.js environment. You can attach a debugger to your function by following these steps.

1. Write an `index.js` file containing your Node.js function:

```js
exports.helloWorld = (req, res) => {
  res.send('Hello, World');
};
```

2. Install the Functions Framework:

```sh
npm install @google-cloud/functions-framework
```

3. Run `node`, enable the inspector and run the Functions Framework:

```sh
node --inspect node_modules/@google-cloud/functions-framework --target=helloWorld
...
Debugger listening on ws://127.0.0.1:9229/5f57f5e9-ea4b-43ce-be1d-6e9b838ade4a
For help see https://nodejs.org/en/docs/inspector
Serving function...
Function: helloWorld
URL: http://localhost:8080/
```

You can now use an IDE or other tooling to add breakpoints, step through your code and debug your function.

## Local testing of cloud events
The setup for cloud functions that accept events is very similar to the instructions in the quickstart, with the following adjustments:

In your package.json, add a signature type (in bold) to your start command:
<pre>
  "scripts": {
    "start": "functions-framework --target=helloWorld <b>--signature-type=event"</b>
  }
</pre>

Upon running ```sh npm start ```, you'll see the function is still being served at http://localhost:8080/. However it is no longer accessible via GET requests from the browser. Instead, send a POST request where the request body conforms to the API defined by [push subscriptions](https://cloud.google.com/pubsub/docs/push).

### Submitting POST request to simulating a pubsub message

Create mockPubsub.json file with the following contents:
```json
{
  "message": {
    "attributes": {
      "key": "value"
    },
    "data": "SGVsbG8gQ2xvdWQgUHViL1N1YiEgSGVyZSBpcyBteSBtZXNzYWdlIQ==",
    "messageId": "136969346945"
  },
  "subscription": "projects/myproject/subscriptions/mysubscription"
}
```

The file can be in any folder on your computer. From the terminal, goto the directory where ```mockPubsub.json``` is located, and run the following command assuming your cloud function is hosted locally on port 8080:
```sh
curl -d "@mockPubsub.json" -X POST \
  -H "Ce-Type: true" \
  -H "Ce-Specversion: true" \
  -H "Ce-Source: true" \
  -H "Ce-Id: true" \
  -H “Content-Type: application/json” \
  http://localhost:8080
```

> In order to simulate a Cloud Event, you need to add the ```Ce-*``` headers, along with a _truthy_ value, to the request.

 ### Using pubsub emulator

 Another way to test your cloud function pubsub endpoint is to use the [pubsub emulator](https://cloud.google.com/pubsub/docs/emulator). This allows you to use the pubsub notification from another service to trigger your cloud function.

 The high level approach is to:
 1. Start the pubsub emulator
 2. Use the pubsub client library to create a subscription and set the pushEndpoint to http://localhost:8080.

 After that, all notifications to the subscription topic will be pushed to your cloud function.

 Sample script for creating subscription with pushEndpoint:

 ```js
{ PubSub } require('@google-cloud/pubsub');

async function main() {
  const pubsub = new PubSub({
    apiEndpoint: 'localhost:8085', // Pubsub emulator endpoint
    projectId: 'myproject',
  });
  const topic = await pubsub.topic('my-topic');
  const [topicExists] = await topic.exists();
  if (!topicExists) {
    await topic.create();
  }
  const createSubscriptionResponse = await topic.createSubscription('my_subscription', {
    pushEndpoint: 'https://localhost:8080',
  });
}

main();
 ```
