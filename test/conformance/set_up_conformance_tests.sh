#!/bin/bash

sed -i "s/functions-framework-nodejs/functions-framework-nodejs#$GITHUB_SHA/" package.json
