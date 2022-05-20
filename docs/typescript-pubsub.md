# PubSub Event Function in Typescript

This guide is an example of how to develop a function to receive PubSub messages in Typescript with the Functions Framework.

1. Use [gts](https://github.com/google/gts) to configure Typescript.

    ```sh
    npx gts init
    ```

2. Install the required packages:

    ```sh
    npm install @google-cloud/functions-framework
    npm install @google-cloud/pubsub 
    npm install concurrently nodemon --save-dev
    ```

3. Replace the contents of `src/index.ts` with:

    ```ts
    import {Context, EventFunction} from "@google-cloud/functions-framework/build/src/functions";
    import {PubsubMessage} from "@google-cloud/pubsub/build/src/publisher";

    export const helloPubSub: EventFunction = (message: PubsubMessage, context: Context) => {
      const data = message.data ? Buffer.from(message.data as string, "base64").toString() : "No Message";
      console.log(data);
    };
    ```

4. Compile your Typescript code:

   ```sh
   npm run compile
   ```

   This should compile your `index.ts` to `build/src/index.js`.

## Deploying with gcloud CLI

1. Adjust `main` field in `package.json` to point to the compiled javascript source.

    ```js
      "main": "build/src/index.js",
      ...
    ```

2. Remove `prepare` script in `package.json` created by [gts](https://github.com/google/gts). This is because the `prepare` script requires typescript to be installed and will
   cause the function to fail to deploy if not removed.

3. Create a Pub/Sub topic, where `COOL_TOPIC` is the name of the new topic you are creating:

   ```sh
   gcloud pubsub topics create COOL_TOPIC
   ```

4. Deploy:

    ```sh
    gcloud functions deploy helloPubSub \
    --runtime nodejs16 \
    --trigger-topic COOL_TOPIC
    ```

5. Publish a message to the topic to test your function:

   ```sh
   gcloud pubsub topics publish COOL_TOPIC --message="hello"
   ```

