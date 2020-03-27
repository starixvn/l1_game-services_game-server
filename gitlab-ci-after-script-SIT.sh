if [[ `git status --porcelain` ]]; then
  echp '====Pull Git===='
  git pull
  echo '====Install NPM===='
  npm i
  echo '====Restart Service===='
  sudo service restart l1-game-server-sit
fi
