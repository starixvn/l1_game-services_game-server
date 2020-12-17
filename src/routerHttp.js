module.exports = function (app, redT) {
  app.get("/", function (req, res) {
    res.send("Site is running");
  });
  require("./routes/common")(app, redT);
  require("./routes/games")(app, redT);

  require("./routes/baccarat-test")(app);

  require("./routes/jwt")(app, redT);
  require("./routes/proviet-keno-round-result")(app, redT);
  require("./routes/jackpot")(app, redT);
};
