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
        "sudo npm install --prefix ./src && pm2 startOrRestart ecosystem.config.js && pm2 save",
      ssh_options: ["StrictHostKeyChecking=no", "PasswordAuthentication=no"]
    }
  }
};
