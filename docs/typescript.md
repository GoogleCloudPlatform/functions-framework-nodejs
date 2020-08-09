# Typescript

This guide shows you an example of how to develop a function in Typescript with
the Functions Framework.

1. Use [gts](https://github.com/google/gts) to configure Typescript.

    ```sh
    npx gts init
    ```

2. Install the required package(s):

    ```sh
    npm install @google-cloud/functions-framework
    ```

    In this example we are using an HTTP signature and require express
    types:

    ```sh
    npm install @types/express -D
    ```

3. Add a `start` script to `package.json`, passing in the `--source` flag to
   point to the compiled code directory:

    ```js
      "scripts": {
        "start": "functions-framework --source=build/src/ --target=helloWorld",
        ...
      }
    ```

4. Create a `src/index.ts` file with the following contents:

    ```ts
    import type { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';

    export const helloWorld: HttpFunction = (req, res) => {
      res.send('Hello, World');
    };
    ```

5. Compile and start the built-in local development server:

    ```sh
    $ npm run compile && npm start
    ...
    Serving function...
    Function: helloWorld
    URL: http://localhost:8080/
    ```
