<!--
# @title Testing Functions
-->

# Testing Functions

This guide covers writing unit tests for functions using the Functions Framework
for Node.js.

## Overview of function testing

One of the benefits of the functions-as-a-service paradigm is that functions are
easy to test. In many cases, you can simply call a function with input, and test
the output. You do not need to set up (or mock) an actual server.

The Functions Framework provides utility methods that streamline the process of
setting up functions and the environment for testing, constructing input
parameters, and interpreting results. These are available in the
`@google-cloud/functions-framework/testing` module.

## Loading functions for testing

The easiest way to get started unit testing Node.js Cloud Functions is to explicitly
export the functions you wish to unit test.

```js
// hello_tests.js
import * as functions from '@google-cloud/functions-framework';

// declare a cloud function and export it so that it can be
// imported in unit tests
export const HelloTests = (req, res) => {
  res.send('Hello, World!');
};

// register the HelloTests with the Functions Framework
functions.http('HelloTests', HelloTests);
```

This is a perfectly acceptable approach that allows you to keep your application
code decoupled from the Functions Framework, but it also has some drawbacks.
You won't automatically benefit from the implicit type hints and autocompletion
that are available when you pass a callback to `functions.http` directly:

```js
// hello_tests.js
import * as functions from '@google-cloud/functions-framework';

// register the HelloTests with the Functions Framework
functions.http('HelloTests', (req, res) => {
  // req and res are strongly typed here
});
```

The testing module provides a `getFunction` helper method that can be used to
access a function that was registered with the Functions Framework. To use it in
your unit test you must first load the module that registers the function you wish
to test.

```js
import {getFunction} from "@google-cloud/functions-framework/testing";

describe("HelloTests", () => {
  before(async () => {
    // load the module that defines HelloTests
    await import("./hello_tests.js");
  });

  it("is testable", () => {
    // get the function using the name it was registered with
    const HelloTest = getFunction("HelloTests");
    // ...
  });
});
```

## Testing HTTP functions

Testing an HTTP function is generally as simple as generating a request, calling
the function, and asserting against the response.

HTTP functions are passed an [express.Request](https://expressjs.com/en/api.html#req)
and an [express.Response](https://expressjs.com/en/api.html#res) as arguments. You can
create simple stubs to use in unit tests.

```js
import assert from "assert";
import {getFunction} from "@google-cloud/functions-framework/testing";

describe("HelloTests", () => {
  before(async () => {
    // load the module that defines HelloTests
    await import("./hello_tests.js");
  });

  it("is testable", () => {
    // get the function using the name it was registered with
    const HelloTest = getFunction("HelloTests");

    // a Request stub with a simple JSON payload
    const req = {
      body: { foo: "bar" },
    };
    // a Response stub that captures the sent response
    let result;
    const res = {
      send: (x) => {
        result = x;
      },
    };

    // invoke the function
    HelloTest(req, res);

    // assert the response matches the expected value
    assert.equal(result, "Hello, World!");
  });
});
```

## Testing CloudEvent functions

Testing a CloudEvent function works similarly. The
[JavaScript SDK for CloudEvents](https://github.com/cloudevents/sdk-javascript) provides
APIs to create stub CloudEvent objects for use in tests.

Unlike HTTP functions, event functions do not accept a response argument. Instead, you
will need to test side effects. A common approach is to replace your function's
dependencies with mock objects that can be used to verify its behavior. The
[sinonjs](https://sinonjs.org/) is a standalone library for creating mocks that work with
any Javascript testing framework:

```js
import assert from "assert";
import sinon from "sinon";
import {CloudEvent} from "cloudevents";
import {getFunction} from "@google-cloud/functions-framework/testing";

import {MyDependency} from "./my_dependency.js";

describe("HelloCloudEvent", () => {
  before(async () => {
    // load the module that defines HelloCloudEvent
    await import("./hello_cloud_event.js");
  });

  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.spy(MyDependency);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("uses MyDependency", () => {
    const HelloCloudEvent = getFunction("HelloCloudEvent");
    HelloCloudEvent(new CloudEvent({
      type: 'com.google.cloud.functions.test',
      source: 'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
    }));
    // assert that the cloud function invoked `MyDependency.someMethod()`
    assert(MyDependency.someMethod.calledOnce);
  });
});
```

## Integration testing with SuperTest

The `testing` module also includes utilities that help you write high-level, integration
tests to verify the behavior of the Functions Framework HTTP server that invokes your function
to respond to requests. The [SuperTest](https://github.com/visionmedia/supertest) library
provides a developer friendly API for writing HTTP integration tests in javascript. The
`testing` module includes a `getTestServer` helper to help you test your functions using
SuperTest.

```js
import supertest from 'supertest';
import {getTestServer} from '@google-cloud/functions-framework/testing';

describe("HelloTests", function () {
  before(async () => {
    // load the module that defines HelloTests
    await import("./hello_tests.js");
  });

  it("uses works with SuperTest", async () => {
    // call getTestServer with the name of function you wish to test
    const server = getTestServer("HelloTests");

    // invoke HelloTests with SuperTest
    await supertest(server)
      .post("/")
      .send({ some: "payload" })
      .set("Content-Type", "application/json")
      .expect("Hello, World!")
      .expect(200);
  });
});
```