#!/bin/zsh
cd "${0:A:h}"
if command -v node >/dev/null 2>&1; then
  node scripts/manage.mjs
elif [[ -x /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node ]]; then
  /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node scripts/manage.mjs
else
  print 'Install Node.js 20 or newer from https://nodejs.org, then open this file again.'
  read '?Press Enter to close.'
fi
