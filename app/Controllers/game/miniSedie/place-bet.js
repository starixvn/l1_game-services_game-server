const configHelper = require('../../../Helpers/ConfigHelper');
const constants = require('./constants');
const noticeMessages = require('../constants/notice-messages');

const validateBetRequest = (client, { cuoc, box }) => {
    if (!cuoc || !box) {
        return false;
    }

    let miniSedieData = client.redT.miniSedie;
    let configs = configHelper.getConfigs(configHelper.GameTypes.MiniSedie);
    const betsOfThisUser = miniSedieData.ingame[client.profile.name] || {};
    const totalBets = constants.choices.reduce((total, choice) => total + betsOfThisUser[choice], 0);
    var maxBetForChoice = constants.maxBetPerChoices[box];

    const metadata = [
        {
            condition: miniSedieData.remainingTime <= constants.lockingBetDuration || miniSedieData.remainingTime > constants.placingBetDuration,
            notice: noticeMessages.placeBetNextRound,
        },
        {
            condition: miniSedieData.remainingTime <= constants.lockingBetDuration || miniSedieData.remainingTime > constants.placingBetDuration,
            notice: noticeMessages.placeBetNextRound,
        },
        {
            condition: cuoc > maxBetForChoice || (betsOfThisUser[box] + cuoc) > maxBetForChoice,
            notice: noticeMessages.maxBetForChoice(maxBetForChoice),
        },
        {
            condition: cuoc < configs.minbet,
            notice: noticeMessages.minBet(configs.minbet),
        },
        {
            condition: cuoc > configs.maxbet,
            notice: noticeMessages.maxBet(configs.maxbet),
        },
        {
            condition: totalBets + cuoc > configs.maxbet,
            notice: noticeMessages.maxBet(configs.maxbet),
        },
    ];

    const result = metadata.filter((data) => data.condition);

    if (result.length > 0) {
        realPlayer.red({ miniSedie: { notice: result[0].notice, endBet: -1 } });
        return false;
    }

    return true;
};

module.exports = (client, data) => {
    if (validateBetRequest(client, data)) {
        let cuoc = data.cuoc >> 0;
        let box = data.box;

        let miniSedieData = client.redT.miniSedie;
        if (miniSedieData.ingame[client.profile.name]) {
            miniSedieData.ingame[client.profile.name][box] += cuoc;
            miniSedieData.ingame[client.profile.name].betQueue.push({ data: data, client: client });
        } else {
            let newData = {
                name: client.profile.name,
                ...constants.resetTotalBets,
                betQueue: [{ data: data, client: client }]
            };
            newData[box] = cuoc;
            miniSedieData.ingame[client.profile.name] = newData;
        }
    }
};