
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

let TaiXiu_Cuoc = require('./Models/TaiXiu_cuoc');
let TaiXiu_One = require('./Models/TaiXiu_one');
let BauCua_Cuoc = require('./Models/BauCua/BauCua_cuoc');
let XocXoc_Cuoc = require('./Models/XocXoc/XocXoc_cuoc');


let bot_nicknames = require('../config/botnames.json').nicknames;

let createBots = function (total, usernamePrefix, isBot) {

    for (let i = 0; i < total; i++) {
        let userName = `${usernamePrefix}${i}`;

        createBot(userName, isBot);
    }

    console.log(`Create ${total} account successfully`);
}

let createBot = function (characterName, isBot) {
    let userName = `${characterName}`
    console.log("Creating user " + userName);
    User.create({ 'local.username': userName, 'local.password': helpers.generateHash("1234aa"), 'local.regDate': new Date() }, function (err, user) {
        if (!!user) {
            let client = {
                UID: user._id.toString()
            };

            createBotInfo(client, characterName, isBot);

            console.log(`Account ${userName} was created sucessfully ${user}`);
        } else {
            console.log(`Account ${userName} existed`);
        }
    });
}

let createBotInfo = function (client, characterName, isBot) {
    UserInfo.findOne({ 'name': `${characterName}nv` }, 'name', function (err, check) {
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
                        user.red = 10000;

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
                        BauCua_User.create({ 'uid': client.UID });
                        XocXoc_user.create({ 'uid': client.UID });

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
                                    red: 10000,
                                    type: isBot
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

let resetBalanceForBots = function (newBalance) {
    UserInfo.updateMany({ 'type': true },
        {
            $set:
            {
                red: newBalance
            }
        }, (err, result) => {
            console.log(`Reset Balance Done ${JSON.stringify(result)}`);
        });

}

let generateBots = function () {

    var batchSize = 20;
    var createFinished = false;
    var batchLength = batchSize;
    var currentIndex = 0;
    var createFinished = false;

    var createBotsTimer = setInterval(function () {

        console.log("batch size " + batchLength);

        for (let index = currentIndex * batchSize; index < batchLength; index++) {

            if (index < bot_nicknames.length) {
                const nickname = `${bot_nicknames[index]}`;

                console.log("Generating bot " + nickname);

                createBot(nickname, true);
            }
            else {
                clearInterval(createBotsTimer);
                createFinished = true;
            }
        }

        currentIndex++;
        batchLength = currentIndex * batchSize + batchSize;

    }, 10000);
}

let deleteAllBots = function () {
    UserInfo.find({ 'type': true }, function (err, data) {
        if (err != null) {
            console.log("not found user " + err);
        }

        var batchSize = 30;
        var batchLength = batchSize;
        var currentIndex = 0;

        var createBotsTimer = setInterval(function () {

            console.log("batch size " + batchLength);

            for (let index = currentIndex * batchSize; index < batchLength; index++) {

                if (index < data.length) {
                    const bot = data[index];

                    console.log("deleting bot " + bot.name);

                    deleteBot(bot.id);
                }
                else {
                    clearInterval(createBotsTimer);

                    UserInfo.deleteMany({ 'type': true }, function (err) {
                        if (err) console.log("delete bots error " + err);

                        console.log("deleteAllBots done");
                    });
                }
            }

            currentIndex++;
            batchLength = currentIndex * batchSize + batchSize;

        }, 10000);
    });
}

let deleteBot = function (id) {
    console.log("delete user id " + id);

    TaiXiu_User.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("TaiXiu_User.deleteOne " + err);
    });

    MiniPoker_User.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("MiniPoker_User.deleteOne " + err);
    });

    Bigbabol_User.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("Bigbabol_User.deleteOne " + err);
    });
    VQRed_User.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("VQRed_User.deleteOne " + err);
    });
    BauCua_User.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("BauCua_User.deleteOne " + err);
    });
    Mini3Cay_User.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("Mini3Cay_User.deleteOne " + err);
    });
    CaoThap_User.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("CaoThap_User.deleteOne " + err);
    });
    AngryBirds_user.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("AngryBirds_user.deleteOne " + err);
    });
    Candy_user.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("Candy_user.deleteOne " + err);
    });
    LongLan_user.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("LongLan_user.deleteOne " + err);
    });
    XocXoc_user.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("XocXoc_user.deleteOne " + err);
    });
    MegaJP_user.deleteOne({ 'uid': id }, function (err) {
        if (err) console.log("MegaJP_user.deleteOne " + err);
    });

    TaiXiu_Cuoc.deleteMany({ 'uid': id }, function (err) {
        if (err) console.log("TaiXiu_Cuoc.deleteOne " + err);
    });
    TaiXiu_One.deleteMany({ 'uid': id }, function (err) {
        if (err) console.log("TaiXiu_One.deleteOne " + err);
    });
    BauCua_Cuoc.deleteMany({ 'uid': id }, function (err) {
        if (err) console.log("BauCua_Cuoc.deleteOne " + err);
    });
    XocXoc_Cuoc.deleteMany({ 'uid': id }, function (err) {
        if (err) console.log("XocXoc_Cuoc.deleteOne " + err);
    });

    User.deleteOne({ '_id': id }, function (err) {
        if (err) console.log("User.deleteOne " + err);
    });
}

let getAllBots = function () {
    console.log("getAllBots");

    UserInfo.find({ 'type': true }, function (err, data) {
        if (err != null) {
            console.log("not found user " + err);
        }

        console.log("Total bots: " + data.length);

        data.forEach(element => {
            console.log("bot name " + element.name);
        });
    });
}

module.exports = {
    createBots: createBots,
    createBotInfo: createBotInfo,
    resetBalanceForBots: resetBalanceForBots,
    generateBots: generateBots,
    deleteAllBots: deleteAllBots,
    getAllBots: getAllBots
};
