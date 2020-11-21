#!/bin/bash

commit_sha="$(git rev-parse HEAD)"
sed -i "s/functions-framework-nodejs/functions-framework-nodejs#$commit_sha/" package.json
