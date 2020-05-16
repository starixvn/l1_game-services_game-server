var MiniSediePhien = require("./models/MiniSedie_phien");
var MiniSedieUser = require("./models/MiniSedie_user");
const Logger = require("./../../../web/logger");

const getRounds = async (limit) =>
  await MiniSediePhien.find({}, {}, { sort: { _id: -1 }, limit: limit }).exec();

const getLogs = async (client) => {
  const maxNumberOfRounds = 100;
  const roundHistory = await getRounds(maxNumberOfRounds);
  const ownBets = client.redT.miniSedie.ingame[client.profile.name];

  if (!(await MiniSedieUser.findOne({ uid: client.UID }).exec())) {
    MiniSedieUser.create({ uid: client.UID });
  }

  client.red({ miniSedie: { roundHistory, ownBets } });
};

module.exports = (client) => getLogs(client).catch(Logger.logError);
