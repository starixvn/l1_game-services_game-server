const moment = require("moment");

const notInBreakTime = () => {
  const time = moment(Date.now());
  const firstEnd = firstRoundEndTime(time);
  const lastEnd = lastRoundEndTime(time);

  const isAfter = time.isAfter(lastEnd);
  const isBefore = time.isBefore(firstEnd);

  return !isAfter && !isBefore;
};

const firstRoundEndTime = (now) => {
  return moment.utc(now).add(-1, "day").hours(23).minutes(10).seconds(0).milliseconds(0);
};

const lastRoundEndTime = (now) => {
  return moment.utc(now).hours(14).minutes(55).seconds(0).milliseconds(0);
};

module.exports = {
  firstRoundEndTime: firstRoundEndTime,
  lastRoundEndTime: lastRoundEndTime,
  notInBreakTime: notInBreakTime,
};
