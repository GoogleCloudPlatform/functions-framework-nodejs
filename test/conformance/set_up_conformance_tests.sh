#!/bin/bash

pushd test/conformance
sed -i "s/functions-framework-nodejs/functions-framework-nodejs#$GITHUB_SHA/" package.json
cat package.json
popd
