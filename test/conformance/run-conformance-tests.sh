#!/bin/bash

set -e

echo "Install Functions Framework for Node.js"
cd ../.. && npm install && cd $OLDPWD

echo ""
echo "Install Functions Framework Conformance"
rm -rf functions-framework-conformance
git clone https://github.com/GoogleCloudPlatform/functions-framework-conformance.git
# Lock a version of the conformance tool until the tool is stable.
cd functions-framework-conformance && git checkout 53593adc9a4aa887450501b1de16f2d7c619ce42 && cd $OLDPWD
cd functions-framework-conformance/client && go build && cd $OLDPWD

run_test() {
  target=$1
  type=$2
  signature_type=${3:-"$type"}

  echo ""
  echo -e "Running conformance test for $type function"
  ./functions-framework-conformance/client/client \
    -cmd="node ../../build/src/index.js --target $target --signature-type $signature_type" \
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
