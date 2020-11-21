#!/bin/bash

pushd test/conformance
sed -i "s/functions-framework-nodejs/functions-framework-nodejs#${git rev-parse --short HEAD}/" package.json
popd
