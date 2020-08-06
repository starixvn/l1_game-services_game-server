const UserInfo = require("../../../Models/UserInfo");
const Chance = require("chance");
const chance = new Chance();
const rouletteChoiceOptions = require("./choice-options");

const Helpers = require("../../../Helpers/Helpers");
const logger = require("../../../web/logger");
const ConfigHelper = require("../../../Helpers/ConfigHelper");
const constants = require("./constants");
const appConstants = require("../../../appConstants");
const { RouletteTmpOne } = require("./Models/Roulette_one");

const modRoundToChangedTopBot = 6;
const maxSmallTicketScale = 50;
const smallTicketRatio = 70;
const maxBetRatio = 20;
const defaultBotMaxBet = 500;

const uniqueBetChoices = ["big", "small", "even", "odd", "red", "black"];
const uniqueBetTypes = ["bigSmall", "redBlack", "oddEven"];

const betTypeRatio = {
  straightUpSplit: 80,
  others: 20,
};

const betTypes = [
  "bigSmall",
  "oddEven",
  "redBlack",
  "straightUp",
  "split",
  "street",
  "triangle",
  "corner",
  "fourNumbers",
  "column",
  "line",
  "dozen",
];

const minAmount = 200;

let configs = null;
let botsInRoom = [];
let maxNumberOfBots = 0;
let currentBotRatio = 0;
let changedTopBots = false;

let totalBotTickets = 0;

const resetAmountOnChoices = () => ({
  bigSmall: {
    big: 0,
    small: 0,
  },
  oddEven: {
    even: 0,
    odd: 0,
  },
  redBlack: {
    red: 0,
    black: 0,
  },
  straightUp: {},
  split: {},
  street: {},
  triangle: {},
  corner: {},
  fourNumbers: {},
  column: {},
  line: {},
  dozen: {},
});

let amountOnChoices = resetAmountOnChoices();

const reset = async (rouletteData) => {
  configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.Roulette);

  if (configs.botenabled) {
    const botRatio = ConfigHelper.getMaxBotForCurrentHour(ConfigHelper.GameTypes.Roulette);

    if (currentBotRatio != botRatio) {
      currentBotRatio = botRatio;

      const botUserCount = await UserInfo.countDocuments({ type: true }).exec();

      maxNumberOfBots = Math.floor(botUserCount * currentBotRatio);
    }

    const disabledBots = await UserInfo.find({ type: true, disabled: true }).lean().exec();

    disabledBots.forEach((bot) => {
      removeBot(bot.id, rouletteData);
    });

    changedTopBots = false;

    console.log(`botsInRoom ${Object.keys(botsInRoom).length} maxNumberOfBots ${maxNumberOfBots}`);
  } else {
    removeAllBotPlayers(rouletteData);
    removeAllBots();
  }

  writeLogAllChoiceAmount(kenoProMaxData.players);
  resetBotData();
};

const removeAllBots = function () {
  botsInRoom = [];
  maxNumberOfBots = 0;
  currentBotRatio = 0;
};

const removeAllBotPlayers = function (rouletteData) {
  const bots = Object.values(rouletteData.players).filter(function (player) {
    return player.type;
  });
  bots.forEach((bot) => {
    removeBot(bot.id, rouletteData);
  });
};

const run = async (rouletteData) => {
  const addBotValue = 3;
  const removeBotValue = 4;
  const minBots = 20;

  if (!!configs && configs.botenabled && rouletteData.remainingTime > constants.lockingBetDuration) {
    let activeBots = Object.keys(botsInRoom);
    let random = chance.integer({ min: 0, max: 5 });

    if ((activeBots.length <= minBots || random == addBotValue) && activeBots.length <= maxNumberOfBots) {
      const remainingOfBots = maxNumberOfBots - activeBots.length;
      if (remainingOfBots > 0) {
        await joinRoom(rouletteData, maxNumberOfBots - activeBots.length);
      }
    }

    if (activeBots.length > minBots && random == removeBotValue) {
      leaveRoom(activeBots, rouletteData);
    }

    const maxTickets = Math.floor(activeBots.length / rouletteData.remainingTime) + 5;
    const numberBotsToBet = chance.integer({ min: 5, max: maxTickets });

    let botsToBet = Object.values(botsInRoom).filter(function (t) {
      return t.totalBet < configs.bot_maxbet && t.remainTickets > 0;
    });

    botsToBet = Helpers.shuffle(botsToBet);

    for (let i = 0; i < numberBotsToBet; i++) {
      let bot = botsToBet[i];

      if (!!bot) {
        await placeBet(bot, rouletteData);
      }
    }
  }
};

