// server.js

require("dotenv").config();

// let Telegram = require("node-telegram-bot-api");
// //let TelegramToken = '987211295:AAGlIN124PtI_g3VXSWXczTrc_ri9BBx-ek';
// let TelegramToken = "991191106:AAEZ88nBLM-_iaxihZKgKJNJZ23-bN8VwgQ";
// // let TelegramToken = "810271179:AAGHGFuwfbtadJ4RJWcZ9dVd7nMGa6aGc4k";

// let TelegramBot = new Telegram(TelegramToken, { polling: true });

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

// Support User Session
const session = require('express-session');
var randomstring = require("randomstring");
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
  uri: configDB.url,
  collection: 'sessions',
  databaseName: 'member'
});
app.use(session({
  secret: 'secret_token',
  resave: false,
  saveUninitialized: true,
  unset: 'destroy',
  store: store,
  name: 'L1_CC_Server',
  genid: (req) => {
    return randomstring.generate();
  }
}));

// cấu hình tài khoản admin mặc định và các dữ liệu mặc định
require("./config/admin");

// đọc dữ liệu from
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan("combined"));

app.set("view engine", "ejs"); // chỉ định view engine là ejs
app.set("views", "./views"); // chỉ định thư mục view

// Serve static html, js, css, and image files from the 'public' directory
app.use(express.static("public"));

// server socket
let redT = expressWs.getWss();
//redT.telegram = TelegramBot;

require("./app/Helpers/socketUser")(redT); // Add function socket

require("./routerHttp")(app, redT); // load các routes HTTP
require("./routerSocket")(app, redT); // load các routes WebSocket

require("./app/Cron/taixiu")(redT); // Chạy game Tài Xỉu
require("./app/Cron/baucua")(redT); // Chạy game Bầu Cua
require("./config/cron")();

require("./update")();

// require("./app/Telegram/Telegram")(TelegramBot); // Telegram Bot

//TODO: create dummy bot here
//require("./app/dummyAccountCreator").createBots(100, "userc");
require("./app/web/sentry")();

app.listen(port, function () {
  console.log("Server listen on port ", port);
});

require("./app/web/authentication")(app);



