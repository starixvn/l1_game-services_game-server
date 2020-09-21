var Users = require("../../../../Models/Users");
var UserInfo = require("../../../../Models/UserInfo");
let Phone = require("../../../../Models/Phone");

const logger = require("../../../../web/logger");

module.exports = function (client, id) {
  if (!!id) {
    var wait_user = new Promise((resolve, reject) => {
      UserInfo.findOne({ id: id }, function (err, result) {
        if (err) {
          logger.logError(err);
        }

        if (!!result) {
          Users.findOne({ _id: result.id }, function (error, result2) {
            if (error) {
              logger.logError(error);
            }

            var temp = result._doc;
            delete temp._id;
            delete temp.__v;
            temp["username"] = !!result2 ? result2.local.username : "";
            Phone.findOne({ uid: result.id }, function (error2, result3) {
              if (error2) {
                logger.logError(err);
              }

              temp["phone"] = !!result3 ? result3.region + result3.phone : "";
              resolve(temp);
            });
          });
        } else {
          reject("User not found: " + id);
        }
      });
    });

    var active = [wait_user];
    Promise.all(active).then((resulf) => {
      client.red({
        users: {
          get_info: {
            profile: resulf[0],
          },
        },
      });
    });
  }
};
