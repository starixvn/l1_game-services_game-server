const BalanceApi = require("./../../../../../apis/balanceApi");
const BetChoiceMapper = require("./../../../../../apis/betChoiceMapper");
const ConfigHelper = require("./../../../../../Helpers/ConfigHelper");
const Logger = require("./../../../../../web/logger");

const NoticeMessages = require("./../../../constants/notice-messages");

const Constants = require("./constants");

const validateBetRequest = (definition, player, { amount, betChoice }) => {
  if (!amount || !betChoice) {
    return false;
  }

  const gameName = definition.name;
  const gameData = player.redT[gameName];
  const configs = ConfigHelper.getConfigs(definition.configName);
  const { betTracks } = gameData.ingame[player.profile.name] || { betTracks: {} };
  const totalAmount = Constants.choices.reduce((total, choice) => total + (betTracks[choice] || 0), 0) + amount;
  const maxBetPerChoice = configs.choices_maxbet[betChoice] || 0;

  const criteria = [
    {
      failure: gameData.remainingTime <= definition.durations.lockingBet || gameData.remainingTime > definition.durations.placingBets,
      notice: NoticeMessages.placeBetNextRound,
    },
    {
      failure: amount > maxBetPerChoice || betTracks[betChoice] + amount > maxBetPerChoice,
      notice: NoticeMessages.maxBetForChoice(maxBetPerChoice),
    },
    {
      failure: amount < configs.minbet,
      notice: NoticeMessages.minBet(configs.minbet),
    },
    {
      failure: amount > configs.maxbet,
      notice: NoticeMessages.maxBet(configs.maxbet),
    },
    {
      failure: totalAmount > configs.maxbet,
      notice: NoticeMessages.maxBet(configs.maxbet),
    },
  ];

  const failedCriterion = criteria.find((criterion) => criterion.failure);

  if (failedCriterion) {
    player.red({ [gameName]: { notice: failedCriterion.notice, endBet: -1 } });

    return false;
  }

  return true;
};

const proceedBet = (definition, player, betChoice, amount) => {
  const gameName = definition.name;

  if (!player.redT || !player.redT[gameName]) {
    return;
  }

  const gameData = player.redT[gameName];
  const betInfo = {
    gameId: definition.id,
    gameRoundId: gameData.roundId,
    choiceId: BetChoiceMapper.convertKeno(betChoice),
    cuoc: amount,
    inSufficientBalance: { [gameName]: { notice: NoticeMessages.notEnoughMoney, endBet: -1 } },
  };
  const handleSuccessBetSync = ({ red }) => handleSuccessBet(definition, player, gameData, red, betChoice, amount).catch(Logger.logError);
  const handleFailedBetSync = () => handleFailedBet(definition.name, player, gameData, betChoice, amount);

  BalanceApi.placeBet({ id: player.UID }, betInfo, player, handleSuccessBetSync, handleFailedBetSync);
};

const handleSuccessBet = async (definition, player, gameData, red, betChoice, amount) => {
  const existingBetFilter = { uid: player.UID, phien: gameData.roundId };
  const existingBet = await definition.betRepository.findOne(existingBetFilter).exec();

  await insertBetLog(definition, player, gameData, betChoice, amount);

  if (existingBet) {
    existingBet[betChoice] += amount;
    await existingBet.save();
  } else {
    const newBet = {
      uid: player.UID,
      name: player.profile.name,
      phien: gameData.roundId,
      time: new Date(),
    };
    const existingBetIncrement = { [betChoice]: amount };

    if (player.session) {
      newBet.memberId = player.session.memberId;
      newBet.siteId = player.session.siteId;
    }

    await definition.betRepository.updateOne(
      existingBetFilter,
      { $inc: existingBetIncrement, $setOnInsert: newBet },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  notifyPlacingBetResult(definition.name, player, gameData, red, betChoice, amount);
};

const insertBetLog = async (definition, player, gameData, betChoice, amount) => {
  const newBetLog = {
    uid: player.UID,
    name: player.profile.name,
    phien: gameData.roundId,
    time: new Date(),
    choice: betChoice,
    amount,
  };

  if (player.session) {
    newBetLog.memberId = player.session.memberId;
    newBetLog.siteId = player.session.siteId;
  }

  await definition.betLogRepository.create(newBetLog);
};

const handleFailedBet = (gameName, player, gameData, betChoice, amount) => {
  const name = player.profile.name;

  if (gameData.ingame && gameData.ingame[name]) {
    const playerInGame = gameData.ingame[name];

    playerInGame.betTracks[betChoice] -= amount;
  }

  player.red({ [gameName]: { endBet: -1 } });
};

const notifyPlacingBetResult = (gameName, player, gameData, red, betChoice, amount) => {
  const name = player.profile.name;

  gameData.totalBets[betChoice] += amount;

  if (gameData.ingame && gameData.ingame[name]) {
    const playerInGame = gameData.ingame[name];
    const { betTracks: ownBets } = playerInGame;

    if (player.redT && player.redT.users) {
      player.redT.users[player.UID].forEach((player) => {
        player.red({
          [gameName]: { totalBets: gameData.totalBets, endBet: amount, ownBets },
          user: { red },
        });
      });
    }
  }
};

module.exports = (definition, player, payload) => {
  if (!validateBetRequest(definition, player, payload)) {
    return;
  }

  const name = player.profile.name;
  const amount = payload.amount >> 0;
  const betChoice = payload.betChoice;
  const gameData = player.redT[definition.name];

  if (gameData.ingame[name]) {
    gameData.ingame[name].betTracks[betChoice] += amount;
  } else {
    const newPlayer = {
      name: player.profile.name,
      betTracks: { ...Constants.resetTotalBets },
    };

    newPlayer.betTracks[betChoice] = amount;
    gameData.ingame[name] = newPlayer;
  }

  proceedBet(definition, player, betChoice, amount);
};
