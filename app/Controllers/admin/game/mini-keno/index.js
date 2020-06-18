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
        const choicesOrder = [4, 5, 6, 7, 8, 0, 1, 2, 3];
        const choices = choicesOrder.map(index => definition.choices[index]);

        client.red({[gameName]: {durations: definition.durations, choices}});
    }
});

const kenoGames = gameNames.map(gameName => MiniBase(gameName, kenoExtension(gameName)));

module.exports = (client, data) => {
    kenoGames.forEach(handle => handle(client, data));
};
