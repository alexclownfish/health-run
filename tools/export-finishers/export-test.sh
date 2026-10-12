#!/bin/bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd -- "$script_dir/../.." && pwd)"

if [[ $# -lt 1 || $# -gt 2 ]]; then
  printf '%s\n' '用法：bash tools/export-finishers/export-test.sh 控制台导出的JSON文件 [输出.xlsx]'
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' '未找到 Node.js。请在安装了 Node.js 的终端运行此脚本。' >&2
  exit 1
fi

output_file="${2:-$project_dir/exports/test-finishers-$(date +%Y%m%d-%H%M%S).xlsx}"
exec node "$script_dir/index.js" \
  --config "$project_dir/cloudfunctions/submitCompletion/activity.example.json" \
  --input "$1" --output "$output_file" --include-test --preview
