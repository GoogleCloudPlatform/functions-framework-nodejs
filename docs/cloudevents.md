# CloudEvents

This guide shows you how to use the Functions Framework for local testing with:

- CloudEvents
- [CloudEvents Conformance Testing](https://github.com/cloudevents/conformance)

## Local Testing of CloudEvents

Install `@google-cloud/functions-framework` and list it as a dependency in your `package.json`:

```
npm install @google-cloud/functions-framework
```

Create an `index.js` file and declare your function:

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

Add a `package.json` script to start the Functions Framework and pass the name of your function as the `target`.

```sh
{
  "scripts": {
    "start": "functions-framework --target=helloCloudEvents"
  }
}
```

Start the Functions Framework:

```sh
npm start
```

Your function will be serving at `http://localhost:8080/`, however,
it is no longer accessible via `HTTP GET` requests from the browser.

### Create and Send a CloudEvent to the Function

```
cloudevents send http://localhost:8080 --specver--id abc-123 --source cloudevents.conformance.tool --type foo.bar
```