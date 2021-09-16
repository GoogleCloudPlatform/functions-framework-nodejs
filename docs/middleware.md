# Middleware

## Express Routing

Underneath it all, Google Cloud Functions written in Node uses the minimalist web framework [Express](https://github.com/expressjs/express) via the [Functions Framework](https://github.com/GoogleCloudPlatform/functions-framework-nodejs).

> In fact, your functions are already using express with the Functions Framework (whether you know it or not), so you aren’t adding an extra dependancy.

This is makes you can writte your Cloud Function in Express style. For example

```js
const express = require("express");

// Create an Express object and routes (in order)
const app = express();
app.use("/users/:id", getUser);
app.use("/users/", getAllUsers);
app.use(getDefault);

// Set our GCF handler to our Express app.
exports.users = app;
```

## Middleware

You can using Express built middleware directly. For example using cors in our app

```js
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

app.get("/products/:id", function (req, res, next) {
  res.json({ msg: "This is CORS-enabled for all origins!" });
});

// Set our GCF handler to our Express app.
exports.products = app;
```

## Custom Middleware

Middleware functions are functions that have access to the express request object (req), the response object (res), and the next function in the application’s request-response cycle. The next function is a function in the Express router which, when invoked, executes the middleware succeeding the current middleware. For example

```js
const express = require("express");
const app = express();

const myLogger = function (req, res, next) {
  console.log("LOGGED");
  next();
};

app.use(myLogger);

app.get("/", function (req, res) {
  res.send("Hello World!");
});

// Set our GCF handler to our Express app.
exports.hello = app;
```
