
let TXTurboCuoc = require('../../Models/TXTurbo/TXTurbo_cuoc');
let TXTurboCuocOne = require('../../Models/TXTurbo/TXTurbo_one');
let UserInfo = require('../../Models/UserInfo');
let Helper = require('../../Helpers/Helpers');

module.exports = function (bot, io, maxBet) {
    let cuoc = Helper.getRandomNumberStep5(maxBet);

    let select = !!((Math.random() * 2) >> 0);
    if (select) {
        io.taixiu_turbo.taixiu.red_tai += cuoc;
        io.taixiu_turbo.taixiu.red_player_tai += 1;
    } else {
        io.taixiu_turbo.taixiu.red_xiu += cuoc;
        io.taixiu_turbo.taixiu.red_player_xiu += 1;
    }

    TXTurboCuocOne.create({ uid: bot.id, phien: io.TXTurbo_phien, taixiu: true, select: select, red: true, bet: cuoc });
    TXTurboCuoc.create({ uid: bot.id, name: bot.name, phien: io.TXTurbo_phien, bet: cuoc, taixiu: true, select: select, red: true, time: new Date() });

    var self = this;
    self.cuocTX = cuoc;

    UserInfo.findOne({ id: bot.id })
        .then(function (data) {

            if (data.red >= self.cuocTX) {
                data.red -= self.cuocTX;

                data.save();
            }

        });
};