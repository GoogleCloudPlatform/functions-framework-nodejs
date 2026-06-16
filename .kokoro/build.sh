#!/bin/bash
set -euo pipefail

### cd to Git on Borg folder in Kokoro
cd "$KOKORO_ARTIFACTS_DIR/git/serverless/functions-framework-nodejs"

### Configure Airlock
# APT
rm -f /etc/apt/sources.list.d/* /etc/apt/sources.list
echo 'deb https://us-apt.pkg.dev/remote/artifact-foundry-prod/debian-3p-remote-bookworm bookworm main' | \
    tee -a  /etc/apt/sources.list.d/artifact-registry.list

# NPM
cat > .npmrc <<EOF
registry=https://us-npm.pkg.dev/artifact-foundry-prod/npm-3p-trusted/
//us-npm.pkg.dev/artifact-foundry-prod/npm-3p-trusted/:always-auth=true
EOF
cp .npmrc "$HOME/.npmrc"

### Build all package.json
ARTIFACTS="${KOKORO_ARTIFACTS_DIR}/artifacts"
mkdir "${ARTIFACTS}"

readarray -t package_jsons < <(find "." -type d -name "node_modules" -prune -o -name "package.json" -print)
for package_file in "${package_jsons[@]}"; do
  echo "Building package ${package_file}"
  package_dir="$(dirname "${package_file}")"
  pushd "${package_dir}"
  npm ci
  # npm pack and npm publish needs to be distinct steps to ensure the
  # artifacts will be stored locally for attestation generation.
  npm pack --pack-destination="${ARTIFACTS}"
  popd
done

### Authenticate to OSS Exit Gate
# Replace default registry with OSS Exit Gate
cat > .npmrc <<EOF
registry=https://us-npm.pkg.dev/oss-exit-gate-prod/ff-releases--npm/
//us-npm.pkg.dev/oss-exit-gate-prod/ff-releases--npm/:always-auth=true
EOF

cp .npmrc "$HOME/.npmrc"

npx google-artifactregistry-auth

### Publish all packages
echo "Publish package"
for file in "${ARTIFACTS}"/*.tgz; do
  if [[ -e "${file}" ]]; then
    echo "Publishing TGZ: ${file}"
    npm publish "${file}"
  fi
done
