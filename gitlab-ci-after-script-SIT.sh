#!/bin/sh

git fetch

HEADHASH=$(git rev-parse HEAD)
UPSTREAMHASH=$(git rev-parse SIT@{upstream})
if [ "$HEADHASH" != "$UPSTREAMHASH" ]; then
    echo "Pulling";
    git checkout -- .
    git pull;
    echo "Instal npm";
    npm i;
    echo "Restart service";
    sudo chmod -R 777 /var/www/l1;
    sudo systemctl restart l1-game-server-sit.service;
else
    echo "Up-to-date";
fi
