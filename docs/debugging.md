## Debugging Functions

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
node --inspect node_modules/.bin/functions-framework --target=helloWorld
...
Debugger listening on ws://127.0.0.1:9229/5f57f5e9-ea4b-43ce-be1d-6e9b838ade4a
For help see https://nodejs.org/en/docs/inspector
Serving function...
Function: helloWorld
URL: http://localhost:8080/
```

> Note that the [symlinked executable](https://docs.npmjs.com/cli/v8/configuring-npm/folders#executables) of the function framework in  node_modules/**.bin**/functions-framework is used to direct the debugger to the necessary entrypoint.

You can now use an IDE or other tooling to add breakpoints, step through your code and debug your function.
