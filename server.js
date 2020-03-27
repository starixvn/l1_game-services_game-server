// server.js

require("dotenv").config();


let express = require("express");
const appConfig = require('./config/appConfigs');
let app = express();
let port = appConfig.port;
let expressWs = require("express-ws")(app);
let bodyParser = require("body-parser");
var morgan = require("morgan");
var useragent = require('express-useragent');
app.use(useragent.express());

// kết nối tới database
require("./app/web/mongodb_connection")();


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

require("./app/Helpers/socketUser")(redT); // Add function socket
require('./app/Controllers/UnderMaintenance').assignRedT(redT);
require("./routerHttp")(app, redT); // load các routes HTTP
require("./routerSocket")(app, redT); // load các routes WebSocket

require("./app/Cron/taixiu")(redT); // Chạy game Tài Xỉu
require("./app/Cron/baucua")(redT); // Chạy game Bầu Cua
require("./config/cron")();


require("./update")();

//TODO: create dummy bot here
//require("./app/dummyAccountCreator").createBots(3, "ricky");
//require("./app/dummyAccountCreator").resetBalance(10000);
require("./app/web/logger").start();

app.listen(port, function () {
  console.log("Server listen on port ", port);
});

require("./app/web/authentication")(app);




