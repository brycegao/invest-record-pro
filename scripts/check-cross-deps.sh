#!/bin/bash
set -euo pipefail

echo "=== 检查跨模块依赖 ==="

VIOLATIONS=$(grep -rn "from ['\"]@/features/" src/features/ --include="*.ts" --include="*.vue" 2>/dev/null || true)

if [ -z "$VIOLATIONS" ]; then
  echo "OK: 无违规跨模块依赖"
else
  echo "ERROR: 发现违规跨模块依赖："
  echo "$VIOLATIONS"
  exit 1
fi
