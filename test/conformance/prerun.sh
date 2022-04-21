# prerun.sh sets up the test function to use the functions framework commit
# specified by generating a `package.json`. This makes the function `pack` buildable
# with GCF buildpacks.
#
# `pack` command example:
# pack build test-fast --builder us.gcr.io/fn-img/buildpacks/nodejs16/builder:nodejs16_20220320_16_13_2_RC00 --env GOOGLE_RUNTIME=nodejs16 --env GOOGLE_FUNCTION_TARGET=writeHttpDeclarativ
set -e

SCRIPT_DIR=$(dirname $0)
REPO_ROOT=$SCRIPT_DIR/../..

cd $REPO_ROOT

npm install gts
npm version 0.0.0 --allow-same-version --no-git-tag-version # fake a deterministic version for testing
npm pack --pack-destination $SCRIPT_DIR

cd $SCRIPT_DIR

npm install google-cloud-functions-framework-0.0.0.tgz
cat package.json