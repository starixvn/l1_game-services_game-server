const TXTurboCuoc = require("../../../Models/TXTurbo/TXTurbo_cuoc");
const TXTurboCuocOne = require("../../../Models/TXTurbo/TXTurbo_one");
const UserInfo = require("../../../Models/UserInfo");

const balanceApi = require("./../../../apis/balanceApi");
const gameIds = require("./../../../../config/appConfigs").gameIds;
const betChoiceMapper = require("./../../../apis/betChoiceMapper");
const logger = require("./../../../web/logger");
const ConfigHelper = require("./../../../Helpers/ConfigHelper");
const helper = require("./../../../Helpers/Helpers");
let configs = null;

function insertBetAndNotifyUsers(client, user, phien, bet, select, totalBet, updatedUser, playerBetCount, io) {
  const red = true;
  const isUUSAccount = client.session && client.session.currency && client.session.currency.toUpperCase() === "UUS";

  let create = {
    uid: client.UID,
    name: user.name,
    phien: phien,
    bet: bet,
    taixiu: true,
    select: select,
    red: red,
    time: new Date(),
  };

  if (client.session) {
    create.memberId = client.session.memberId;
    create.siteId = client.session.siteId;
  }

  TXTurboCuoc.create(create)
    .then(() => {
      if (io) {
        if (red && !isUUSAccount) {
          if (select) {
            io.taixiu_turbo.taixiu.red_tai += bet;
            io.taixiuTurboAdmin.taixiu.red_tai += bet;

            io.taixiu_turbo.playerBetBigCount += playerBetCount;
            io.taixiuTurboAdmin.playerBetBigCount += playerBetCount;
          } else {
            io.taixiu_turbo.taixiu.red_xiu += bet;
            io.taixiuTurboAdmin.taixiu.red_xiu += bet;

            io.taixiu_turbo.playerBetSmallCount += playerBetCount;
            io.taixiuTurboAdmin.playerBetSmallCount += playerBetCount;
          }
        }

        io.taixiuTurboAdmin.list.unshift({
          name: user.name,
          taixiu: true,
          select: select,
          red: red,
          bet: bet,
          time: new Date(),
        });

        const taixiuVery = select ? { red_me_tai: totalBet } : { red_me_xiu: totalBet };

        if (!!io.users[client.UID]) {
          Promise.all(
            io.users[client.UID].map(function (obj) {
              obj.red({
                taixiu_turbo: { taixiu: taixiuVery },
                user: { red: updatedUser.red },
              });
            })
          );
        }
      }
    })
    .catch((error) => logger.logError(error));
}

module.exports = function (client, data) {
  try {
    if (!!data) {
      configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.TXTurbo);

      if (client.redT.TXTurbo_time < 6 || client.redT.TXTurbo_time >= 30) {
        client.red({ taixiu_turbo: { err: "Vui lòng đặt cược ở phiên sau." } });
      } else {
        const bet = data.bet >> 0; // Số tiền
        const taixiu = !!data.taixiu; // Tài xỉu:true    Chẵn lẻ:false
        const red = !!data.red; // Loại tiền (Red:true, Xu:false)
        const select = !!data.select; // Cửa đặt (Tài:1, Xỉu:0)
        if (bet < configs.minbet) {
          client.red({ taixiu_turbo: { err: "Tiền cược tối thiểu là " + helper.formatNumberWithComma(configs.minbet) } });
        } else if (bet > configs.maxbet) {
          client.red({ taixiu_turbo: { err: "Tiền cược tối đa là " + helper.formatNumberWithComma(configs.maxbet) } });
        } else {
          const phien = client && client.redT ? client.redT.TXTurbo_phien : 0;
          const io = client && client.redT ? client.redT : null;
          data.inSufficientBalance = { taixiu_turbo: { err: "Bạn hiện không có đủ tiền để cược." } };
          data.gameId = gameIds.txturbo;
          data.gameRoundId = phien;
          data.choiceId = betChoiceMapper.convertTaiXiu(select);
          data.cuoc = bet;
          UserInfo.findOne({ id: client.UID }, red ? "red name" : "xu name", function (err, userInfo) {
            try {
              if (err) {
                logger.logError(err);
                client.red({ taixiu_turbo: { err: "Đặt cược không thành công." } });
                return;
              }

              balanceApi.placeBet({ id: client.UID }, data, client, (user, {}, updateUserRed) => {
                TXTurboCuocOne.findOne({ uid: client.UID, phien: phien, taixiu: taixiu, red: red }, function (isCuocErr, isCuoc) {
                  try {
                    if (isCuocErr) {
                      logger.logError(err);
                      client.red({ taixiu_turbo: { err: "Đặt cược không thành công." } });
                      return;
                    }

                    user.name = userInfo.name;
                    const totalBet = isCuoc ? isCuoc.bet + bet : bet;
                    const playerBetCount = isCuoc ? 0 : 1;

                    if (!!isCuoc) {
                      if (isCuoc.select !== select) {
                        client.red({ taixiu_turbo: { err: "Chỉ được cược 1 bên." } });

                        return;
                      }

                      if (isCuoc.bet + bet > configs.maxbet) {
                        client.red({ taixiu_turbo: { err: "Tiền cược tối đa là " + helper.formatNumberWithComma(configs.maxbet) } });

                        return;
                      }
                    }

                    updateUserRed((updatedUser) => {
                      const cuocOneCreate = { uid: client.UID, phien: phien, taixiu: taixiu, select: select, red: red };
                      if (client.session) {
                        cuocOneCreate.memberId = client.session.memberId;
                        cuocOneCreate.siteId = client.session.siteId;
                      }

                      TXTurboCuocOne.updateOne(
                        { uid: client.UID, phien: phien, taixiu: taixiu, red: red, select: select },
                        { $inc: { bet: bet }, $setOnInsert: cuocOneCreate },
                        { upsert: true, setDefaultsOnInsert: true }
                      )
                        .exec()
                        .then((result) => {
                          if (result.ok == 1) {
                            insertBetAndNotifyUsers(client, user, phien, bet, select, totalBet, updatedUser, playerBetCount, io);
                          } else {
                            logger.logWarning(`Upsert TX Turbo ONE failed ${JSON.stringify(result)}`);
                          }
                        })
                        .catch((error) => {
                          logger.logError(error);
                        });
                    });
                  } catch (ex) {
                    logger.logError(ex);
                  }
                });
              });
            } catch (ex) {
              logger.logError(ex);
            }
          });
        }
      }
    }
  } catch (ex) {
    logger.logError(ex);
  }
};
