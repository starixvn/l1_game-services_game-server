const rouletteTmpOne = require("./Models/Roulette_one").RouletteTmpOne;
const UserInfo = require("../../../Models/UserInfo");
const Chance = require("chance");
const chance = new Chance();

const Helpers = require("../../../Helpers/Helpers");
const logger = require("../../../web/logger");
const ConfigHelper = require("../../../Helpers/ConfigHelper");
const constants = require("./constants");
const appConstants = require("../../../appConstants");

const modRoundToChangedTopBot = 6;
const maxSmallTicketScale = 50;
const smallTicketRatio = 70;
const maxBetRatio = 20;
const defaultBotMaxBet = 500;

const uniqueBetChoices = ["big", "small", "even", "odd"];

const betTypeRatio = {
  straightUpSplit: 80,
  others: 20,
};

const BigSmallChoices = ["big", "small"];
const OddEvenChoices = ["even", "odd"];
const RedBlackChoices = ["red", "black"];

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

const availableBetChoices = {
    0: {
      straight: [0],
      split: ["0-1", "0-2", "0-3"],
      triangle: ["0-1-2", "0-2-3"],
      fourNumbers: ["0-1-2-3"]
    },
    1:{
      straight: [1],
      split:  ["0-1", "1-2", "1-4"],
      triangle: ["0-1-2"],
      fourNumbers: ["0-1-2-3"]
    },
    2: ["0-2", "1-2", "2-3"],
    3: ["0-3", "2-3", "3-6"],
    4: ["1-4", "4-5", "4-7"],
    5: ["2-5", "4-5", "5-6", "5-8"],
    6: ["3-6", "5-6", "6-9"],
    7: ["4-7", "7-8", "7-10"],
    8: ["5-8", "7-8", "8-9", "8-11"],
    9: ["6-9", "8-9", "9-12"],
    10: ["7-10", "10-11", "10-13"],
    11: ["8-11", "10-11", "11-12", "11-14"],
    12: ["9-12", "11-12", "12-15"],
};

const minAmount = 200;
const resetAmountOnChoices = {
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
};

let configs = null;
let botsInRoom = [];
let maxNumberOfBots = 0;
let currentBotRatio = 0;
let changedTopBots = false;

let amountOnChoices = { ...resetAmountOnChoices };

