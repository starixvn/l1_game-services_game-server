const initChips = { "1": 0, "5": 0, "10": 0, "50": 0, "100": 0, "200": 0, "500": 0 };

module.exports = {
    xocdiaDuration: 3,
    lockingBetDuration: 5,
    placingBetDuration: 31,
    roundDuration: 36,
    resetTotalBets: { even: 0, odd: 0, red3: 0, red4: 0, white3: 0, white4: 0 },
    resetChips: {
        even: initChips,
        odd: initChips,
        red3: initChips,
        red4: initChips,
        white3: initChips,
        white4: initChips,
    }
};