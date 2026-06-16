#!/bin/bash
set -euo pipefail

cd "${KOKORO_ARTIFACTS_DIR}"

cat > manifest.json <<'EOF'
{
  "publish_all": true
}
EOF
