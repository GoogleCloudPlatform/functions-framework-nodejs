# Events

This guide shows you how to use the Functions Framework for local testing with:

- CloudEvents
- The Pub/Sub Emulator

## Local Testing of CloudEvents

In your `package.json`, specify `--signature-type=event"` for the `functions-framework`:

```sh
{
  "scripts": {
    "start": "functions-framework --target=helloPubSub --signature-type=event"
  }
}
```

Create an `index.js` file:

```js
exports.helloPubSub = (data, context) => {
  console.log(data);
}
```

Start the Functions Framework:

```sh
npm start
```

Your function will be serving at `http://localhost:8080/`, however,
it is no longer accessible via `HTTP GET` requests from the browser.

Instead, send a POST request where the request body conforms to the API defined by [push subscriptions](https://cloud.google.com/pubsub/docs/push). 

### Send POST Request to Simulate Pub/Sub messages

Create a new file `mockPubsub.json` with the following contents:

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

In the same directory as `mockPubsub.json`,
use `curl` to invoke the Functions Framework including
the Pub/Sub JSON in the POST data:

```sh 
curl -d "@mockPubsub.json" \
  -X POST \
  -H "Ce-Type: true" \
  -H "Ce-Specversion: true" \
  -H "Ce-Source: true" \
  -H "Ce-Id: true" \
  -H "Content-Type: application/json" \
  http://localhost:8080
```

In the shell that is running the Functions Framework, you'll see the message logged:

```js
{
  message: {
    attributes: { key: 'value' },
    data: 'SGVsbG8gQ2xvdWQgUHViL1N1YiEgSGVyZSBpcyBteSBtZXNzYWdlIQ==',
    messageId: '136969346945'
  },
  subscription: 'projects/myproject/subscriptions/mysubscription'
}
```
 
## Using the Pub/Sub emulator

Another way to test your cloud function Pub/Sub endpoint is to use the [Pub/Sub Emulator](https://cloud.google.com/pubsub/docs/emulator). This allows you to use the Pub/Sub notification from another service to trigger your cloud function.

The high level approach is to:
1. [Start the Pub/Sub Emulator](https://cloud.google.com/pubsub/docs/emulator#start)
2. Use the Pub/Sub client library to create a subscription and set the `pushEndpoint` to `http://localhost:8080/[TOPIC NAME]`.

After setup, all notifications to the subscription topic will be pushed to your cloud function.

Here is a sample script for creating subscription with a `pushEndpoint`:

 ```js
const { PubSub } = require('@google-cloud/pubsub');

async function main() {
  const apiEndpoint = 'localhost:8085';
  console.log(`Listening to the Pub/Sub emulator event at: ${apiEndpoint}`);
  const pubsub = new PubSub({
    apiEndpoint, // Pub/Sub emulator endpoint
    projectId: 'myproject',
  });
  const topic = await pubsub.topic('my-topic');
  const [topicExists] = await topic.exists();
  if (!topicExists) {
    await topic.create();
  }
  const createSubscriptionResponse = await topic.createSubscription('my_subscription', {
    pushEndpoint: 'http://localhost:8080/projects/myproject/topics/my-topic',
  });
}

main();
 ```
