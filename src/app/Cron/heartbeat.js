const CronJob = require("cron").CronJob;
const Logger = require("./../web/logger");

const run = (io) => {
  const job = new CronJob(
    "0/15 * * * * *",
    () => proceed(io).catch(Logger.logError),
    () => {
      Logger.logError("Heartbeat unexpectedly stopped because the calculated time of the next interval was negative.");
      job.start();
    },
    true
  );
};

const proceed = async (io) => {
  io.sendAllUser({
    heartbeat: "ping",
  });
};

module.exports = run;
