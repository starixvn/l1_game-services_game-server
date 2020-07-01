const moment = require("moment");

const notInBreakTime = () => {
  const time = moment(Date.now());
  const firstEnd = firstRoundEndTime(time);
  const lastEnd = lastRoundEndTime(time);

  const isAfter = time.isAfter(lastEnd);
  const isBefore = time.isBefore(firstEnd);

  return !isAfter && !isBefore;
};

const convertToGmt7 = (dateTimeUtc) => {
  return moment(dateTimeUtc).add(7, "hours");
}

const firstRoundEndTime = (nowUtc) => {  
  return moment(convertToGmt7(nowUtc)).hours(6).minutes(10).seconds(0).milliseconds(0);
};

const lastRoundEndTime = (nowUtc) => {
  return moment(convertToGmt7(nowUtc)).hours(21).minutes(55).seconds(0).milliseconds(0);
};

module.exports = {
  firstRoundEndTime: firstRoundEndTime,
  lastRoundEndTime: lastRoundEndTime,
  notInBreakTime: notInBreakTime,
};
