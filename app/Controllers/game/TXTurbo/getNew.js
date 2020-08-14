const balanceApi = require("../../../apis/balanceApi");

module.exports = function (client) {
  const active1 = new Promise((resolve, reject) => {
    balanceApi.getBalance({ id: client.UID }, client, function (user) {
      if (!user) return reject("Cannot find member");
      resolve(user);
    });
  });

  Promise.all([active1]).then((values) => {
    client.red({ user: values[0] });
  });
};
