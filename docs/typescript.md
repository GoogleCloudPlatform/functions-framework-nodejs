# Typescript

This guide is an example of how to develop a function in Typescript with
the Functions Framework.

1. Create a new Node.js project using the npm CLI.

   ```sh
   mkdir typescript-function && cd typescript-function
   npm init -y
   ```

1. Install the required packages:

   ```sh
   npm install @google-cloud/functions-framework
   npm install --save-dev typescript
   ```

1. Create a `tsconfig.json` in the root directory of your project with the following contents:

   ```json
   {
     "compilerOptions": {
       "target": "es2016",
       "module": "commonjs",
       "esModuleInterop": true,
       "strict": true,
       "outDir": "dist"
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules"]
   }
   ```

1. Update your `package.json` with scripts for building and running your application:

   ```json
   {
     "main": "dist/index.js",
     "scripts": {
       "build": "tsc",
       "start": "functions-framework --target=TypescriptFunction",
       "prestart": "npm run build",
       "gcp-build": "npm run build"
     },
     ...
   }
   ```

   - The `main` field must be configured to the compiled source code file that contains your function source.
   - The [`gcp-build` script](https://cloud.google.com/functions/docs/writing/specifying-dependencies-nodejs#executing_custom_build_steps_during_deployment) is run when deploying your application Google Cloud Functions. It allows you to configure build steps that depend on `devDependencies`.

1. Create a `.gitignore` that ensures your `node_modules` and compiled code are not checked into source control and are not uploaded when you deploy to Google Cloud Functions.

   ```
   node_modules/
   dist/
   ```

1. Create a `src/index.ts` file with your function source code.

   **Example Typescript HTTP Function**

   ```typescript
   import * as ff from '@google-cloud/functions-framework';

   ff.http('TypescriptFunction', (req: ff.Request, res: ff.Response) => {
     res.send('OK');
   });
   ```

   **Example Typescript CloudEvent Function**

   The `cloudEvent` function registration method accepts a template type that can be used to
   annotate the event payload type you expect.

   ```typescript
   import * as ff from '@google-cloud/functions-framework';

   interface PubSubData {
     subscription: string;
     message: {
       messageId: string;
       publishTime: string;
       data: string;
       attributes?: {[key: string]: string};
     };
   }

   ff.cloudEvent<PubSubData>('TypescriptFunction', ce => {
     console.log(ce.data?.message.messageId);
   });
   ```

## Deploying with the gcloud CLI

If you correctly configured the `main` field and `gcp-build` script in your `package.json` you can deploy to Google Cloud Functions as you would any other Javascript function:

```sh
gcloud functions deploy TypescriptFunction \
--runtime nodejs16 \
--trigger-http
```
