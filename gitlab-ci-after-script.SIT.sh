UPSTREAM=${1:-'@{u}'}
LOCAL=$(git rev-parse @)
BASE=$(git merge-base @ "$UPSTREAM")

if [ $LOCAL = $BASE ]; then
  echp '====Pull Git===='
  git pull
  echo '====Install NPM===='
  npm i
  echo '====Restart Service===='
  sudo service restart l1-game-server-sit
fi
