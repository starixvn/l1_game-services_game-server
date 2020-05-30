let Baccarat_TmpCuoc = require("../../Models/Baccarat/baccarat-tmpcuoc");
let UserInfo = require("../../Models/UserInfo");
let Chance = require("chance");
const chance = new Chance();

const Helpers = require("../../Helpers/Helpers");
const logger = require("./../../web/logger");
const ConfigHelper = require("./../../Helpers/ConfigHelper");
const constants = require("./constant");
const appConstants = require("./../../appConstants");

const modRoundToChangedTopBot = 6;
const choiceGroupRatio = {
  PlayerBanker: 95,
  PlayerBankerPair: 1,
  Tie: 1,
  BigSmall: 3,
};

const resetBotData = {
  player: 0,
  banker: 0,
  big: 0,
  small: 0,
  tie: 0,
  playerpair: 0,
  bankerpair: 0,
};

const choices = ["player", "banker", "big", "small", "tie", "playerpair", "bankerpair"];
const PlayerBankerChoices = ["player", "banker"];
const BigSmallChoices = ["big", "small"];
const PlayerBankerPairChoices = ["playerpair", "bankerpair"];
const TieChoice = ["tie"];

let amountOnChoices = { ...resetBotData };

let configs = null;
let botsInRoom = [];
let maxNumberOfBots = 0;
let currentBotRatio = 0;
let changedTopBots = false;
let totalBotTickets = 0;
let totalSmallBotTickets = 0;

const resetBots = function (gameData) {
  configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.Baccarat);
  try {
    if (configs.botenabled) {
      var botRatio = ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.Baccarat);
      if (currentBotRatio != botRatio) {
        UserInfo.countDocuments({ type: true }, (err, botCount) => {
          if (err) {
            logger.logError(err);

            return;
          }

          maxNumberOfBots = Math.floor(botCount * currentBotRatio);
        });

        UserInfo.find({ type: true, disabled: true })
          .then(function (disabledBots) {
            disabledBots.forEach((bot) => {
              removeBot(bot.id, gameData);
            });
          })
          .catch(function (err) {
            logger.logError(err);
          });
      }

      changedTopBots = false;
    } else {
      removeAllBots(gameData);
    }

    resetBotData();
  } catch (error) {
    console.log(error);
    logger.logError(error);

    removeAllBots(gameData);
  }
};

const removeAllBots = function (gameData) {
  if (!!gameData.players) {
    var bots = Object.values(players).filter(function (player) {
      return player.type;
    });

    bots.forEach((bot) => {
      removeBot(bot.id, gameData);
    });
  }

  botsInRoom = [];
  maxNumberOfBots = 0;
  currentBotRatio = 0;
};