const joinRoom = async (rouletteData, remainingBots) => {
  let botsIn = [];
  let maxBotRandom = Math.floor(maxNumberOfBots / rouletteData.remainingTime) + 1;
  maxBotRandom = Math.min(maxBotRandom, remainingBots);
  let length = chance.integer({ min: maxBotRandom * 0.6, max: maxBotRandom });

  const botUsers = await UserInfo.find({ type: true, inRoom: false, disabled: false }, "-_id id name red avatarId type").lean().exec();

  let botList = Helpers.shuffle(botUsers);
  botList = botList.slice(0, length);
  console.log(`joinRoom length ${length}`);

  for (let i = 0; i < length; i++) {
    let bot = botList[i];

    if (!!bot) {
      updateInRoom(bot.id, true);
      console.log(`joinRoom bot ${bot.name} id ${bot.id}`);

      botsInRoom[bot.id] = bot;
      resetBot(botsInRoom[bot.id]);

      botList.splice(i, 1);
      botsIn.push(bot);
    }
  }

  botsIn.forEach((bot) => {
    if (!rouletteData.players[bot.id]) {
      Object.values(rouletteData.realPlayers).forEach((user) => {
        user.red({
          roulette: {
            player: {
              id: bot.id,
              name: bot.name,
              red: bot.red,
              avatarId: bot.avatarId,
              type: bot.type,
            },
          },
        });
      });
    }

    rouletteData.players[bot.id] = bot;
  });
  console.log(`joinRoom ${length} - botsInRoom ${Object.keys(botsInRoom).length}`);
};

const leaveRoom = function (activeBots, rouletteData) {
  let botsOut = [];
  let maxBotRemoveRandom = activeBots.length / rouletteData.remainingTime;

  if (maxBotRemoveRandom < 4) {
    maxBotRemoveRandom = 4;
  }

  const outOfRedBots = Object.values(botsInRoom).filter(function (bot) {
    return bot.red < minAmount;
  });

  let length = chance.integer({ min: 1, max: maxBotRemoveRandom });

  for (let i = 0; i < length; i++) {
    const botToLeave = getBotToLeave(rouletteData.roundId, activeBots, outOfRedBots);

    if (!!botToLeave) {
      botsOut.push(botToLeave);
      delete botsInRoom[botToLeave.id];
    }
  }

  botsOut.forEach((bot) => {
    if (!!bot) {
      removeBot(bot.id, rouletteData);
    }
  });
};

const getBotToLeave = function (roundId, activeBots, outOfRedBots) {
  let botId = "";
  let index = 0;
  if (!changedTopBots && roundId % modRoundToChangedTopBot == 0) {
    changedTopBots = true;
    let max = Math.min(7, activeBots.length - 1);
    index = chance.integer({ min: 0, max: max });
    botId = activeBots[index];

    delete activeBots[index];

    return botsInRoom[botId];
  }

  if (outOfRedBots.length > 0) {
    index = chance.integer({ min: 0, max: outOfRedBots.length - 1 });
    const bot = outOfRedBots[index];
    if (!!bot) {
      delete outOfRedBots[index];
      index = activeBots.indexOf(bot.id);

      if (index > -1) {
        delete activeBots[index];
      }

      return botsInRoom[bot.id];
    }
  }

  index = chance.integer({ min: 0, max: activeBots.length - 1 });
  botId = activeBots[index];

  delete activeBots[index];

  return botsInRoom[botId];
};

const updateInRoom = function (botId, inRoom) {
  UserInfo.updateOne({ id: botId }, { inRoom: inRoom }).catch((error) => {
    logger.logError(error);
  });
};

const removeBot = function (botId, rouletteData) {
  updateInRoom(botId, false);

  delete rouletteData.players[botId];

  Object.values(rouletteData.realPlayers).forEach(function (user) {
    user.red({ kenoProMax: { outgame: { playerId: botId } } });
  });
};

