# Functions Framework for Node.js

An open source FaaS (Function as a service) framework for writing portable
Node.js functions -- brought to you by the Google Cloud Functions team.

The Functions Framework lets you write lightweight functions that run in many
different environments, including:

*   [Google Cloud Functions](https://cloud.google.com/functions/)
*   Your local development machine
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
npx @google-cloud/functions-framework --function-target=helloWorld
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
    "start": "functions-framework --function-target=helloWorld"
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

## Container environments based on Knative

The Functions Framework is designed to be compatible with Knative environments.
Just build and deploy your container to a Knative environment.

# Configure the Functions Framework

You can configure the Functions Framework using command-line flags or
environment variables. If you specify both, the environment variable will be
ignored.

Command-line flag         | Environment variable      | Description
------------------------- | ------------------------- | -----------
`--port`                    | `PORT`                    | The port on which the Functions Framework listens for requests. Default: `8080`
`--function-target`         | `FUNCTION_TARGET`         | The name of the exported function to be invoked in response to requests. Default: `function`
`--function-signature-type` | `FUNCTION_SIGNATURE_TYPE` | The signature used when writing your function. Controls unmarshalling rules and determines which arguments are used to invoke your function. Default: `http`; accepted values: `http` or `event`

You can set command-line flags in your `package.json` via the `start` script.
For example:

```js
  "scripts": {
    "start": "functions-framework --function-target=helloWorld"
  }
```

# Enable CloudEvents handling for use with the event function signature

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

# Contributing

Contributions to this library are welcome and encouraged. See
[CONTRIBUTING](CONTRIBUTING.md) for more information on how to get started.
