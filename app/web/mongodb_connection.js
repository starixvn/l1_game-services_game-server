let configDB = require("../../config/appConfigs").mongoDBConfig;
let mongoose = require("mongoose");
const logger = require('./logger').getLogger();

require("mongoose-long")(mongoose); // INT 64bit


module.exports = function () {
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
  });

}