const addBots = function (gameData) {
  try {
    if (!!configs && configs.botenabled && time > constants.settlementDuration) {
      let activeBots = Object.keys(botsInRoom);
      let random = (Math.random() * 5) >> 0;

      if ((activeBots.length <= 20 || random == 3) && activeBots.length <= maxNumberOfBots) {
        //bot in
        botIn(time, players, clients);
      }

      if (activeBots.length > 20 && random == 4) {
        //bot out
        botOut(activeBots, time, phien, players, clients);
      }

      var maxTickets = Math.floor(activeBots.length / time) + 5;
      let userCuoc = Math.floor(Math.random() * maxTickets + 5);

      let botsToBet = Object.values(botsInRoom).filter(function (t) {
        return t.totalBet < configs.bot_maxbet && t.remainTickets > 0;
      });
      botsToBet = Helpers.shuffle(botsToBet);

      // console.log( "activeBots " + activeBots.length +" / botsToBet " + botsToBet.length + " phien " + phien);

      for (let i = 0; i < userCuoc; i++) {
        let bot = botsToBet[i];

        if (!!bot) {
          botPlaceBet(bot, phien, clients, players, data, time);
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};

const botIn = function (gameData) {
  let botsIn = [];
  var maxBotRandom = maxNumberOfBots / time;
  let length = Math.floor(Math.random() * maxBotRandom + 1);

  UserInfo.find({ type: true, inRoom: false }, "-_id id name red avatarId type", function (err, botUsers) {
    if (err) {
      logger.log(err);
    }

    var botList = Helpers.shuffle(botUsers);
    botList = botList.slice(0, length);

    for (let i = 0; i < botList.length; i++) {
      let bot = botList[i];

      if (!!bot) {
        UserInfo.updateOne({ id: bot.id }, { inRoom: true }).catch((error) => {
          logger.logError(error);
        });

        botsInRoom[bot.id] = bot;
        resetBot(botsInRoom[bot.id]);

        botList.splice(i, 1);
        botsIn.push(bot);
      }

      if (!players[bot.id]) {
        Object.values(clients).forEach(function (user) {
          user.red({ baccarat: { player: { id: bot.id, name: bot.name, red: bot.red, avatarId: bot.avatarId, type: bot.type } } });
        });
      }

      players[bot.id] = bot;
    }
  });
};

const botOut = function (activeBots, gameData) {
  let botsOut = [];
  var maxBotRemoveRandom = activeBots.length / time;

  if (maxBotRemoveRandom < 4) {
    maxBotRemoveRandom = 4;
  }

  let length = (Math.random() * maxBotRemoveRandom) >> 0;

  for (let i = 0; i < length; i++) {
    let index = (Math.random() * activeBots.length) >> 0;

    if (!changedTopBots && phien % modRoundToChangedTopBot == 0) {
      // change top of bots
      index = (Math.random() * 8) >> 0;
      changedTopBots = true;
    }

    let playerId = activeBots[index];
    botsOut.push(botsInRoom[playerId]);

    removeBot(playerId, gameData);
    delete botsInRoom[playerId];
  }

  return botsOut;
};

const removeBot = function (botId, gameData) {
  // console.log("remove bot " + botId);
  UserInfo.updateOne({ id: botId }, { inRoom: false }).catch((error) => {
    logger.logError(error);
  });

  Object.values(gameData.realPlayers).forEach(function (user) {
    user.red({ baccarat: { outgame: { playerId: botId } } });
  });

  delete gameData.players[botId];
};

const botPlaceBet = function (bot, gameData) {
  try {
    const choice = getBetChoice(bot);
    const isSmallTicket = totalBotTickets == 0 ? Math.floor(Math.random() * 2) : (totalSmallBotTickets * 100) / totalBotTickets < 70;
    const maxBet = getMaxBet(isSmallTicket, choice, bot);
    const minBet = getMinBet();

    let botBetTotal = maxBet > 0 ? Helpers.getRandomNumberStep5(minBet, maxBet, true) : 0;

    // console.log("botPlaceBet bot " + bot.name + " bet " + botBetTotal + " maxBet " + maxBet);

    if (botBetTotal > 0 && time > constants.settlementDuration) {
      var betChips = Helpers.getRandomChips(botBetTotal);

      for (let index = 0; index < betChips.length; index++) {
        const chip = betChips[index];
        if (chip > 0) {
          botBetTotal = appConstants.chipList[index];

          break;
        }
      }

      Baccarat_TmpCuoc.findOne({ uid: bot.id, phien: phien, red: true }, function (err, currentBet) {
        if (err) {
          logger.logError(err);

          return;
        }

        let currentTotalBet = 0;
        if (!!currentBet) {
          choices.forEach((choice) => {
            currentTotalBet += currentBet[choice];
          });
        }

        try {
          if (!checkOne || currentTotalBet <= maxBet) {
            UserInfo.findOne({ id: bot.id }, "red", function (err, user) {
              if (err) {
                logger.logError(err);

                return;
              }

              try {
                if (botBetTotal > 0 && user && user.red > botBetTotal) {
                  user.red -= botBetTotal;
                  user.save();

                  if (checkOne) {
                    checkOne[choice] += botBetTotal;
                    checkOne.save();
                  } else {
                    var update = {};
                    update[choice] = botBetTotal;

                    let create = { uid: bot.id, name: bot.name, phien: phien, red: true, time: new Date() };

                    Baccarat_TmpCuoc.updateOne(
                      { uid: bot.id, phien: phien, red: true },
                      { $inc: update, $setOnInsert: create },
                      { upsert: true, setDefaultsOnInsert: true },
                      function (err, doc) {
                        if (err) {
                          logger.logError(err);
                        }
                      }
                    );
                  }

                  data.red[choice] += botBetTotal;

                  amountOnChoices[choice] += botBetTotal;

                  if (!!botsInRoom[bot.id]) {
                    updateBotData(bot.id, botBetTotal, choice);
                  }

                  if (players[bot.id]) {
                    players[bot.id].red = user.red;
                  }

                  if (isSmallTicket) {
                    totalSmallBotTickets += 1;
                  }

                  totalBotTickets += 1;
                
                  Object.values(gameData.realPlayers).forEach(function (realPlayer) {
                    realPlayer.red({
                      baccarat: {
                        playerChip: {
                          playerId: bot.id,
                          box: choice,
                          bet: botBetTotal,
                          red: user.red,
                        },
                      },
                    });
                  });
                }
              } catch (err) {
                logger.logError(err);
              }
            });
          }
        } catch (err) {
          logger.logError(err);
        }
      });
    }
  } catch (err) {
    logger.logError(err);
    console.log(err);
  }
};

const getBetChoice = function (bot) {
  let betChoice = 0;

  const totalBotBet = getTotalBetAmount();

  const isPlayerBanker = totalBotBet == 0 ? true : (getPlayerBankerBetAmount() * 100) / totalBotBet < choiceGroupRatio.PlayerBanker;
  const isBigSmall = (getBigSmallBetAmount() * 100) / totalBotBet < choiceGroupRatio.BigSmall;
  const isTie = (getTieBetAmount() * 100) / totalBotBet < choiceGroupRatio.Tie;
  const isPlayerBankerPair = (getPlayerBankerBetAmount() * 100) / totalBotBet < choiceGroupRatio.PlayerBankerPair;

  if (isPlayerBanker) {
    betChoice = chance.integer({ min: 0, max: BigSmallChoices.length - 1 });
    return BigSmallChoices[betChoice];
  }

  if (isBigSmall) {
    betChoice = chance.integer({ min: 0, max: BigSmallChoices.length - 1 });
    return BigSmallChoices[betChoice];
  }

  if (isTie) {
    return TieChoice[0];
  }

  if (isPlayerBankerPair) {
    betChoice = chance.integer({ min: 0, max: PlayerBankerPairChoices.length - 1 });
    return PlayerBankerPairChoices[betChoice];
  }
};

const getMaxBet = function (isSmallTicket, choice, bot) {
  const configMaxBet = Math.min(configs.choices_maxbet[choice], configs.bot_maxbet);
  const minBet = getMinBet();
  const maxBetOfSmallTicket = Math.min(minBet * 50, maxBet);

  return isSmallTicket ? Math.min(minBet, maxBetOfSmallTicket, configMaxBet) : Math.min(minbet, configMaxBet);
};

const getMinBet = function () {
  var defaultMinBet = 1;

  return Math.max(defaultMinBet, configs.minbet);
};

const resetBotData = function () {
  Object.keys(botsInRoom).forEach(function (id) {
    resetBot(botsInRoom[id]);
  });

  totalBotTickets = 0;
  totalSmallBotTickets = 0;
  amountOnChoices = { ...resetBotData };
};

const resetBot = function (bot) {
  if (!!bot) {
    bot.totalBet = 0;
    bot.remainTickets = Math.floor(Math.random() * 3 + 1 + 1);
    bot.choices = [];
    bot.betOnChoices = { ...resetBotData };
  }
};

const updateBotBalance = function (botId, red) {
  if (!!botsInRoom[botId]) {
    botsInRoom[botId].red = red;
  }
};

const getTotalBetAmount = function () {
  let total = 0;

  const total = amountOnChoices.reduce(function (a, b) {
    return a + b;
  });

  return total;
};

const getBigSmallBetAmount = () => {
  let total = 0;

  BigSmallChoices.forEach((choice) => {
    total += amountOnChoices[choice];
  });

  return total;
};

const getPlayerBankerBetAmount = () => {
  let total = 0;

  PlayerBankerChoices.forEach((choice) => {
    total += amountOnChoices[choice];
  });

  return total;
};

const getTieBetAmount = () => {
  let total = 0;

  TieChoice.forEach((choice) => {
    total += amountOnChoices[choice];
  });

  return total;
};

const getPlayerBankerPairAmount = () => {
  let total = 0;

  PlayerBankerChoices.forEach((choice) => {
    total += amountOnChoices[choice];
  });

  return total;
};

const updateBotData = function (botId, betAmount, choice) {
  if (!!botsInRoom[botId]) {
    botsInRoom[botId].totalBet += betAmount;
    botsInRoom[botId].choices.push(choice);
    botsInRoom[botId].remainTickets--;
    botsInRoom[botId].betOnChoices[choice] += betAmount;

    //console.log("Bot " + botsInRoom[botId].name + " bet for " + box + " total " + botsInRoom[botId].totalBet);
    // console.log(botsInRoom[botId].betOnChoices);
  }
};

module.exports = {
  resetBots: resetBots,
  botPlaceBet: botPlaceBet,
  addBots: addBots,
  updateBotBalance: updateBotBalance,
};
