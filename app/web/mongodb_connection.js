let configDB = require("../../config/appConfigs").mongoDBConfig;
let mongoose = require("mongoose");
let bluebird = require('bluebird');
const logger = require('./logger').getLogger();

let reconnectTimeout = null;

require("mongoose-long")(mongoose); // INT 64bit

// Retry connection
// const connectWithRetry = () => {
//   const message = `MongoDB retry connect at ${new Date()}`;
//   console.log(message);
//   logger.log(message);

//   return connectDatabase();
// }

const initRetry = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  reconnectTimeout = setTimeout(() => {
    logger.logCritical(`Begin restart game server at ${new Date()}`);

    throw "Unhandled Exeption to restart nodejs thread";
  }, 3000);
}

function connectDatabase() {
  mongoose.set("useFindAndModify", false);
  mongoose.set("useCreateIndex", true);
  mongoose.connect(configDB.url, configDB.options).catch(function (error) {
    if (error) {
      console.log("Connect to MongoDB failed", error);
    }
    else {
      console.log("Connect to MongoDB success");
    }

    logger.logError(error);
    initRetry();
  });

  mongoose.connection.on('connected', () => {
    const message = `MongoDB connected at ${new Date()}`;
    console.log(message);
  });

  mongoose.connection.on('disconnected', () => {
    initRetry();
  })

  // mongoose.connection.on('error', err => {
  //   console.log(`MongoDB connection error: ${err}`);
  //   logger.logError(err);

  //   setTimeout(connectWithRetry, 5000);
  // })
}

module.exports = connectDatabase