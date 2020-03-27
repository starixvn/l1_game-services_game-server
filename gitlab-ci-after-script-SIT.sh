if [ -z "$(git status --porcelain)" ]; 
then
  echo "Nothing Change";
else
  echo '====Pull Git====';
  git pull;
  echo '====Install NPM====';
  npm i;
  echo '====Restart Service====';
  sudo service restart l1-game-server-sit;
fi
