# Functions Framework Docs

This directory contains advanced docs around the Functions Framework.

- TODO: Run Multiple Cloud Functions [#23](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/23)
- TODO: Pub/Sub Trigger [#37](https://github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/37)
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

3. Launch the Functions Framework and attach a debugger:

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
