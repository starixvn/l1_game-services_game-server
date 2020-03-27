#!/bin/sh

git fetch

HEADHASH=$(git rev-parse HEAD)
UPSTREAMHASH=$(git rev-parse master@{upstream})
if [ "$HEADHASH" != "$UPSTREAMHASH" ]; then
    echo "Pulling";
    git pull;
    echo "Instal npm";
    npm i;
    echo "Restart service";
    sudo service restart l1-game-server-sit;
else
    echo "Up-to-date";
fi
