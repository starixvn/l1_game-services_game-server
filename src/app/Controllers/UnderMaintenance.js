const logger = require("./../web/logger").getLogger();
const UmInfo = require("./../Models/UmInfo");

let redT = null;

function init(globalRedT) {
  redT = globalRedT;

  UmInfo.find({ finish: false }, "-_id")
    .lean()
    .exec()
    .then(function (data) {
      try {
        redT.umInfo = data;
      } catch (err) {
        logger.logError(error);
      }
    })
    .catch(function (error) {
      logger.logError(error);
    });
}

function handleUnderMaintenance(umInfo) {
  try {
    if (umInfo && redT) {
      if (redT.users && umInfo.isUM) {
        Object.values(redT.users).forEach(function (users) {
          users.forEach((realPlayer) => forceClosedConnection(realPlayer));
        });
      }
    }
  } catch (ex) {
    logger.logError(ex);
  }
}

function forceClosedConnection(realPlayer) {
  try {
    let umInfo = getUmInfoByPartnerId(realPlayer.session.partnerId);

    if (umInfo) {
      realPlayer.red({
        kickedOut: {
          message: "Game đang được bảo trì, vui lòng quay lại sau 10 phút.",
          umInfo: {
            isUM: true,
            startTime: umInfo.start,
            endTime: umInfo.end,
          },
        },
      });
      realPlayer.close();
    }
  } catch (error) {
    logger.logError(error);
  }
}

function getUmInfoByPartnerId(partnerId) {
  if (redT && redT.umInfo) {
    return redT.umInfo.find((um) => !um.finish && (!um.isPartnerUm || um.partnerId == partnerId));
  }

  return null;
}

function reload() {
  try {
    if (redT) {
      if (redT.users) {
        Object.values(redT.users).forEach(function (users) {
          users.forEach(function (cacheClient) {
            cacheClient.red({ reload: true });
          });
        });
      }
    }
  } catch (ex) {
    logger.logError(ex);
  }
}

module.exports = {
  init,
  handleUnderMaintenance,
  reload,
  forceClosedConnection,
  getUmInfoByPartnerId,
};
