let Baccarat_TmpCuoc = require("../../Models/Baccarat/baccarat-tmpcuoc");
let UserInfo = require("../../Models/UserInfo");
let Chance = require("chance");
const chance = new Chance();

const Helpers = require("../../Helpers/Helpers");
const logger = require("./../../web/logger");
const ConfigHelper = require("./../../Helpers/ConfigHelper");
const constants = require("./constant").constants;
const appConstants = require("./../../appConstants");
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
let totalBotTickets = 0;
let totalSmallBotTickets = 0;

const reset = (gameData) => {
  configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.Baccarat);

  try {
    if (configs.botenabled) {
      const botRatio = ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.Baccarat);

      UserInfo.countDocuments({ type: true }, (err, botCount) => {
        if (err) {
          logger.logError(err);

          return;
        }

        maxNumberOfBots = Math.floor(botCount * botRatio);
        console.log(`Baccarat bot: reset --- ${maxNumberOfBots}`);
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
    } else {
      removeAllBots(gameData);
    }
    resetAllBotData();
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

const run = (gameData) => {
  try {
    if (!!configs && configs.botenabled && gameData.remainingTime > constants.lockBet) {
      console.log(`run - time ${gameData.remainingTime}`);

      let activeBots = Object.keys(botsInRoom);
      let random = (Math.random() * 5) >> 0;

      if ((activeBots.length <= 20 || random == 3) && activeBots.length <= maxNumberOfBots) {
        //bot in
        botIn(gameData);
      }

      if (activeBots.length > 20 && random == 4) {
        //bot out
        botOut(activeBots, gameData);
      }

      const maxTickets = Math.floor(activeBots.length / gameData.remainingTime) + 5;
      const maxBotsToBet = Math.floor(Math.random() * maxTickets + 5);

      let botsToBet = Object.values(botsInRoom).filter((t) => {
        return t.totalBet < configs.bot_maxbet && t.remainTickets > 0;
      });

      botsToBet = Helpers.shuffle(botsToBet);

      console.log(`activeBots ${activeBots.length} - time ${gameData.remainingTime}`);

      for (let i = 0; i < maxBotsToBet; i++) {
        let bot = botsToBet[i];

        if (!!bot) {
          botPlaceBet(bot, gameData);
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};

const botIn = function (gameData) {
  const maxBotRandom = maxNumberOfBots / gameData.remainingTime;
  const length = Math.floor(Math.random() * maxBotRandom + 1);

  UserInfo.find({ type: true, inRoom: false, disabled: false }, "-_id id name red avatarId type")
    .then((botUsers) => {
      let botList = Helpers.shuffle(botUsers);
      botList = botList.slice(0, length);

      for (let i = 0; i < botList.length; i++) {
        let bot = botList[i];

        if (!!bot) {
          UserInfo.updateOne({ id: bot.id }, { inRoom: true }).catch((error) => {
            logger.logError(error);
          });

          botsInRoom[bot.id] = bot;
          resetBot(botsInRoom[bot.id]);
        }

        if (!players[bot.id]) {
          Object.values(gameData.realPlayers).forEach(function (user) {
            user.red({ baccarat: { player: { id: bot.id, name: bot.name, red: bot.red, avatarId: bot.avatarId, type: bot.type } } });
          });
        }

        players[bot.id] = bot;
      }
    })
    .catch((err) => {
      logger.log(err);
    });
};

const botOut = function (activeBots, gameData) {
  let maxBotRemoveRandom = activeBots.length / gameData.remainingTime;

  if (maxBotRemoveRandom < 4) {
    maxBotRemoveRandom = 4;
  }

  const length = (Math.random() * maxBotRemoveRandom) >> 0;
  const botsToRemove = Helpers.shuffle(activeBots);

  for (let i = 0; i < length; i++) {
    const playerId = botsToRemove[i];

    removeBot(playerId, gameData);

    delete botsInRoom[playerId];
    delete gameData.players[playerId];
  }
};

const removeBot = function (botId, gameData) {
  // console.log("remove bot " + botId);
  UserInfo.updateOne({ id: botId }, { inRoom: false }).catch((error) => {
    logger.logError(error);
  });

  Object.values(gameData.realPlayers).forEach(function (user) {
    user.red({ baccarat: { outgame: { playerId: botId } } });
  });
};

const botPlaceBet = function (bot, gameData) {
  const choice = getBetChoice(bot);
  const isSmallTicket = totalBotTickets == 0 ? Math.floor(Math.random() * 2) : (totalSmallBotTickets * 100) / totalBotTickets < 70;
  const maxBet = getMaxBet(isSmallTicket, choice, bot);
  const minBet = getMinBet();

  const betAmount = generateBetAmount(minBet, maxBet);

  console.log("botPlaceBet bot " + bot.name + " bet " + betAmount + " maxBet " + maxBet);

  if (gameData.remainingTime > constants.lockBet) {
    Baccarat_TmpCuoc.findOne({ uid: bot.id, phien: gameData.roundId, red: true })
      .then((currentBet) => {
        let currentTotalBet = 0;
        if (!!currentBet) {
          choices.forEach((choice) => {
            currentTotalBet += currentBet[choice];
          });
        }

        if (!currentBet || currentTotalBet + betAmount <= maxBet) {
          UserInfo.findOne({ id: bot.id }, "red")
            .then((user) => {
              if (user && user.red > betAmount) {
                user.red -= betAmount;
                user.save();

                if (currentBet) {
                  currentBet[choice] += betAmount;
                  currentBet.save();
                } else {
                  upsertBet(bot, gameData.roundId, choice, betAmount);
                }

                gameData.totalBets[choice] += betAmount;

                sendBetInfo(gameData, bot.id, choice, betAmount, user.red);
                updateBotAndStatistic(bot.id, betAmount, choice, user.red, isSmallTicket);
              }
            })
            .catch((err) => {
              logger.logError(err);
            });
        }
      })
      .catch((err) => {
        logger.logError(err);
      });
  }
};

const getBetChoice = function (bot) {
  const totalBotBet = getTotalBetAmount();
  const betChoiceConditions = [
    {
      group: PlayerBankerChoices,
      condition: totalBotBet == 0 ? true : (getPlayerBankerBetAmount() * 100) / totalBotBet < choiceGroupRatio.PlayerBanker,
    },
    {
      group: BigSmallChoices,
      condition: (getBigSmallBetAmount() * 100) / totalBotBet < choiceGroupRatio.BigSmall,
    },
    {
      group: TieChoice,
      condition: (getTieBetAmount() * 100) / totalBotBet < choiceGroupRatio.Tie,
    },
    {
      group: PlayerBankerPairChoices,
      condition: (getPlayerBankerPairBetAmount() * 100) / totalBotBet < choiceGroupRatio.PlayerBankerPair,
    },
  ];

  const underRatioGroups = betChoiceConditions.filter((data) => data.condition);

  if (underRatioGroups.length > 0) {
    const group = underRatioGroups[0].group;
    return group[chance.integer({ min: 0, max: group.length - 1 })];
  }

  return PlayerBankerChoices[chance.integer({ min: 0, max: PlayerBankerChoices.length - 1 })];
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

const generateBetAmount = (minBet, maxBet) => {
  let betAmount = Helpers.getRandomNumberStep5(minBet, maxBet, true);
  const betChips = Helpers.getRandomChips(betAmount);

  const chipIndex = betChips.filter((chip) => {
    chip > 0;
  })[0];

  return appConstants.chipList[chipIndex];
};

const upsertBet = (bot, roundId, choice, betAmount) => {
  let create = { uid: bot.id, name: bot.name, phien: roundId, red: true, time: new Date() };
  let update = {};
  update[choice] = betAmount;

  Baccarat_TmpCuoc.updateOne(
    { uid: bot.id, phien: roundId, red: true },
    { $inc: update, $setOnInsert: create },
    { upsert: true, setDefaultsOnInsert: true },
    function (err, doc) {
      if (err) {
        logger.logError(err);
      }
    }
  );
};

const sendBetInfo = (gameData, botId, choice, betAmount, red) => {
  try {
    Object.values(gameData.realPlayers).forEach(function (realPlayer) {
      realPlayer.red({
        baccarat: {
          playerChip: {
            playerId: botId,
            box: choice,
            bet: betAmount,
            red: red,
          },
        },
      });
    });
  } catch (err) {
    console.log(err);
  }
};

const resetAllBotData = function () {
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

const updateBotAndStatistic = (botId, betAmount, choice, red, isSmallTicket) => {
  updateBotData(botId, betAmount, choice);

  if (players[botId]) {
    players[botId].red = red;
  }

  if (isSmallTicket) {
    totalSmallBotTickets += 1;
  }

  totalBotTickets += 1;

  amountOnChoices[choice] += betAmount;
};

const getTotalBetAmount = function () {
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

const getPlayerBankerPairBetAmount = () => {
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
  reset: reset,
  run: run,
  updateBotBalance: updateBotBalance,
};
