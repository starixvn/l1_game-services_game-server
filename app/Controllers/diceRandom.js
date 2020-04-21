const Chance = require('chance');
const randomLib1 = require('random');
const Random = require("random-js").Random;

function random1() {
    return Math.floor(Math.random() * 6) + 1;
}

function random2() {
    const chance = new Chance();
    return chance.d6();
}

function random3() {
    const chance = new Chance();
    return chance.integer({ min: 1, max: 6 });
}

function random4() {
    return randomLib1.int(1, 6);
}

function random5() {
    const random = new Random(MersenneTwister19937.autoSeed());
    return random.integer(1, 6);
}

const randomFunctions = [
    random1,
    random2,
    random3,
    random4,
    random5
]

function random() {
    var randomFuntion = randomFunctions[Math.floor(Math.random() * (randomFunctions.length - 1))];

    return randomFuntion();
}

function test() {
    let dice1 = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };
    let dice2 = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };
    let dice3 = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };

    for (i = 0; i <= 1000; i++) {
        const d1 = random();
        const d2 = random();
        const d3 = random();

        dice1[d1.toString()]++;
        dice2[d2.toString()]++;
        dice3[d3.toString()]++;
    }

    console.log(dice1);
    console.log(dice2);
    console.log(dice3);
}

module.exports = {
    random,
    test
};