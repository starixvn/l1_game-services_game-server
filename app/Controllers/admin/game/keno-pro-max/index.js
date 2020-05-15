const config = require('../../../../../config/appConfigs');

module.exports = (client, data) => {
  if (data.view != null) {
    client.gameEvent.viewKenoProMax = data.view;
  }

  if (data.sync != null) {
    const kenoProMax = client.redT.kenoProMax;
    const { remainingTime, roundId } = kenoProMax;

    client.red({ kenoProMax: { remainingTime, roundId } });
  }

  if (data.setResult != null && config.env !== 'PRO') {
    client.redT.kenoProMax.settlementResultFromAdmin = data.setResult;
  }
}