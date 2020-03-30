#!/bin/bash

cron_cmd1="(echo 'L1 Check Main Game Server Status'; cd /var/www/l1/game-server/pro/game-server-compiled/; /bin/bash ./bash/check-main-server-status.bash)"
cron_job1="* * * * * $cron_cmd1"
crontab -l | { cat; echo "$cron_job1"; } | crontab - 

cron_cmd2="(echo 'L1 Game Server Pull code script execution'; cd /var/www/l1/game-server/pro/game-server-compiled/; git pull; npm install;)"
cron_job2="* * * * * $cron_cmd2"
crontab -l | { cat; echo "$cron_job2"; } | crontab - 
