
let UserInfo    = require('./app/Models/UserInfo');

var resetInRoom = function(){
	UserInfo.updateMany({ type: true }, { inRoom: false }).catch(
		(error) => {
		  logger.logError(error);
		}
	  );
}

module.exports = {
	resetInRoom: resetInRoom
  };
