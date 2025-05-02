# Propagate Internal Framework Errors

The Functions Framework normally sends express level errors to the default express error handler which sends the error to the calling client with an optional stack trace if in a non-prod environment.

## Example

```ts
const app = express();

app.post("/", (req, res) => {
...
});

// User error handler
app.use((err, req, res, next) => {
    logger.log(err);
    res.send("Caught error!");
});

functions.http("helloWorld, app);
```

```ts
// Post request with bad JSON
http.post("/", "{"id": "Hello}");
```

Default express error handler:

```
SyntaxError: Expected double-quoted property name in JSON at position 20 (line 3 column 1)
    at JSON.parse (<anonymous>)
    at parse (functions-framework-nodejs/node_modules/body-parser/lib/types/json.js:92:19)
    at functions-framework-nodejs/node_modules/body-parser/lib/read.js:128:18
    at AsyncResource.runInAsyncScope (node:async_hooks:211:14)
    at invokeCallback (functions-framework-nodejs/node_modules/raw-body/index.js:238:16)
    at done (functions-framework-nodejs/node_modules/raw-body/index.js:227:7)
    at IncomingMessage.onEnd (functions-framework-nodejs/node_modules/raw-body/index.js:287:7)
    at IncomingMessage.emit (node:events:518:28)
    at endReadableNT (node:internal/streams/readable:1698:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21)
```

## Propagating Errors

If you want to propgate internal express level errors to your application, enabling the propagate option and defining a custom error handler will allow your application to receive errors:

1. In your `package.json`, specify `--propagate-framework-errors=true"` for the `functions-framework`:

```sh
{
  "scripts": {
    "start": "functions-framework --target=helloWorld --propagate-framework-errors=true"
  }
}
```

2. Define a express error handler:

```ts
const app = express();

// User error handler
app.use((err, req, res, next) => {
    logger.log(err);
    res.send("Caught error!");
});
```

Now your application will receive internal express level errors!

```ts
// Post request with bad JSON
http.post("/", "{"id": "Hello}");
```

The custom error handler logic executes:

```
Caught error!
```