#!/bin/sh

git fetch

HEADHASH=$(git rev-parse HEAD)
UPSTREAMHASH=$(git rev-parse UAT@{upstream})
if [ "$HEADHASH" != "$UPSTREAMHASH" ]; then
    echo "Pulling";
    git pull;
    echo "Instal npm";
    npm i;
    echo "Restart service";
    sudo systemctl restart l1-game-server-uat.service;
else
    echo "Up-to-date";
fi
