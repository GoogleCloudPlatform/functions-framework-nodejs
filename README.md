# Functions Framework for Node.js [![Build Status](https://travis-ci.com/GoogleCloudPlatform/functions-framework-nodejs.svg?branch=master)](https://travis-ci.com/GoogleCloudPlatform/functions-framework-nodejs) [![npm version](https://img.shields.io/npm/v/@google-cloud/functions-framework.svg)](https://www.npmjs.com/package/@google-cloud/functions-framework)

An open source FaaS (Function as a service) framework for writing portable
Node.js functions -- brought to you by the Google Cloud Functions team.

The Functions Framework lets you write lightweight functions that run in many
different environments, including:

*   [Google Cloud Functions](https://cloud.google.com/functions/)
*   Your local development machine
*   [Cloud Run and Cloud Run on GKE](https://cloud.google.com/run/)
*   [Knative](https://github.com/knative/)-based environments

The framework allows you to go from:

```js
exports.helloWorld = (req, res) => {
  res.send('Hello, World');
};
```

To:

```sh
curl http://my-url
# Output: Hello, World
```

All without needing to worry about writing an HTTP server or complicated request
handling logic.

# Features

*   Spin up a local development server for quick testing
*   Invoke a function in response to a request
*   Automatically unmarshal events conforming to the
    [CloudEvents](https://cloudevents.io/) spec
*   Portable between serverless platforms

# Installation

Add the Functions Framework to your `package.json` file using `npm`.

```sh
npm install @google-cloud/functions-framework
```

# Quickstart: Hello, World on your local machine

Create an `index.js` file with the following contents:

```js
exports.helloWorld = (req, res) => {
  res.send('Hello, World');
};
```

Run the following command:

```sh
npx @google-cloud/functions-framework --target=helloWorld
```

Open http://localhost:8080/ in your browser and see *Hello, World*.


# Quickstart: Set up a new project

Create an `index.js` file with the following contents:

```js
exports.helloWorld = (req, res) => {
  res.send('Hello, World');
};
```

To run a function locally, first create a `package.json` file using `npm init`:

```sh
npm init
```

Now install the Functions Framework:

```sh
npm install @google-cloud/functions-framework
```

Add a `start` script to `package.json`, with configuration passed via
command-line arguments:

```js
  "scripts": {
    "start": "functions-framework --target=helloWorld"
  }
```

Use `npm start` to start the built-in local development server:

```sh
npm start
...
Serving function...
Function: helloWorld
URL: http://localhost:8080/
```

Send requests to this function using `curl` from another terminal window:

```sh
curl localhost:8080
# Output: Hello, World
```

# Run your function on serverless platforms

## Google Cloud Functions

The
[Node.js 10 runtime on Google Cloud Functions](https://cloud.google.com/functions/docs/concepts/nodejs-10-runtime)
is based on the Functions Framework. On Cloud Functions, the Functions Framework
is completely optional: if you don't add it to your `package.json`, it will be
installed automatically.

After you've written your function, you can simply deploy it from your local
machine using the `gcloud` command-line tool.
[Check out the Cloud Functions quickstart](https://cloud.google.com/functions/docs/quickstart).

## Cloud Run/Cloud Run on GKE

Once you've written your function, added the Functions Framework and updated your `start` script in `package.json`, all that's left is to create a container image. [Check out the Cloud Run quickstart](https://cloud.google.com/run/docs/quickstarts/build-and-deploy) for Node.js to create a container image and deploy it to Cloud Run. You'll write a `Dockerfile` when you build your container. This `Dockerfile` allows you to specify exactly what goes into your container (including custom binaries, a specific operating system, and more).

If you want even more control over the environment, you can [deploy your container image to Cloud Run on GKE](https://cloud.google.com/run/docs/quickstarts/prebuilt-deploy-gke). With Cloud Run on GKE, you can run your function on a GKE cluster, which gives you additional control over the environment (including use of GPU-based instances, longer timeouts and more).

## Container environments based on Knative

Cloud Run and Cloud Run on GKE both implement the [Knative Serving API](https://www.knative.dev/docs/). The Functions Framework is designed to be compatible with Knative environments. Just build and deploy your container to a Knative environment.

# Configure the Functions Framework

You can configure the Functions Framework using command-line flags or
environment variables. If you specify both, the environment variable will be
ignored.

Command-line flag         | Environment variable      | Description
------------------------- | ------------------------- | -----------
`--port`                    | `PORT`                    | The port on which the Functions Framework listens for requests. Default: `8080`
`--target`         | `FUNCTION_TARGET`         | The name of the exported function to be invoked in response to requests. Default: `function`
`--signature-type` | `FUNCTION_SIGNATURE_TYPE` | The signature used when writing your function. Controls unmarshalling rules and determines which arguments are used to invoke your function. Default: `http`; accepted values: `http` or `event`

You can set command-line flags in your `package.json` via the `start` script.
For example:

```js
  "scripts": {
    "start": "functions-framework --target=helloWorld"
  }
```

# Enable CloudEvents

The Functions Framework can unmarshall incoming
[CloudEvents](http://cloudevents.io) payloads to `data` and `context` objects.
These will be passed as arguments to your function when it receives a request.
Note that your function must use the event-style function signature:

```js
exports.helloEvents = (data, context) => {
  console.log(data);
  console.log(context);
};
```

To enable automatic unmarshalling, set the function signature type to `event`
using a command-line flag or an environment variable. By default, the HTTP
signature will be used and automatic event unmarshalling will be disabled.

For more details on this signature type, check out the Google Cloud Functions
documentation on
[background functions](https://cloud.google.com/functions/docs/writing/background#cloud_pubsub_example).

## Local testing of cloud events
The setup for cloud functions that accept events is very similar to the instructions in the quickstart, with the following adjustments differences.

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
curl -d "@mockPubsub.json" -X POST http://localhost:8080
```
 
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


# Contributing

Contributions to this library are welcome and encouraged. See
[CONTRIBUTING](CONTRIBUTING.md) for more information on how to get started.
