#!/bin/bash

set -e

echo "Install Functions Framework for Node.js"
npm install

echo ""
echo "Install Functions Framework Conformance"
rm -rf functions-framework-conformance
git clone https://github.com/GoogleCloudPlatform/functions-framework-conformance.git
cd ./functions-framework-conformance/client && go build && cd $OLDPWD

run_test() {
  target=$1
  type=$2
  signature_type=${3:-"$type"}

  echo ""
  echo "Running conformance test for $type function"
  ./functions-framework-conformance/client/client \
    -cmd="node build/src/index.js --target $target --signature-type $signature_type --source test/conformance" \
    -type="$type" \
    -validate-mapping=false
}

run_test "writeHttp" "http"
run_test "writeLegacyEvent" "legacyevent" "event"
run_test "writeCloudEvent" "cloudevent"

# Clean up.
rm serverlog_stderr.txt
rm serverlog_stdout.txt
rm function_output.json
rm -rf functions-framework-conformance
