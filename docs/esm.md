# Using ES Modules

The Functions Framework >= `1.9.0` supports loading your code as an ES Module.

ECMAScript modules (ES modules or ESM) are a TC39 standard, unflagged feature in Node >=14 for loading JavaScript modules. As opposed to CommonJS, ESM provides an asynchronous API for loading modules and provides a very commonly adopted syntax improvement via `import` and `export` statements.

## Example

Before:

```js
exports.helloGET = (req, res) => {
 res.send('No ESM.');
};
```

After:

```js
export const helloGET = (req, res) => {
 res.send('ESM!');
};
```

## Quickstart

Create a `package.json` file:

```json
{
  "type": "module",
  "scripts": {
    "start": "functions-framework --target=helloGET"
  },
  "main": "index.js",
  "dependencies": {
    "@google-cloud/functions-framework": "^1.9.0"
  }
}
```

Create a `index.js` file:

```js
export const helloGET = (req, res) => {
  res.send('ESM!');
};
```

Install dependencies and start the framework:

```sh
npm i
npm start
```

Go to `localhost:8080/` and see your function execute!
