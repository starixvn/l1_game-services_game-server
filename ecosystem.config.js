// Target server hostname or IP address
const TARGET_SERVER_HOST = process.env.TARGET_SERVER_HOST
  ? process.env.TARGET_SERVER_HOST.trim()
  : "";
// Target server username
const TARGET_SERVER_USER = process.env.TARGET_SERVER_USER
  ? process.env.TARGET_SERVER_USER.trim()
  : "";
// Target server application path
const TARGET_SERVER_APP_PATH = `/home/${TARGET_SERVER_USER}/app`;
// Your repository
const REPO = "git@gitlab.luminetsoft.com:r97/server.git";

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: "r97-server",
      script: "src/server.js"
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
        "npm install ./src && pm2 reload ecosystem.config.js && pm2 save",
      ssh_options: ["StrictHostKeyChecking=no", "PasswordAuthentication=no"]
    }
  }
};
