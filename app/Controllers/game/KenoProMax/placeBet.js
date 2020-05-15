const ConfigHelper = require('../../../Helpers/ConfigHelper');
const constants = require("./../../../Cron/KenoProMax/constants");

function validateBetRequest(realPlayer, kenoProMax, { amount, box }) {
    if (!amount || !box) {
        return false;
    }

    let configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProMax);
    const betsOfThisUser = kenoProMax.ingame[realPlayer.profile.name] || {};
    const totalBets = constants.choices.reduce((total, choice) => total + betsOfThisUser[choice], 0);
    const maxBetForChoice = configs.choices_maxbet[box];

    const metadata = [
        {
            condition: kenoProMax.remainingTime < constants.lockingBetDuration || kenoProMax.remainingTime >= constants.placingBetDuration,
            notice: constants.notices.placeBetNextRound,
        },
        {
            condition: amount > maxBetForChoice || (betsOfThisUser[box] + amount) > maxBetForChoice,
            notice: constants.notices.maxBetForChoice(maxBetForChoice),
        },
        {
            condition: amount < configs.minbet,
            notice: constants.notices.minBet(configs.minbet),
        },
        {
            condition: amount > configs.maxbet,
            notice: constants.notices.maxBet(configs.maxbet),
        },
        {
            condition: totalBets + amount > configs.maxbet,
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
        let amount = data.amount >> 0;
        let box = data.box;

        if (kenoProMax.ingame[client.profile.name]) {
            kenoProMax.ingame[client.profile.name][box] += amount;
            kenoProMax.ingame[client.profile.name].betQueue.push({ data: data, client: client });
        } else {
            let newData = {
                name: client.profile.name,
                ...constants.resetTotalBets,
                betQueue: [{ data: data, client: client }]
            };
            newData[box] = amount;
            kenoProMax.ingame[client.profile.name] = newData;
        }
    }
};