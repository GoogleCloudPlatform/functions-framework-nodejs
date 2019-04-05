FROM gcr.io/gae-runtimes/nodejs10_app_builder:nodejs10_20190306_10_15_3_RC00 AS functions-framework

COPY *.js *.json LICENSE /functions-framework/
COPY src /functions-framework/src
COPY test /functions-framework/test
WORKDIR /functions-framework
RUN npm install --only=dev && npm run compile

FROM gcr.io/gcp-runtimes/ubuntu_18_0_4

# TODO: Once functions-framework npm module is published, do not include
# functions-framework files in the image, just reference the published module in
# package.json.
COPY --from=functions-framework \
    /functions-framework/package.json \
    /functions-framework/LICENSE \
    /functions-framework/
COPY --from=functions-framework \
    /functions-framework/build/src/*.js \
    /functions-framework/build/src/*.d.ts \
    /functions-framework/build/src/

# TODO: Once functions-framework files from the parent directory are not needed,
# run docker build and copy files from the current directory.
COPY converter/convert converter/.npmrc /converter/

COPY converter/without-package /converter/without-package
COPY converter/with-package-without-framework /converter/with-package-without-framework
COPY converter/with-package-with-framework /converter/with-package-with-framework

RUN apt-get update >/dev/null && \
    apt-get install -y jq >/dev/null

WORKDIR /workspace

ENTRYPOINT ["/converter/convert"]