let totalBotTickets = 0;
let totalSmallBotTickets = 0;

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

    // console.log( "activeBots " + activeBots.length +" / botsToBet " + botsToBet.length + " round " + round + " remainingTime " + remainingTime);

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

  for (let i = 0; i < length; i++) {
    let bot = botList[i];

    if (!!bot) {
      updateInRoom(bot.id, true);

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

    const maxBet = getMaxBet(box, rouletteData.remainingTime);
    const minBet = getMinBet();
    const betAmount = getBetAmount(minBet, maxBet);

    let currentTotalBet = 0;

    let currentBet = await KenoProMax_tmpcuoc.findOne({
      uid: bot.id,
      phien: rouletteData.roundId,
    }).exec();

    if (!!currentBet) {
      betTypes.forEach((choice) => {
        currentTotalBet += currentBet[choice];
      });
    }

    if (!currentBet || currentTotalBet + betAmount <= maxBet) {
      const userInfo = await UserInfo.findOne({ id: bot.id }, "red").exec();

      if (rouletteData.remainingTime > constants.lockingBetDuration && betAmount > 0 && userInfo && userInfo.red > betAmount) {
        userInfo.red -= betAmount;
        await userInfo.save();

        if (currentBet) {
          currentBet[box] += betAmount;
          await currentBet.save();
        } else {
          const update = {};
          update[box] = betAmount;

          let create = {
            uid: bot.id,
            name: bot.name,
            phien: rouletteData.roundId,
            time: new Date(),
          };

          await KenoProMax_tmpcuoc.updateOne(
            { uid: bot.id, phien: rouletteData.roundId },
            { $inc: update, $setOnInsert: create },
            { upsert: true, setDefaultsOnInsert: true }
          ).exec();
        }

        rouletteData.totalBets[box] += betAmount;
        rouletteData.chips[box][betAmount] += 1;

        amountOnChoices[box] += betAmount;
        totalBotTickets += 1;
        updateBotData(bot.id, betAmount, userInfo.red, box);

        if (rouletteData.players[bot.id]) {
          rouletteData.players[bot.id].red = userInfo.red;
        }

        Object.values(rouletteData.realPlayers).forEach(function (realPlayer) {
          realPlayer.red({
            kenoProMax: {
              playerChip: {
                playerId: bot.id,
                box: box,
                bet: betAmount,
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
  //const isOthers = ((botTotalBet - straightUpAndSplitTotalBet) * 100) / botTotalBet < betTypeRatio.others;

  if (isStraightUpOrSplit) {
     typeChoiceIndex = chance.integer({ min: 0, max: 1 });
    if (typeChoiceIndex == 0) {
      box.straightUp = {
        [randomNumber]: 0,
      };
    } else {
      const splitChoices = availableBetChoices.split[randomNumber];
      box.split = {
        [splitChoices[chance.integer({ min: 0, max: splitChoices.length - 1 })]]: 0,
      };
    }
  } else {
    const keys = Object.keys(availableBetChoices);
    const typeChoice = keys[chance.integer({ min: 2, max: keys.length - 1 })];
    const  s= availableBetChoices[typeChoice];
    box[typeChoice];
  }

  if (!!bot && bot.choices.length > 0 && uniqueBetChoices.includes(box)) {
    const previousUniqueBox = bot.choices.filter((choice) => uniqueBetChoices.includes(choice));

    if (!!previousUniqueBox && previousUniqueBox.length > 0) {
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

const getBigSmallBetAmount = () => {
  let total = 0;
  let bigSmallType = amountOnChoices.bigSmall;

  Object.keys(bigSmallType).forEach((choice) => {
    total += bigSmallType[choice];
  });

  return total;
};

const getOddEvenBetAmount = () => {
  let total = 0;
  let oddEvenType = amountOnChoices.oddEven;

  Object.keys(oddEvenType).forEach((choice) => {
    total += oddEvenType[choice];
  });

  return total;
};

const getMaxBet = function (choice, remainingTime) {
  const minBet = getMinBet();
  const configBotMaxBet = !!configs && configs.bot_maxbet > 0 ? configs.bot_maxbet : defaultBotMaxBet;
  const configMaxBetChoice = uniqueBetChoices.includes(choice)
    ? configs.choices_maxbet[choice]
    : (configs.choices_maxbet[choice] * maxBetRatio) / 100;

  let choiceRatio = betTypeRatio.BigSmall;
  let amountOnGroupChoice = getBigSmallBetAmount();

  if (OddEvenChoices.includes(choice)) {
    choiceRatio = betTypeRatio.OddEven;
    amountOnGroupChoice = getOddEvenBetAmount();
  }

  let remainingBetAmountOnChoice = (getTotalBetAmount() * choiceRatio) / 100 - amountOnGroupChoice;

  remainingBetAmountOnChoice = Math.max(remainingBetAmountOnChoice, minBet);
  const ratio = (remainingTime / constants.placingBetDuration) * 100;
  remainingBetAmountOnChoice = ratio > 50 ? configMaxBetChoice : remainingBetAmountOnChoice * ratio;

  // console.log(`configMaxBetChoice ${configMaxBetChoice} remainingBetAmountOnChoice ${remainingBetAmountOnChoice} configBotMaxBet ${configBotMaxBet}`);

  let maxBet = Math.min(configMaxBetChoice, remainingBetAmountOnChoice, configBotMaxBet);

  if (FiveElementChoices.includes(choice)) {
    maxBet = Math.min(minBet * 10, configBotMaxBet * 0.2, configMaxBetChoice);
  }

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

const resetBotData = function () {
  Object.keys(botsInRoom).forEach(function (id) {
    resetBot(botsInRoom[id]);
  });

  totalBotTickets = 0;
  totalSmallBotTickets = 0;

  amountOnChoices = { ...resetAmountOnChoices };
};

const resetBot = function (bot) {
  if (!!bot) {
    bot.totalBet = 0;
    bot.remainTickets = chance.integer({ min: 1, max: 3 });
    bot.choices = [];
    bot.betOnChoices = { ...resetAmountOnChoices };
  }
};

const updateBalance = function (botId, totalWin) {
  if (!!botsInRoom[botId]) {
    botsInRoom[botId].red += totalWin;
  }
};

const getBetAmount = function (minBet, maxBet) {
  let betAmount = Helpers.getRandomNumberStep5(minBet, maxBet, true);
  const betChips = Helpers.getRandomChips(betAmount);

  for (let index = 0; index < betChips.length; index++) {
    const chip = betChips[index];
    if (chip > 0) {
      betAmount = appConstants.chipList[index];

      break;
    }
  }

  return betAmount;
};

const writeLogAllChoiceAmount = function (players) {
  console.log("---------------------");
  console.log(`Total bot in room: ${Object.keys(botsInRoom).length}`);
  console.log(`Total players in room: ${Object.keys(players).length}`);
  console.log(`Total bot bet amount: ${getTotalBetAmount()}`);
  betTypes.forEach((choice) => {
    console.log(`Total bet on ${choice}: ${amountOnChoices[choice]}. Ratio: ${(amountOnChoices[choice] * 100) / getTotalBetAmount()}`);
  });

  console.log(`Small / Total: ${totalSmallBotTickets} / ${totalBotTickets}`);
};

const updateBotData = function (botId, betAmount, red, box) {
  if (!!botsInRoom[botId]) {
    botsInRoom[botId].totalBet += betAmount;
    botsInRoom[botId].choices.push(box);
    botsInRoom[botId].red = red;
    botsInRoom[botId].remainTickets--;
    botsInRoom[botId].betOnChoices[box] += betAmount;

    //console.log("Bot " + botsInRoom[botId].name + " bet for " + box + " total " + botsInRoom[botId].totalBet);
    // console.log(botsInRoom[botId].betOnChoices);
  }
};

module.exports = {
  reset: reset,
  run: run,
  updateBalance: updateBalance,
};