const placeBet = async (bot, rouletteData) => {
  try {
    const randomNumber = chance.integer({ min: 0, max: 36 });
    const box = getBetChoice(bot, randomNumber);

    const botMaxBet = getBotMaxBet(box);
    const betAmount = getBetAmount(box);
    const betTypeChoice = Object.keys(box)[0];
    const betChoice = Object.keys(box[betTypeChoice])[0];

    let currentTotalBet = 0;

    let currentBet = await RouletteTmpOne.findOne({
      uid: bot.id,
      phien: rouletteData.roundId,
    }).exec();

    if (currentBet) {
      betTypes.forEach((betType) => {
        const betTypeObj = currentBet[betType];
        if (betTypeObj) {
          Object.keys(betTypeObj).forEach((choice) => (currentTotalBet += betTypeObj[choice]));
        }
      });
    }

    if (!currentBet || currentTotalBet + betAmount <= botMaxBet) {
      const userInfo = await UserInfo.findOne({ id: bot.id }, "red").exec();

      if (rouletteData.remainingTime > constants.lockingBetDuration && betAmount > 0 && userInfo && userInfo.red > betAmount) {
        userInfo.red -= betAmount;
        await userInfo.save();

        if (currentBet) {
          if (!currentBet[betTypeChoice]) {
            currentBet[betTypeChoice] = {};
          }
          currentBet[betTypeChoice][betChoice] = (currentBet[betTypeChoice][betChoice] || 0) + betAmount;
          await currentBet.save();
        } else {
          const update = {};
          update[betTypeChoice] = {
            [betChoice]: betAmount,
          };

          let create = {
            uid: bot.id,
            name: bot.name,
            phien: rouletteData.roundId,
            time: new Date(),
            [betTypeChoice]: { [betChoice]: betAmount },
          };

          await RouletteTmpOne.updateOne(
            { uid: bot.id, phien: rouletteData.roundId },
            { $setOnInsert: create },
            { upsert: true, setDefaultsOnInsert: true }
          ).exec();
        }
        if (!rouletteData.totalBets[betTypeChoice]) {
          rouletteData.totalBets[betTypeChoice] = {};
        }
        rouletteData.totalBets[betTypeChoice][betChoice] = (rouletteData.totalBets[betTypeChoice][betChoice] || 0) + betAmount;

        amountOnChoices[betTypeChoice][betChoice] = (amountOnChoices[betTypeChoice][betChoice] || 0) + betAmount;
        totalBotTickets += 1;
        updateBotData(bot.id, betAmount, userInfo.red, betTypeChoice, betChoice);

        if (rouletteData.players[bot.id]) {
          rouletteData.players[bot.id].red = userInfo.red;
        }

        Object.values(rouletteData.realPlayers).forEach(function (realPlayer) {
          realPlayer.red({
            roulette: {
              playerChip: {
                playerId: bot.id,
                box: box,
                red: userInfo.red,
              },
            },
          });
        });
      }
    }
  } catch (err) {
    logger.logError(err);
    console.log(err);
  }
};

const getBetChoice = function (bot, randomNumber) {
  let box = {};
  let typeChoiceIndex = 0;

  const botTotalBet = getTotalBetAmount();
  const straightUpAndSplitTotalBet = getStraightUpBetAmount() + getSplitBetAmount();
  const isStraightUpOrSplit = botTotalBet == 0 ? true : (straightUpAndSplitTotalBet * 100) / botTotalBet < betTypeRatio.straightUpSplit;
  const options = rouletteChoiceOptions(randomNumber);
  const betTypes = Object.keys(options).filter((x) => options[x].length > 0);

  if (isStraightUpOrSplit) {
    typeChoiceIndex = chance.integer({ min: 0, max: 1 });
  } else {
    typeChoiceIndex = chance.integer({ min: 2, max: betTypes.length - 1 });
  }

  const selectedBetType = betTypes[typeChoiceIndex];
  const betChoices = options[selectedBetType];
  const selectedChoice = betChoices[chance.integer({ min: 0, max: betChoices.length - 1 })];
  box[selectedBetType] = {
    [selectedChoice]: 0,
  };

  console.log(`Roulette bot ${bot.name} bet ${selectedBetType} ${selectedChoice}`);

  if (!!bot && bot.choices.length > 0 && uniqueBetTypes.some((u) => u === selectedBetType)) {
    const previousUniqueBox = bot.choices.filter((choice) => uniqueBetTypes.includes(Object.keys(choice)[0]));

    if (previousUniqueBox && previousUniqueBox.length > 0) {
      box = previousUniqueBox[0];
    }
  }

  return box;
};

const getTotalBetAmount = function () {
  let total = 0;

  betTypes.forEach((betType) => {
    let betTypeObj = amountOnChoices[betType];
    Object.keys(betTypeObj).forEach((betChoice) => (total += betTypeObj[betChoice]));
  });

  return total;
};

