#!/bin/bash

commit_sha="${GITHUB_SHA}"
# GITHUB_SHA is not the commit SHA for pull requests.
if [ "$GITHUB_EVENT_NAME" == "pull_request" ]; then
    commit_sha=$(cat $GITHUB_EVENT_PATH | jq -r .pull_request.head.sha)
fi
sed -i "s/functions-framework-nodejs/functions-framework-nodejs#$commit_sha/" package.json
