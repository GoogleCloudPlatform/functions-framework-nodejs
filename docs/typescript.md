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
    npm install @types/express concurrently nodemon --save-dev
    ```

3. Add a `start` script to `package.json`, passing in the `--source` flag to
   point to the compiled code directory (configured by `gts` in this example).
   Also add a `watch` script to use for development:

    ```js
      "scripts": {
        "start": "functions-framework --source=build/src/ --target=helloWorld",
        "watch": "concurrently \"tsc -w\" \"nodemon --watch ./build/ --exec npm run start\"",
        ...
      }
    ```

4. Replace the contents of `src/index.ts` with:

    ```ts
    import type { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';

    export const helloWorld: HttpFunction = (req, res) => {
      res.send('Hello, World');
    };
    ```

5. Start the built-in local development server in watch mode:

    ```sh
    npm run watch
    ```

    This will continuously watch changes to your TypeScript project and recompile when changes are detected:

    ```sh
    [12:34:56 AM] Starting compilation in watch mode...
    [12:34:57 AM] Found 0 errors. Watching for file changes.
    ...
    Serving function...
    Function: helloWorld
    URL: http://localhost:8080/
    ```

## Deploying with gcloud CLI

1. Adjust `main` field in `package.json` to point to the compiled javascript source. `gcloud` will inspect the `main` field to detect sources:
    
    ```js
      "main": "build/src/index.js",
      ...
    ```

2. Remove `prepare` script in `package.json` created by [gts](https://github.com/google/gts). Because this script requires typescript to be installed it will fail when deploying.

3. Deploy:

    ```sh
    gcloud functions deploy helloWorld \
    --runtime nodejsXX \ # e.g. nodejs16
    --trigger-http
    ```
