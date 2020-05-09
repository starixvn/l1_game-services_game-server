const ConfigHelper = require('../../../Helpers/ConfigHelper');
const constants = require("./../../../Cron/KenoProMax/constants");

function validateBetRequest(realPlayer, kenoProMax, { bet, box }) {
    if (!bet || !box) {
        return false;
    }

    let configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProMax);
    const betsOfThisUser = kenoProMax.ingame[realPlayer.profile.name] || {};
    const totalBets = Object.values(betsOfThisUser).reduce((total, bet) => total + bet, 0);
    var maxBetForChoice = constants.maxBetChoices[box];

    const metadata = [
        {
            condition: kenoProMax.remainingTime < constants.settlementDuration || kenoProMax.remainingTime > constants.placingBetDuration,
            notice: constants.notices.placeBetNextRound,
        },
        {
            condition: bet > maxBetForChoice || totalBets > maxBetForChoice,
            notice: constants.notices.maxBetForChoice(maxBetForChoice),
        },
        {
            condition: bet < configs.minbet,
            notice: constants.notices.minBet(configs.minbet),
        },
        {
            condition: bet > configs.maxbet,
            notice: constants.notices.maxBet(configs.maxbet),
        },
        {
            condition: totalBets + cuoc > configs.maxbet,
            notice: constants.notices.maxBet(configs.maxbet),
        },
    ];

    const result = metadata.filter((data) => data.condition);

    if (result.length > 0) {
        realPlayer.red({ kenoProMax: { notice: result[0].notice, endBet: -1 } });
        return false;
    }

    return true;
}

module.exports = (client, data) => {
    let kenoProMax = client.redT.kenoProMax;

    if (validateBetRequest(client, kenoProMax, data)) {
        let cuoc = data.cuoc >> 0;
        let box = data.box;

        if (kenoProMax.ingame[client.profile.name]) {
            kenoProMax.ingame[client.profile.name][box] += cuoc;
            kenoProMax.ingame[client.profile.name].betQueue.push({ data: data, client: client });
        } else {
            let newData = {
                name: client.profile.name,
                ...constants.resetTotalBets,
                betQueue: [{ data: data, client: client }]
            };
            newData[box] = cuoc;
            kenoProMax.ingame[client.profile.name] = newData;
        }
    }
};