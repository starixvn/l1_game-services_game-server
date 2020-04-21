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

function test(isTX) {
    let result = ''
        + '<h1>Random 10000 times <button onClick="window.location.href = window.location.href;">Re-random</button></h1>'
        + `<h1>${(isTX ? 'Tài: &#9726 Xỉu: &#x25FD;' : 'Chẵn: &#9726 Lẽ: &#x25FD;')}</h1>`
        + '<br/><div style="word-break: break-all;letter-spacing: -9px;font-size: 30px;line-height: 9px;" >';

    for (i = 0; i <= 10000; i++) {
        const d1 = random();
        const d2 = random();
        const d3 = random();

        if (isTX) {
            result += ((d1 + d2 + d3) >= 11) ? '&#9726;' : '&#x25FD;';
        }
        else {
            result += ((d1 + d2 + d3) % 2 == 0) ? '&#9726;' : '&#x25FD;';
        }
    }

    return result + '</div>';
}

module.exports = {
    random,
    test
};