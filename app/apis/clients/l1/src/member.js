const { sendPostRequest } = require("./util");

const metadata = [
  {
    action: "/Member/EnterPortal",
    name: "notifyLogin"
  },
  {
    action: "/Member/Balance",
    name: "balance"
  },
  {
    action: "/Member/PlaceBet",
    name: "placeBet"
  },
  {
    action: "/Member/EndGame",
    name: "endGame"
  },
  {
    action: "/Member/VoidGame",
    name: "voidGame"
  },
  {
    action: "/Member/EnterPortal",
    name: "enterPortal"
  }
];

module.exports = config =>
  metadata.reduce((result, data) => {
    result[data.name] = sendPostRequest(data.action, config);
    return result;
  }, {});
