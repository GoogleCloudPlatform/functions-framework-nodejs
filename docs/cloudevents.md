# CloudEvents

This guide shows you how to use the Functions Framework for local testing with:

- CloudEvents
- [CloudEvents Conformance Testing](https://github.com/cloudevents/conformance)

## Local Testing of CloudEvents

In your `package.json`, specify `--signature-type=cloudevent"` for the `functions-framework`:

```sh
{
  "scripts": {
    "start": "functions-framework --target=helloCloudEvents --signature-type=cloudevent"
  }
}
```

Create an `index.js` file:

```js
exports.helloCloudEvents = (cloudevent) => {
  console.log(cloudevent.specversion);
  console.log(cloudevent.type);
  console.log(cloudevent.source);
  console.log(cloudevent.subject);
  console.log(cloudevent.id);
  console.log(cloudevent.time);
  console.log(cloudevent.datacontenttype);
}
```

Start the Functions Framework:

```sh
npm start
```

Your function will be serving at `http://localhost:8080/`, however,
it is no longer accessible via `HTTP GET` requests from the browser.

### Create and send a cloudevent to the function
```
cloudevents send http://localhost:8080 --specver--id abc-123 --source cloudevents.conformance.tool --type foo.bar
```