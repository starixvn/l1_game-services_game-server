let TXTurboCuoc = require("../../Models/TXTurbo/TXTurbo_cuoc");
let TXTurboCuocOne = require("../../Models/TXTurbo/TXTurbo_one");
let UserInfo = require("../../Models/UserInfo");
let Chance = require("chance");

const Helper = require("../../Helpers/Helpers");
const ConfigHelper = require("../../Helpers/ConfigHelper");
const chance = new Chance();
const logger = require("../../web/logger");

let botList = [];
let configs = null;

let totalBotTickets = 0;
let totalSmallBotTickets = 0;

const ratioOfSmallTicket = 70;
const smallTicketScale = 50;

const BalancingBetTime = 10;
const LockBetTime = 5;
const BalancingRatio = 80;

let resetBots = function () {
  configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.TXTurbo);

  if (!!configs && configs.botenabled) {
    try {
      UserInfo.find({ type: true, disabled: false }, "id name", function (err, list) {
        if (list.length) {
          Promise.all(
            list.map(function (user) {
              user = user._doc;
              delete user._id;
              return user;
            })
          ).then((result) => {
            const maxBot = Math.floor(result.length * ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.TXTurbo));

            botList = Helper.shuffle(result);
            botList = botList.slice(0, maxBot);
          });
        }
      });
    } catch (error) {
      botList = [];
      logger.logError(error);
    }
  } else {
    botList = [];
  }
};

let botPlacesBets = function (io) {
  let maxBet = 10;
  let minBet = 1;
  if (!!configs) {
    if (!!configs.bot_maxbet && configs.bot_maxbet > 0) {
      maxBet = configs.bot_maxbet;
    }
    if (configs.minbet > 0) {
      minBet = configs.minbet;
    }
  }

  if (!!botList.length && io.TXTurbo_time > LockBetTime) {
    const maxBotRandom = botList.length / io.TXTurbo_time;
    const maxTickets = chance.integer({ min: (maxBotRandom * 2) / 3, max: maxBotRandom });
    let choices = [];

    if (io.TXTurbo_time < BalancingBetTime) {
      choices = generateBetChoices(maxTickets, io);
    }

    getBotsAndPlaceBet(io, maxBet, minBet, maxTickets, choices);
  }
};

const generateBetChoices = (maxTickets, io) => {
  let choices = [];
  const select = io.taixiu_turbo.taixiu.red_tai < io.taixiu_turbo.taixiu.red_xiu;
  const ticketsForSmallestChoice = (maxTickets * BalancingRatio) / 100;

  for (let index = 0; index < ticketsForSmallestChoice; index++) {
    choices.push(select);
  }

  for (let index = ticketsForSmallestChoice; index < maxTickets; index++) {
    choices.push(!select);
  }

  choices = Helper.shuffle(choices);

  return choices;
};

const getBotsAndPlaceBet = (io, maxBet, minBet, maxTickets, choices) => {
  let removals = [];

  for (let index = 0; index < maxTickets; index++) {
    let dataT = botList[index];
    if (!!dataT) {
      const select = choices.length > 0 ? choices[index] : chance.bool();
      placeBet(dataT, io, maxBet, minBet, select);
      removals.push(index);
    }
    dataT = null;
  }

  removals.forEach((index) => {
    botList.splice(index, 1);
  });
};

let placeBet = function (bot, io, maxBet, minBet, select) {
  const isSmallTicket = totalBotTickets == 0 ? true : (totalSmallBotTickets * 100) / totalBotTickets < ratioOfSmallTicket;

  if (isSmallTicket) {
    const maxBetOfSmallTicket = Math.min(minBet * smallTicketScale, maxBet * 0.3);
    maxBet = Math.min(maxBetOfSmallTicket, maxBet);
  }

  const betAmount = Helper.getRandomNumberStep5(minBet, maxBet, false);

  if (io.TXTurbo_time > LockBetTime) {
    // console.log(`TX Turbo bot ${bot.name} bet ${betAmount} for choice ${select}`);

    if (select) {
      io.taixiu_turbo.taixiu.red_tai += betAmount;
      io.taixiu_turbo.taixiu.red_player_tai += 1;
    } else {
      io.taixiu_turbo.taixiu.red_xiu += betAmount;
      io.taixiu_turbo.taixiu.red_player_xiu += 1;
    }

    TXTurboCuoc.create({
      uid: bot.id,
      name: bot.name,
      phien: io.TXTurbo_phien,
      bet: betAmount,
      taixiu: true,
      select: select,
      red: true,
      time: new Date(),
    });

    var update = { bet: betAmount };

    let create = { uid: bot.id, phien: io.TXTurbo_phien, red: true, taixiu: true, select: select, time: new Date() };

    TXTurboCuocOne.updateOne(
      { uid: bot.id, phien: io.TXTurbo_phien, red: true },
      { $inc: update, $setOnInsert: create },
      { upsert: true, setDefaultsOnInsert: true },
      function (err, doc) {
        if (err) {
          logger.logError(err);
          console.log(err);
        }
      }
    );

    totalBotTickets++;

    if (isSmallTicket) {
      totalSmallBotTickets++;
    }
  }
};

module.exports = {
  botPlacesBets: botPlacesBets,
  resetBots: resetBots,
};
