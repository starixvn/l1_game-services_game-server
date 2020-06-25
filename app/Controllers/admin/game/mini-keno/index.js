const MiniBase = require('../mini-base');
const path = require('path');

const gameNames = [
    'kenoEast',
    'kenoMax',
    'kenoMax2',
    'kenoMini',
    'kenoMini2',
    'kenoNorth',
    'kenoSouth',
    'kenoWest',
];

const kenoExtension = gameName => ({
    sync: client => {
        const definitionPath = path.join('../../../game/MiniKeno', gameName.substr(4), 'definition');
        const definition = require(definitionPath) || {};

        client.red({ [gameName]: { durations: definition.durations, choices: definition.choices } });
    }
});

const kenoGames = gameNames.map(gameName => MiniBase(gameName, kenoExtension(gameName)));

module.exports = (client, data) => {
    kenoGames.forEach(handle => handle(client, data));
};
