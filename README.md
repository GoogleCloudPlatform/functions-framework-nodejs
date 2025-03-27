# Functions Framework for Node.js

[![npm version](https://img.shields.io/npm/v/@google-cloud/functions-framework.svg)](https://www.npmjs.com/package/@google-cloud/functions-framework) [![npm downloads](https://img.shields.io/npm/dm/@google-cloud/functions-framework.svg)](https://npmcharts.com/compare/@google-cloud/functions-framework?minimal=true)

[![Node unit CI][ff_node_unit_img]][ff_node_unit_link] [![Node lint CI][ff_node_lint_img]][ff_node_lint_link] [![Node conformace CI][ff_node_conformance_img]][ff_node_conformance_link]  ![Security Scorecard](https://api.securityscorecards.dev/projects/github.com/GoogleCloudPlatform/functions-framework-nodejs/badge)

An open source FaaS (Function as a Service) framework based on [Express](https://expressjs.com/)
for writing portable Node.js functions.

The Functions Framework lets you write lightweight functions that run in many
different environments, including:

*   [Google Cloud Run functions](https://cloud.google.com/functions/)
*   Your local development machine
*   [Cloud Run](https://cloud.google.com/run/) and [Cloud Run for Anthos](https://cloud.google.com/anthos/run)
*   [Knative](https://github.com/knative/)-based environments

The framework allows you to go from:

```js
/**
 * Send "Hello, World!"
 * @param req https://expressjs.com/en/api.html#req
 * @param res https://expressjs.com/en/api.html#res
 */
exports.helloWorld = (req, res) => {
  res.send('Hello, World!');
};
```

To:

```sh
curl http://my-url
# Output: Hello, World!
```

All without needing to worry about writing an HTTP server or complicated request
handling logic.

> Watch [this video](https://youtu.be/yMEcyAkTliU?t=912) to learn more about the Node Functions Framework.

## Features

- Spin up a local development server for quick testing
- Invoke a function in response to a request
- Automatically unmarshal events conforming to the
  [CloudEvents](https://cloudevents.io/) spec
- Portable between serverless platforms

## Installation

Add the Functions Framework to your `package.json` file using `npm`.

```sh
npm install @google-cloud/functions-framework
```

## Quickstarts

### Quickstart: Hello, World on your local machine

1. Create an `index.js` file with the following contents:

    ```js
    exports.helloWorld = (req, res) => {
      res.send('Hello, World');
    };
    ```

1. Run the following command:

    ```sh
    npx @google-cloud/functions-framework --target=helloWorld
    ```

1. Open http://localhost:8080/ in your browser and see _Hello, World_.

### Quickstart: Set up a new project

1. Create a `package.json` file using `npm init`:

    ```sh
    npm init
    ```

1. Create an `index.js` file with the following contents:

    ```js
    const functions = require('@google-cloud/functions-framework');

    functions.http('helloWorld', (req, res) => {
      res.send('Hello, World');
    });
    ```

1. Now install the Functions Framework:

    ```sh
    npm install @google-cloud/functions-framework
    ```

1. Add a `start` script to `package.json`, with configuration passed via
command-line arguments:

    ```js
      "scripts": {
        "start": "functions-framework --target=helloWorld"
      }
    ```

1. Use `npm start` to start the built-in local development server:

    ```sh
    npm start
    ...
    Serving function...
    Function: helloWorld
    URL: http://localhost:8080/
    ```

1. Send requests to this function using `curl` from another terminal window:

    ```sh
    curl localhost:8080
    # Output: Hello, World
    ```

### Quickstart: Build a Deployable Container

1. Install [Docker](https://store.docker.com/search?type=edition&offering=community) and the [`pack` tool](https://buildpacks.io/docs/install-pack/).

1. Build a container from your function using the Functions [buildpacks](https://github.com/GoogleCloudPlatform/buildpacks):
	
    ```sh
    pack build \
      --builder gcr.io/buildpacks/builder:v1 \
      --env GOOGLE_FUNCTION_SIGNATURE_TYPE=http \
      --env GOOGLE_FUNCTION_TARGET=helloWorld \
      my-first-function
    ```

1. Start the built container:
    
    ```sh
    docker run --rm -p 8080:8080 my-first-function
    # Output: Serving function...
    ```

1. Send requests to this function using `curl` from another terminal window:
    
    ```sh
    curl localhost:8080
    # Output: Hello, World!
    ```

## Run your function on serverless platforms

### Google Cloud Run functions

The [Node.JS runtime on Cloud Run functions](https://cloud.google.com/functions/docs/concepts/nodejs-runtime) utilizes the Node.JS Functions Framework. On Cloud Run functions, the Functions Framework is completely optional: if you don't add it to your `package.json`, it will be
installed automatically. For

After you've written your function, you can simply deploy it from your local
machine using the `gcloud` command-line tool.
[Check out the Cloud Functions quickstart](https://cloud.google.com/functions/docs/quickstart).

### Container environments based on KNative

Cloud Run and Cloud Run for Anthos both implement the [Knative Serving API](https://www.knative.dev/docs/). The Functions Framework is designed to be compatible with Knative environments. Just build and deploy your container to a Knative environment.

## Configure the Functions Framework

You can configure the Functions Framework using command-line flags or
environment variables. If you specify both, the environment variable will be
ignored.

| Command-line flag  | Environment variable      | Description                                                                                                                                                                                                      |
| ------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--port`           | `PORT`                    | The port on which the Functions Framework listens for requests. Default: `8080`                                                                                                                                  |
| `--target`         | `FUNCTION_TARGET`         | The name of the exported function to be invoked in response to requests. Default: `function`                                                                                                                     |
| `--signature-type` | `FUNCTION_SIGNATURE_TYPE` | The signature used when writing your function. Controls unmarshalling rules and determines which arguments are used to invoke your function. Default: `http`; accepted values: `http` or `event` or `cloudevent` |
| `--source`         | `FUNCTION_SOURCE`         | The path to the directory of your function. Default: `cwd` (the current working directory)                                                                                                                       |
| `--log-execution-id`| `LOG_EXECUTION_ID`        | Enables execution IDs in logs, either `true` or `false`. When not specified, default to disable. Requires Node.js 13.0.0 or later.                                                                                |
| `--ignored-routes`| `IGNORED_ROUTES`        | A route expression for requests that should not be routed the function. An empty 404 response will be returned. This is set to `/favicon.ico|/robots.txt` by default for `http` functions.                                                     |

You can set command-line flags in your `package.json` via the `start` script.
For example:

```js
  "scripts": {
    "start": "functions-framework --target=helloWorld"
  }
```

## Enable Google Cloud Run functions Events

The Functions Framework can unmarshall incoming
Google Cloud Functions [event](https://cloud.google.com/functions/docs/concepts/events-triggers#events) payloads to `data` and `context` objects.
These will be passed as arguments to your function when it receives a request.
Note that your function must use the `event`-style function signature:

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

## Enable CloudEvents

The Functions Framework can unmarshall incoming
[CloudEvents](http://cloudevents.io) payloads to a `cloudevent` object.
It will be passed as an argument to your function when it receives a request.
Note that your function must use the `cloudevent`-style function signature:

```js
const functions = require('@google-cloud/functions-framework');

functions.cloudEvent('helloCloudEvents', (cloudevent) => {
  console.log(cloudevent.specversion);
  console.log(cloudevent.type);
  console.log(cloudevent.source);
  console.log(cloudevent.subject);
  console.log(cloudevent.id);
  console.log(cloudevent.time);
  console.log(cloudevent.datacontenttype);
});
```

## Advanced Docs

More advanced guides and docs can be found in the [`docs/` folder](docs/).

## Contributing

Contributions to this library are welcome and encouraged. See
[CONTRIBUTING](CONTRIBUTING.md) for more information on how to get started.

[ff_node_unit_img]: https://github.com/GoogleCloudPlatform/functions-framework-nodejs/actions/workflows/unit.yml/badge.svg
[ff_node_unit_link]:  https://github.com/GoogleCloudPlatform/functions-framework-nodejs/actions/workflows/unit.yml
[ff_node_lint_img]: https://github.com/GoogleCloudPlatform/functions-framework-nodejs/actions/workflows/lint.yml/badge.svg
[ff_node_lint_link]:  https://github.com/GoogleCloudPlatform/functions-framework-nodejs/actions/workflows/lint.yml
[ff_node_conformance_img]: https://github.com/GoogleCloudPlatform/functions-framework-nodejs/actions/workflows/conformance.yml/badge.svg
[ff_node_conformance_link]:  https://github.com/GoogleCloudPlatform/functions-framework-nodejs/actions/workflows/conformance.yml
