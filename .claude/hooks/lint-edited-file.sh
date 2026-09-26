#!/usr/bin/env bash
# PostToolUse hook: eslint the file Claude just edited, so lint errors surface
# in the same turn instead of at CI. Exit 2 feeds stderr back to Claude; exit 0
# means clean or not applicable. Never blocks when the toolchain is missing.
set -u

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
file=$(jq -r '.tool_input.file_path // empty')

case "$file" in
  "$project_dir"/*) ;;
  *) exit 0 ;;  # Files outside the repo (plans, memory) aren't ours to lint.
esac
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0

cd "$project_dir" || exit 0
[ -x node_modules/.bin/eslint ] || exit 0  # `npm install` hasn't run yet.

if ! out=$(node_modules/.bin/eslint --no-warn-ignored "$file" 2>&1); then
  echo "eslint found problems in ${file#"$project_dir"/}:" >&2
  echo "$out" >&2
  exit 2
fi
