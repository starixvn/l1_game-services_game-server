let KenoProMax_tmpcuoc = require("./../../Models/KenoProMax/KenoProMax_tmpcuoc");
let UserInfo = require("./../../Models/UserInfo");
let Chance = require("chance");
const chance = new Chance();

let Helpers = require("./../../Helpers/Helpers");
let logger = require("./../../web/logger");
let ConfigHelper = require("./../../Helpers/ConfigHelper");
let constants = require("./constants");

const modRoundToChangedTopBot = 6;
const maxSmallTicketScale = 50;
const smallTicketRatio = 80;
const maxBetRatio = 20;
const defaultBotMaxBet = 10;

const uniqueBetChoices = ["big", "small", "even", "odd"];
const mainBetChoices = ["big", "small"];
const betChoiceRatio = {
  big: 44,
  small: 44,
  even: 4,
  odd: 4,
  earth: 1.5,
  fire: 1,
  gold: 0.5,
  water: 0.5,
  wood: 0.5,
};

const choices = [
  "big",
  "small",
  "even",
  "odd",
  "earth",
  "fire",
  "gold",
  "water",
  "wood",
];
const chipList = [500, 200, 100, 50, 10, 5, 1];
const minDelayTime = 3;
const maxDelayTime = 6;
const minAmount = 200;

let configs = null;
let botsInRoom = [];
let maxNumberOfBots = 0;
let currentBotRatio = 0;
let changedTopBots = false;

let amountOnChoices = {
  big: 0,
  small: 0,
  even: 0,
  odd: 0,
  earth: 0,
  fire: 0,
  gold: 0,
  water: 0,
  wood: 0,
};

let totalBotTickets = 0;
let totalSmallBotTickets = 0;
let delayTime = 0;

var reset = async () => {
  configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProMax);

  if (configs.botenabled) {
    var botRatio = ConfigHelper.getMaxBotForCurrentHour(
      ConfigHelper.GameTypes.KenoProMax
    );
    if (currentBotRatio != botRatio) {
      currentBotRatio = botRatio;

      const botUsers = await UserInfo.find(
        { type: true, inRoom: false },
        "id name red avatarId type"
      ).exec();

      maxNumberOfBots = Math.floor(botUsers.length * currentBotRatio);
      delayTime = chance.integer({min: minDelayTime, max: maxDelayTime});
    }

    changedTopBots = false;

    // console.log(`botsInRoom ${Object.keys(botsInRoom).length} maxNumberOfBots ${maxNumberOfBots}`);

  } else {
    removeAllBots();
  }

  writeLogAllChoiceAmount();

  resetBotData();
};

var removeAllBots = function () {
  botsInRoom = [];
  maxNumberOfBots = 0;
  currentBotRatio = 0;
};

var run = async (kenoProMaxData) => {
  const addBotValue = 3;
  const removeBotValue = 4;
  const minBots = 20;

  if (
    !!configs &&
    configs.botenabled &&
    kenoProMaxData.remainingTime < constants.placingBetDuration - delayTime &&
    kenoProMaxData.remainingTime > constants.lockingBetDuration
  ) {
    let activeBots = Object.keys(botsInRoom);
    let random = chance.integer({ min: 0, max: 5 });

    if ((activeBots.length <= minBots || random == addBotValue) &&
      activeBots.length <= maxNumberOfBots
    ) {         
      await joinRoom(kenoProMaxData);
    }

    if (activeBots.length > minBots && random == removeBotValue) {
      leaveRoom(activeBots, kenoProMaxData);
    }

    var maxTickets = Math.floor(activeBots.length / kenoProMaxData.remainingTime) + 5;
    let numberBotsToBet = chance.integer({ min: 5, max: maxTickets });

    let botsToBet = Object.values(botsInRoom).filter(function (t) {
      return t.totalBet < configs.bot_maxbet && t.remainTickets > 0;
    });
    botsToBet = Helpers.shuffle(botsToBet);

    // console.log( "activeBots " + activeBots.length +" / botsToBet " + botsToBet.length + " round " + round + " remainingTime " + remainingTime);

    for (let i = 0; i < numberBotsToBet; i++) {
      let bot = botsToBet[i];

      if (!!bot) {
        await placeBet(bot, kenoProMaxData);
      }
    }
  }
};

