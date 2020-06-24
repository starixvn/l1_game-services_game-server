const config = require('../../../../config/appConfigs');

/**
 * @param {string} input 
 */
const upercaseFirstCharacter = input =>
    input.length > 0 ? `${input[0].toUpperCase()}${input.substr(1)}` : '';

/**
 * @param {string} gameName
 * @param {Object} extensions
 * @returns {(client: object, data: object) => void}
 */
module.exports = (gameName, extensions = {}) => (client, data) => {
    if (!data[gameName]) {
        return;
    }

    const { view, sync, setResult } = data[gameName] || {};
    const proEnv = 'PRO';

    if (view) {
        client.gameEvent[`view${upercaseFirstCharacter(gameName)}`] = view;
        extensions.view && extensions.view(client, data);
    }

    if (sync) {
        const { remainingTime, roundId } = client.redT[gameName];
        extensions.sync && extensions.sync(client, data);
        client.red({ [gameName]: { remainingTime, roundId } });
    }

    if (config.env !== proEnv && setResult) {
        client.redT[gameName].settlementResultFromAdmin = setResult;
        extensions.setResult && extensions.setResult(client, data);
    }
}