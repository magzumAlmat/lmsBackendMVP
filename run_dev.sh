#!/bin/bash
export PATH="/root/.nvm/versions/node/v22.23.5/bin:$PATH"
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd /root/projects/lmsBackendMVP
exec npm run dev
