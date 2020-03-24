const staticResponse = {
  totalAmount: 200,
  totalWin: 200,
  validBetAmount: 200,
  endTime: new Date()
};

module.exports = function(app) {
  const handleRequest = cb => (req, res) => {
    cb && cb(req);
    res.send(staticResponse);
  };

  app
    .get(
      "/api/endgameinfo",
      handleRequest(req => console.log(req.query))
    )
    .post(
      "/api/endgameinfo",
      handleRequest(req => console.log(req.body))
    );
};
