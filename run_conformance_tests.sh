#!/bin/bash
# Runs the conformance tests locally from https://github.com/GoogleCloudPlatform/functions-framework-conformance
#
# Servers may fail to shutdown between tests on error, leaving port 8080 bound.
# You can see what's running on port 8080 by running `lsof -i :8080`. You can
# run `kill -9 <PID>` to terminate a process.
#
# USAGE:
# ./run_conformance_tests.sh [client_version]
#
# client_version (optional):
# The version of the conformance tests client to use, formatted as "vX.X.X".
# Defaults to the latest version of the repo, which may be ahead of the
# latest release.

CLIENT_VERSION=$1
if [ $CLIENT_VERSION ]; then
    CLIENT_VERSION="@$CLIENT_VERSION"
else
    echo "Defaulting to latest client."
    echo "Use './run_conformance_tests vX.X.X' to specify a specific release version."
    CLIENT_VERSION="@latest"
fi

function print_header() {
    echo
    echo "========== $1 =========="
}

# Fail if any command fails
set -e

# Navigate to the conformance tests and install the local FF.
cd test/conformance;
npm i;

print_header "INSTALLING CLIENT$CLIENT_VERSION"
echo "Note: only works with Go 1.16+ by default, see run_conformance_tests.sh for more information."
# Go install @version only works on go 1.16+, if using a lower Go version
# replace command with:
# go get github.com/GoogleCloudPlatform/functions-framework-conformance/client$CLIENT_VERSION && go install github.com/GoogleCloudPlatform/functions-framework-conformance/client
go install github.com/GoogleCloudPlatform/functions-framework-conformance/client$CLIENT_VERSION
echo "Done installing client$CLIENT_VERSION"

print_header "HTTP CONFORMANCE TESTS"
client -buildpacks=false -type=http -cmd='npm start -- --target=writeHttp --signature-type=http' -start-delay 5 -validate-mapping=true

print_header "BACKGROUND EVENT CONFORMANCE TESTS"
client -buildpacks=false -type=legacyevent -cmd='npm start -- --target=writeLegacyEvent --signature-type=event' -start-delay 5 -validate-mapping=true

print_header "CLOUDEVENT CONFORMANCE TESTS"
client -buildpacks=false -type=cloudevent -cmd='npm start -- --target=writeCloudEvent --signature-type=cloudevent' -start-delay 5 -validate-mapping=true

print_header "DECLARATIVE HTTP CONFORMANCE TESTS"
client -buildpacks=false -cmd='npm start -- --target=writeHttpDeclarative' -start-delay 5 -validate-mapping=true

print_header "DECLARATIVE CLOUDEVENT CONFORMANCE TESTS"
client -buildpacks=false -type=cloudevent -cmd='npm start -- --target=writeCloudEventDeclarative' -start-delay 5 -validate-mapping=true
