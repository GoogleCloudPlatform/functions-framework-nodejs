# Run a Function in a Docker Container

To run your function in a container, create a `Dockerfile` with the following contents:

```Dockerfile
# Use the official Node.js 10 image.
# https://hub.docker.com/_/node
FROM node:10
# Create and change to the app directory.
WORKDIR /usr/src/app
# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package.json package*.json ./
# Install production dependencies.
RUN npm install --only=production
# Copy local code to the container image.
COPY . .
# Run the web service on container startup.
CMD [ "npm", "start" ]
```

Start the container locally by running `docker build` and `docker run`:

```sh
docker build -t helloworld . && docker run --rm -p 8080:8080 helloworld
```

Send requests to this function using `curl` from another terminal window:

```sh
curl localhost:8080
# Output: Hello, World
```

## Configure gcloud

To use Docker with gcloud, [configure the Docker credential helper](https://cloud.google.com/container-registry/docs/advanced-authentication):

```sh
gcloud auth configure-docker
```

## Deploy a Container

You can deploy your containerized function to Cloud Run by following the [Cloud Run quickstart](https://cloud.google.com/run/docs/quickstarts/build-and-deploy).

Use the `docker` and `gcloud` CLIs to build and deploy a container to Cloud Run, replacing the project id `$GOOGLE_CLOUD_PROJECT` and image name `helloworld`:

```sh
docker build -t gcr.io/$GOOGLE_CLOUD_PROJECT/helloworld .
docker push gcr.io/$GOOGLE_CLOUD_PROJECT/helloworld
gcloud run deploy helloworld --image gcr.io/$GOOGLE_CLOUD_PROJECT/helloworld --region us-central1
```

If you want even more control over the environment, you can [deploy your container image to Cloud Run on GKE](https://cloud.google.com/run/docs/quickstarts/prebuilt-deploy-gke). With Cloud Run on GKE, you can run your function on a GKE cluster, which gives you additional control over the environment (including use of GPU-based instances, longer timeouts and more).
