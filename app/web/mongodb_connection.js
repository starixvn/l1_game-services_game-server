let configDB = require("../../config/database");
let mongoose = require("mongoose");

require("mongoose-long")(mongoose); // INT 64bit


module.exports = function() {
    mongoose.set("useFindAndModify", false);
    mongoose.set("useCreateIndex", true);
    mongoose.connect(configDB.url, configDB.options).catch(function(error) {
      if (error) console.log("Connect to MongoDB failed", error);
      else console.log("Connect to MongoDB success");
    });
    
}