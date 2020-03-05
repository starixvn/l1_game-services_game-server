// Your repository
const REPO = "git@gitlab.com:l110/r97-server.git";

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: "r97-server",
      script: "server.js",
      watch: ["server", "client"],
      watch_delay: 1000,
      ignore_watch: ["node_modules"],
      autorestart: true
    }
  ],
  deploy: {
    production: {
      user: "root",
      host: [{ host: "35.194.253.55", port: "2201" }],
      ref: "origin/master",
      repo: REPO,
      path: "/var/www/r97/server-deploy",
      "post-deploy":
        "sudo npm install --prefix ./ && sudo service r79-server restart",
      ssh_options: ["StrictHostKeyChecking=no", "PasswordAuthentication=no"]
    }
  }
};
