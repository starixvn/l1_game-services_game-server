#!/bin/sh

git fetch

HEADHASH=$(git rev-parse HEAD)
UPSTREAMHASH=$(git rev-parse master@{upstream})
if [ "$HEADHASH" != "$UPSTREAMHASH" ]; then
    echo "Pulling";
    git checkout -- .
    git pull;
    echo "Restart service";
    sudo chmod -R 777 /var/www/l2;
    sudo systemctl restart l2-game-server.service;
else
    echo "Up-to-date";
fi
