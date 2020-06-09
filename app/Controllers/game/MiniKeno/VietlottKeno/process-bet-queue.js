const GameIds = require("./../../../../../config/appConfigs").gameIds;

const BalanceApi = require("./../../../../apis/balanceApi");
const BetChoiceMapper = require("./../../../../apis/betChoiceMapper");
const Logger = require("./../../../../web/logger");

const NoticeMessages = require("./../../constants/notice-messages");

const KenoProVietCuoc = require("./models/KenoProViet_cuoc");

const proceedBet = (player, payload) =>
  new Promise((resolve, reject) => {
    if (!player.redT || !player.redT.kenoProViet) {
      return;
    }

    const kenoProVietData = player.redT.kenoProViet;
    const amount = payload.amount >> 0;
    const betChoice = payload.betChoice;
    const betInfo = {
      gameId: GameIds.kenoproviet,
      gameRoundId: kenoProVietData.roundId,
      choiceId: BetChoiceMapper.convertKenoProMax(betChoice), //TODO map to keno pro viet?!?
      cuoc: amount,
      inSufficientBalance: { kenoProViet: { notice: NoticeMessages.notEnoughMoney, endBet: -1 } },
    };
    const handleSuccessBetSync = ({ red }) => handleSuccessBet(player, kenoVietlotData, red, betChoice, amount).then(resolve).catch(reject);
    const handleFailedBetSync = () => {
      handleFailedBet(player, kenoProVietData, betChoice, amount);
      resolve();
    };

    BalanceApi.placeBet({ id: player.UID }, betInfo, player, handleSuccessBetSync, handleFailedBetSync);
  });

const handleSuccessBet = async (player, kenoProVietData, red, betChoice, amount) => {
  const existingBetFilter = { uid: player.UID, phien: kenoVietlotData.roundId };
  const existingBet = await KenoProVietCuoc.findOne(existingBetFilter).exec();

  if (existingBet) {
    existingBet[betChoice] += amount;
    await existingBet.save();
  } else {
    const newBet = {
      uid: player.UID,
      name: player.profile.name,
      phien: kenoVietlotData.roundId,
      time: new Date(),
    };
    const existingBetIncrement = { [betChoice]: amount };

    if (player.session) {
      newBet.memberId = player.session.memberId;
      newBet.siteId = player.session.siteId;
    }

    await KenoProVietCuoc.updateOne(
      existingBetFilter,
      { $inc: existingBetIncrement, $setOnInsert: newBet },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  notifyPlacingBetResult(player, kenoProVietData, red, betChoice, amount);
};

const handleFailedBet = (player, kenoProVietData, betChoice, amount) => {
  const name = player.profile.name;

  if (kenoProVietData.ingame && kenoVietlotData.ingame[name]) {
    const playerInGame = kenoProVietData.ingame[name];

    playerInGame.betTracks[betChoice] -= amount;
  }

  player.red({ kenoVietlot: { endBet: -1 } });
};

const notifyPlacingBetResult = (player, kenoProVietData, red, betChoice, amount) => {
  const name = player.profile.name;

  kenoProVietData.totalBets[betChoice] += amount;

  if (kenoProVietData.ingame && kenoProVietData.ingame[name]) {
    const playerInGame = kenoProVietData.ingame[name];
    const { betTracks: ownBets } = playerInGame;

    if (player.redT && player.redT.users) {
      player.redT.users[player.UID].forEach((player) => {
        player.red({
          kenoProViet: { totalBets: kenoProVietData.totalBets, endBet: amount, ownBets },
          user: { red },
        });
      });
    }
  }
};

const proceedQueue = (io) => {
  if (io.kenoProViet.ingame) {
    Object.values(io.kenoProViet.ingame).forEach((playerInGame) => {
      if (!playerInGame.betProcessing && playerInGame.betQueue && playerInGame.betQueue.length > 0) {
        const { player, payload } = playerInGame.betQueue.shift();

        playerInGame.betProcessing = true;
        proceedBet(player, payload)
          .then(() => (playerInGame.betProcessing = false))
          .catch(Logger.logError);
      }
    });
  }
};

module.exports = (io) => {
  const processTimeOut = 50;

  setTimeout(function proceed() {
    proceedQueue(io);
    setTimeout(proceed, processTimeOut);
  }, processTimeOut);
};
