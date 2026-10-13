#!/bin/bash
# After a real `gh pr create`, reminds Claude to work through the PR's review comments.
input=$(cat)
command=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input.command||"")}catch(e){}})')
if ! printf '%s\n' "$command" | grep -Eq '(^|[;&|])[[:space:]]*gh pr create\b'; then
  exit 0
fi
cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"PR opened. Now read its review comments (gh pr view <n> --comments; gh api repos/{owner}/{repo}/pulls/<n>/comments), wait briefly for bots like Sourcery if none yet, verify each against the code or live behavior, fix valid ones on the branch, reply to the rest with why not, resolve the threads, and report which was which."}}
JSON
