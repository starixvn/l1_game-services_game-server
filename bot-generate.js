

require("dotenv").config();


let express = require("express");
let app = express();
let port = process.env.PORT || 8080;
let expressWs = require("express-ws")(app);
let bodyParser = require("body-parser");
var morgan = require("morgan");
var useragent = require('express-useragent');
app.use(useragent.express());

// Setting & Connect to the Database
let configDB = require("./config/database");
let mongoose = require("mongoose");

require("mongoose-long")(mongoose); // INT 64bit

mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.connect(configDB.url, configDB.options).catch(function (error) {
  if (error) console.log("Connect to MongoDB failed", error);
  else console.log("Connect to MongoDB success");
});

// kết nối tới database
require("./app/web/mongodb_connection")();

//TODO: create dummy bot here
//require("./app/dummyAccountCreator").createBots(3, "ricky");
//require("./app/dummyAccountCreator").resetBalance(10000);
require("./app/dummyAccountCreator").generateBots();

//require("./app/dummyAccountCreator").deleteAllBots();