var joinRoom = async(kenoProMaxData) => {
  let botsIn = [];
  var maxBotRandom = Math.floor(maxNumberOfBots / kenoProMaxData.remainingTime) + 1;
  let length = chance.integer({ min: maxBotRandom * 0.6, max: maxBotRandom });

  const botUsers = await UserInfo.find(
    { type: true, inRoom: false },
    "id name red avatarId type"
  ).exec();

  var botList = Helpers.shuffle(botUsers);
  botList = botList.slice(0, length);

  // console.log(`joinRoom length ${length}`);

  for (let i = 0; i < length; i++) {
    let bot = botList[i];
    updateInRoom(bot.id, true);

    console.log(`joinRoom bot ${bot.name} id ${bot.id}`);

    if (!!bot) {
      botsInRoom[bot.id] = bot;
      resetBot(botsInRoom[bot.id]);

      botList.splice(i, 1);
      botsIn.push(bot);
    }
  }

  botsIn.forEach((bot) => {
    if (!kenoProMaxData.players[bot.id]) {    
      Object.values(kenoProMaxData.realPlayers).forEach((user) => {
        user.red({
          kenoProMax: {            
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

    kenoProMaxData.players[bot.id] = bot;    
  });

  // console.log(`joinRoom ${length} - botsInRoom ${Object.keys(botsInRoom).length}`);
};

var leaveRoom = function (activeBots, kenoProMaxData) {
  let botsOut = [];
  var maxBotRemoveRandom = activeBots.length / kenoProMaxData.remainingTime;

  if (maxBotRemoveRandom < 4) {
    maxBotRemoveRandom = 4;
  }

  var outOfRedBots = Object.keys(botsInRoom.filter(bot => bot.red < minAmount));

  let length = chance.integer({ min: 1, max: maxBotRemoveRandom });

  for (let i = 0; i < length; i++) {
    var botToLeave = getBotToLeave(length, kenoProMaxData.roundId, activeBots, outOfRedBots) ;

    botsOut.push(botToLeave);

    delete botsInRoom[botToLeave.id];
  }

  botsOut.forEach((bot) => {
    if (!!bot) {        
        updateInRoom(false);

        delete kenoProMaxData.players[bot.id];

        Object.values(kenoProMaxData.realPlayers).forEach(function (user) {
            user.red({ kenoProMax: { outgame: { playerId: bot.id } } });
        });
    }
  });
};

var getBotToLeave = function(totalToRemove, roundId, activeBots, outOfRedBots){
  if (!changedTopBots && roundId % modRoundToChangedTopBot == 0) {
    // change top of bots   
    changedTopBots = true;

    return botsInRoom[activeBots[chance.integer({ min: 0, max: 7 })]];
  }
  
  if(outOfRedBots.length > 0)
  {
    return botsInRoom[outOfRedBots[0]];
  }

  let index = chance.integer({ min: 0, max: totalToRemove - 1 });
  let playerId = activeBots[index];   

  return botsInRoom[playerId];
}

var updateInRoom = function(botId, inRoom){
  UserInfo.updateOne({ id: botId }, { inRoom: inRoom }).catch(
    (error) => {
      logger.logError(error);
    }
  );
}

var placeBet = async (bot, kenoProMaxData) => {
  try {
    const box = getBetChoice(bot);
    const isSmallTicket = totalBotTickets == 0
        ? chance.integer({ min: 0, max: 1 })
        : (totalSmallBotTickets * 100) / totalBotTickets < smallTicketRatio;

    const maxBet = getMaxBet(isSmallTicket, box, kenoProMaxData.remainingTime);
    const minBet = getMinBet();
    const betAmount = getBetAmount(minBet, maxBet);

    // if(!isSmallTicket) 
    // {
    //   console.log(`Not smallTicket - box ${box} maxBet ${maxBet} betAmount ${betAmount} time ${kenoProMaxData.remainingTime}`);
    // }

    var currentTotalBet = 0;

    var currentBet = await KenoProMax_tmpcuoc.findOne({
      uid: bot.id,
      phien: kenoProMaxData.roundId,
      red: true,
    }).exec();

    if (!!currentBet) {
      choices.forEach((choice) => {
        currentTotalBet += currentBet[choice];
      });
    }

    if (!currentBet || currentTotalBet + betAmount <= maxBet) {
      var userInfo = await UserInfo.findOne({ id: bot.id }, "red").exec();

      if (kenoProMaxData.remainingTime > constants.lockingBetDuration && betAmount > 0 && userInfo && userInfo.red > betAmount) {
        userInfo.red -= betAmount;
        await userInfo.save();

        if (currentBet) {
          currentBet[box] += betAmount;
          await currentBet.save();
        } else {
          var update = {};
          update[box] = betAmount;

          let create = {
            uid: bot.id,
            name: bot.name,
            phien: kenoProMaxData.roundId,
            red: true,
            time: new Date(),
          };

          await KenoProMax_tmpcuoc.updateOne(
            { uid: bot.id, phien: kenoProMaxData.roundId, red: true },
            { $inc: update, $setOnInsert: create },
            { upsert: true, setDefaultsOnInsert: true }
          ).exec();
        }

        kenoProMaxData.totalBets[box] += betAmount;
        kenoProMaxData.chips[box][betAmount] += 1;

        amountOnChoices[box] += betAmount;
        totalSmallBotTickets += isSmallTicket ? 1 : 0;
        totalBotTickets += 1;
        updateBotData(bot.id, betAmount, userInfo.red, box);

        if (kenoProMaxData.players[bot.id]) {
          kenoProMaxData.players[bot.id].red = userInfo.red;
        }

        Object.values(kenoProMaxData.realPlayers).forEach(function (realPlayer) {
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
  }
};

var getBetChoice = function (bot) {
  let box;
  let betChoice = 0;

  let totalBotBet = getTotalBetAmount();
  let totalBotBetMain = getTotalOnMainBetChoices();
  let mainChoiceRatio = getMainChoiceRatio();

  let isMain =
    totalBotBet == 0
      ? chance.integer({ min: 0, max: 1 })
      : (totalBotBetMain * 100) / totalBotBet < mainChoiceRatio;

  if (isMain) {
    betChoice = chance.integer({ min: 0, max: mainBetChoices.length - 1 });

    box = mainBetChoices[betChoice];
  } else {
    var subChoices = choices.filter(
      (choice) =>
        amountOnChoices[choice] / totalBotBetMain < betChoiceRatio[choice]
    );
    subChoices = Helpers.shuffle(subChoices);

    if (subChoices.length == 0) {
      subChoices = mainBetChoices;
    }

    betChoice = chance.integer({ min: 0, max: subChoices.length - 1 }); // split from main opts
    box = subChoices[betChoice];
  }

  if (!!bot && bot.choices.length > 0 && uniqueBetChoices.includes(box)) {
    var previousUniqueBox = bot.choices.filter((choice) =>
      uniqueBetChoices.includes(choice)
    );

    if (!!previousUniqueBox && previousUniqueBox.length > 0) {
      box = previousUniqueBox[0];
    }
  }

  return box;
};

var getTotalBetAmount = function () {
  var total = 0;

  choices.forEach((choice) => {
    total += amountOnChoices[choice];
  });

  return total;
};

var getTotalOnMainBetChoices = function () {
  var total = 0;

  mainBetChoices.forEach((choice) => {
    total += amountOnChoices[choice];
  });

  return total;
};

var getMainChoiceRatio = function () {
  var total = 0;

  mainBetChoices.forEach((choice) => {
    total += betChoiceRatio[choice];
  });

  return total;
};

var getMaxBet = function (isSmallTicket, box, remainingTime) {
  const minBet = getMinBet();
  let maxBetOfSmallTicket =
    minBet * maxSmallTicketScale > maxBet
      ? maxBet
      : minBet * maxSmallTicketScale;
  const configBotMaxBet = (!!configs && configs.bot_maxbet > 0 && maxBet > configs.bot_maxbet) ? defaultBotMaxBet : configs.bot_maxbet;

  var remainingBetAmountOnChoice =
    (getTotalBetAmount() * betChoiceRatio[box]) / 100 - amountOnChoices[box];

  remainingBetAmountOnChoice = remainingBetAmountOnChoice > minBet ? remainingBetAmountOnChoice : minBet;
  var ratio = remainingTime / constants.placingBetDuration * 100;

  remainingBetAmountOnChoice = ratio > 50 ? configs.choices_maxbet[box] : remainingBetAmountOnChoice * ratio;

  var maxBet = Math.min(configs.choices_maxbet[box], remainingBetAmountOnChoicem, configBotMaxBet);

  maxBet = (isSmallTicket ? maxBetOfSmallTicket : maxBet);

  if(!uniqueBetChoices.includes(box))
  {
    maxBet = maxBet * maxBetRatio / 100;
  }
  
  var returnMaxBet = Math.max(maxBet, minBet);

  return returnMaxBet;
};

var getMinBet = function () {
  var minBet = 1;

  if (!!configs && configs.minbet > 0) {
    minBet = configs.minbet;
  }

  return minBet;
};

var resetBotData = function () {
  Object.keys(botsInRoom).forEach(function (id) {
    resetBot(botsInRoom[id]);
  });

  totalBotTickets = 0;
  totalSmallBotTickets = 0;

  amountOnChoices = {
    big: 0,
    small: 0,
    even: 0,
    odd: 0,
    earth: 0,
    fire: 0,
    gold: 0,
    water: 0,
    wood: 0,
  };
};

var resetBot = function (bot) {
  if (!!bot) {
    bot.totalBet = 0;
    bot.remainTickets = chance.integer({ min: 1, max: 3 });
    bot.choices = [];
    bot.betOnChoices = {
      big: 0,
      small: 0,
      even: 0,
      odd: 0,
      earth: 0,
      fire: 0,
      gold: 0,
      water: 0,
      wood: 0,
    };
  }
};

var updateBalance = function (botId, totalWin) {
  if (!!botsInRoom[botId]) {
    botsInRoom[botId].red += totalWin;
  }
};

var getBetAmount = function (minBet, maxBet) {
  let betAmount = Helpers.getRandomNumberStep5(minBet, maxBet, true);
  const betChips = Helpers.getRandomChips(betAmount);

  for (let index = 0; index < betChips.length; index++) {
    const chip = betChips[index];
    if (chip > 0) {
      betAmount = chipList[index];

      break;
    }
  }

  return betAmount;
};

var writeLogAllChoiceAmount = function () {
  console.log("---------------------");
  console.log(`Total bot bet amount: ${getTotalBetAmount()}`);
  choices.forEach((choice) => {
    console.log(
      `Total bet on ${choice}: ${amountOnChoices[choice]}. Ratio: ${
      (amountOnChoices[choice] * 100) / getTotalBetAmount()
      }`
    );
  });

  console.log(`Small / Total: ${totalSmallBotTickets} / ${totalBotTickets}`);
};

var updateBotData = function (botId, betAmount, red, box) {
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
  updateBalance: updateBalance
};