const getStraightUpBetAmount = () => {
  let total = 0;
  let straightUpBetType = amountOnChoices.straightUp;

  Object.keys(straightUpBetType).forEach((choice) => {
    total += straightUpBetType[choice];
  });

  return total;
};

const getSplitBetAmount = () => {
  let total = 0;
  let splitBetType = amountOnChoices.split;

  Object.keys(splitBetType).forEach((choice) => {
    total += splitBetType[choice];
  });

  return total;
};

const getMaxBet = function (box) {
  const betTypeChocie = Object.keys(box)[0];
  const minBet = getMinBet();
  const configBotMaxBet = !!configs && configs.bot_maxbet > 0 ? configs.bot_maxbet : defaultBotMaxBet;
  const configMaxBetType = configs.choices_maxbet[betTypeChocie];

  let typeRaito = betTypeRatio.straightUpSplit;
  let betAmount = getStraightUpBetAmount() + getSplitBetAmount();
  const totalBetAmount = getTotalBetAmount();

  if (betTypeChocie !== "straightUp" && betTypeChocie !== "split") {
    typeRaito = betTypeRatio.others;
    betAmount = totalBetAmount - betAmount;
  }

  let remainingBetAmount = (totalBetAmount * typeRaito) / 100 - betAmount;
  remainingBetAmount = Math.max(remainingBetAmount, minBet);

  let maxBet = Math.min(configMaxBetType, remainingBetAmount, configBotMaxBet);
  const returnMaxBet = Math.max(maxBet, minBet);

  return returnMaxBet;
};

const getMinBet = function () {
  let minBet = 1;

  if (!!configs && configs.minbet > 0) {
    minBet = configs.minbet;
  }

  return minBet;
};

const getBotMaxBet = function () {
  return configs && configs.bot_maxbet > 0 ? configs.bot_maxbet : defaultBotMaxBet;
};

const resetBotData = function () {
  Object.keys(botsInRoom).forEach(function (id) {
    resetBot(botsInRoom[id]);
  });

  totalBotTickets = 0;
  amountOnChoices = resetAmountOnChoices();
};

const resetBot = function (bot) {
  if (!!bot) {
    bot.totalBet = 0;
    bot.remainTickets = chance.integer({ min: 1, max: 2 });
    bot.choices = [];
    bot.betOnChoices = resetAmountOnChoices();
  }
};

const updateBalance = function (botId, totalWin) {
  if (!!botsInRoom[botId]) {
    botsInRoom[botId].red += totalWin;
  }
};

const getBetAmount = function (box) {
  const betTypeChoice = Object.keys(box)[0];
  const configBetTypeOdds = configs.odds[betTypeChoice];
  const configMaxBetType = configs.choices_maxbet[betTypeChoice];
  const configBotMaxBet = getBotMaxBet();
  const minBet = getMinBet();
  const random = Helpers.getRandomAmount(minBet, configBotMaxBet, false);

  return Math.min(Math.round(random / configBetTypeOdds), configMaxBetType);
};

const writeLogAllChoiceAmount = function (players) {
  console.log("---------------------");
  console.log(`Total bot in room: ${Object.keys(botsInRoom).length}`);
  console.log(`Total players in room: ${Object.keys(players).length}`);
  console.log(`Total bot bet amount: ${getTotalBetAmount()}`);
  betTypes.forEach((choice) => {
    console.log(`Total bet on ${choice}: ${amountOnChoices[choice]}. Ratio: ${(amountOnChoices[choice] * 100) / getTotalBetAmount()}`);
  });

  console.log(`Total:/ ${totalBotTickets}`);
};

const updateBotData = function (botId, betAmount, red, betTypeChoice, betChoice) {
  if (!!botsInRoom[botId]) {
    botsInRoom[botId].totalBet += betAmount;
    botsInRoom[botId].choices.push({ [betTypeChoice]: { [betChoice]: 0 } });
    botsInRoom[botId].red = red;
    botsInRoom[botId].remainTickets--;

    const betType = botsInRoom[botId].betOnChoices[betTypeChoice];
    betType[betChoice] = (betType[betChoice] || 0) + betAmount;

    console.log("Bot " + botsInRoom[botId].name + " bet for " + betTypeChoice + " total " + botsInRoom[botId].totalBet);
    console.log(botsInRoom[botId].betOnChoices);
  }
};

module.exports = {
  reset: reset,
  run: run,
  updateBalance: updateBalance,
};
