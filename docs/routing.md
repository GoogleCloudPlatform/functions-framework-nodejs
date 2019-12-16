# Routing

Express Routing can be used with the Functions Framework to easily support subpaths of your function.

> See this blogpost for details:
> https://medium.com/google-cloud/express-routing-with-google-cloud-functions-36fb55885c68

## Tutorial

Write your different route paths:

```js
function getAllUsers(req, res) {
  // TODO: Get users from a database
  res.send(['Alice', 'Bob']);
}

function getUser(req, res) {
  // TODO: Get user details
  res.send({ name: 'Alice', location: 'LAX', });
}

function getDefault(req, res) { res.status(404).send('Bad URL'); }
```

Install Express:

`npm i express`

On the top of the file, create an `express` object that uses Express routing with different subpaths:

```js
const express = require('express');

// Create an Express object and routes (in order)
const app = express();
app.use('/users/:id', getUser);
app.use('/users/', getAllUsers);
app.use(getDefault);

// Set our GCF handler to our Express app.
exports.users = app;
```

Run your function:

```sh
npx @google-cloud/functions-framework --target=users
```

Go to `localhost:8080/users/123` and see Express routing working.