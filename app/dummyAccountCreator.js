
let User = require('./Models/Users');
let UserInfo = require('./Models/UserInfo');

let helpers = require('./Helpers/Helpers');

let TaiXiu_User = require('./Models/TaiXiu_user');
let MiniPoker_User = require('./Models/miniPoker/miniPoker_users');
let Bigbabol_User = require('./Models/BigBabol/BigBabol_users');
let VQRed_User = require('./Models/VuongQuocRed/VuongQuocRed_users');
let BauCua_User = require('./Models/BauCua/BauCua_user');
let Mini3Cay_User = require('./Models/Mini3Cay/Mini3Cay_user');
let CaoThap_User = require('./Models/CaoThap/CaoThap_user');
let AngryBirds_user = require('./Models/AngryBirds/AngryBirds_user');
let Candy_user = require('./Models/Candy/Candy_user');
let LongLan_user = require('./Models/LongLan/LongLan_user');
let XocXoc_user = require('./Models/XocXoc/XocXoc_user');

let MegaJP_user = require('./Models/MegaJP/MegaJP_user');

let createBots = function (total, usernamePrefix) {

    for (let i = 0; i < total; i++) {
        let userName = `${usernamePrefix}${i}`;
        User.create({ 'local.username': userName, 'local.password': helpers.generateHash("1234aa"), 'local.regDate': new Date() }, function (err, user) {
            if (!!user) {
                let client = {
                    UID: user._id.toString()
                };

                createBotInfo(client, `${userName}nv`);

                console.log(`Account ${userName} was created sucessfully ${user}`);
            } else {
                console.log(`Account ${userName} existed`);
            }
        });
    }

    console.log(`Create ${total} account successfully`);
}

let createBotInfo = function (client, characterName) {
    UserInfo.findOne({ 'name': characterName }, 'name', function (err, check) {
        if (!!check) {
            console.log(`Character Name ${characterName} existed`);
        } else {
            try {
                UserInfo.create({ 'id': client.UID, 'name': characterName, 'joinedOn': new Date() }, function (errC, user) {
                    if (!!errC) {
                        console.log(`Character Name ${characterName} existed`);
                    } else {
                        user = user._doc;
                        user.level = 1;
                        user.vipNext = 100;
                        user.vipHT = 0;
                        user.phone = '';
                        user.red = 9999999999;

                        delete user._id;
                        delete user.redWin;
                        delete user.redLost;
                        delete user.redPlay;
                        delete user.xuWin;
                        delete user.xuLost;
                        delete user.xuPlay;
                        delete user.thuong;
                        delete user.vip;
                        delete user.hu;
                        delete user.huXu;

                        //addToListOnline(client);

                        client.profile = { name: user.name };

                        TaiXiu_User.create({ 'uid': client.UID });
                        MiniPoker_User.create({ 'uid': client.UID });
                        Bigbabol_User.create({ 'uid': client.UID });
                        VQRed_User.create({ 'uid': client.UID });
                        BauCua_User.create({ 'uid': client.UID });
                        Mini3Cay_User.create({ 'uid': client.UID });
                        CaoThap_User.create({ 'uid': client.UID });
                        AngryBirds_user.create({ 'uid': client.UID });
                        Candy_user.create({ 'uid': client.UID });
                        LongLan_user.create({ 'uid': client.UID });
                        XocXoc_user.create({ 'uid': client.UID });
                        MegaJP_user.create({ 'uid': client.UID });

                        //Message.create({ 'uid': client.UID, 'title': 'Thành Viên Mới', 'text': 'Chào mừng bạn đến với R79.CLUB, chúc bạn chơi game vui vẻ...', 'time': new Date() });

                        //GameState(client);
                        //client.red(data);
                        console.log(user);
                        UserInfo.updateOne(
                            { 
                                name: characterName 
                            }, 
                            { 
                                $set: 
                                { 
                                    red: 9999999999,
                                    type: true
                                } 
                            }).exec();
                    }
                });
            } catch (error) {
                console.log(error);
            }
        }
    })
}

module.exports = {
    createBots: createBots,
    createBotInfo: createBotInfo
};