## Local Testing of Cloud Events

The setup for cloud functions that accept events is very similar to the instructions in the quickstart, with the following adjustments:

In your `package.json`, add a signature type (in bold) to your start command:

<pre>
  "scripts": {
    "start": "functions-framework --target=helloWorld <b>--signature-type=event"</b>
  }
</pre>

Upon running ```sh npm start ```, you'll see the function is still being served at `http://localhost:8080/`. However, it is no longer accessible via GET requests from the browser. Instead, send a POST request where the request body conforms to the API defined by [push subscriptions](https://cloud.google.com/pubsub/docs/push). 

### Submitting POST Request to Simulate Pub/Sub messages

Create a `mockPubsub.json` file with the following contents:

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

The file can be in any folder on your computer. From the terminal, go to the directory where `mockPubsub.json` is located, and run the following command (assuming your cloud function is hosted locally on port 8080):

```sh 
curl -d "@mockPubsub.json" \
  -X POST \
  -H "Ce-Type: true" \
  -H "Ce-Specversion: true" \
  -H "Ce-Source: true" \
  -H "Ce-Id: true" \
  http://localhost:8080
```
 
### Using the Pub/Sub emulator

Another way to test your cloud function Pub/Sub endpoint is to use the [Pub/Sub Emulator](https://cloud.google.com/pubsub/docs/emulator). This allows you to use the Pub/Sub notification from another service to trigger your cloud function.

The high level approach is to:
1. Start the Pub/Sub Emulator
2. Use the Pub/Sub client library to create a subscription and set the `pushEndpoint` to `http://localhost:8080`.

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
    pushEndpoint: 'https://localhost:8080',
  });
}

main();
 ```