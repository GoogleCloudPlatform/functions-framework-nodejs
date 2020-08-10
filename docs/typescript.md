# Typescript

This guide is an example of how to develop a function in Typescript with
the Functions Framework.

1. Use [gts](https://github.com/google/gts) to configure Typescript.

    ```sh
    npx gts init
    ```

2. Install the required packages:

    ```sh
    npm install @google-cloud/functions-framework
    # an HTTP signature requires express types
    npm install @types/express --save-dev
    # https://www.npmjs.com/package/tsc-watch
    npm install tsc-watch --save-dev
    ```

3. Add a `start` script to `package.json`, passing in the `--source` flag to
   point to the compiled code directory (configured by `gts` in this example).
   Also add a `watch` script to use for development:

    ```js
      "scripts": {
        "start": "functions-framework --source=build/src/ --target=helloWorld",
        "watch": "tsc-watch --onSuccess 'npm start'",
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

5. Start the built-in local development server:

    ```sh
    $ npm run watch
    [12:34:56 AM] Starting compilation in watch mode...
    ...
    Serving function...
    Function: helloWorld
    URL: http://localhost:8080/
    ```
