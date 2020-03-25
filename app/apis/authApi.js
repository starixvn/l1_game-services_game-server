const l1Client = require('./clients/l1Client');
const appConfigs = require('./../../config/appConfigs');
const logger = require('./../web/logger').getLogger();

const authApi = {
    nofityLogin: (session, data, cb) => {
        if (appConfigs.enabledApi
            && session.siteId
            && session.memberId > 0) {

            var notifyLoginParam = {
                ObCustId: session.memberId,
                CharacterName: data.characterName,
                Seq: session.owSeq,
                SiteId: session.siteId,
                FirstLogin: data.firstLogin,
                Language: session.language
            };

            const beforeMessage = logger.composeBeforeCallMessage(session, notifyLoginParam);

            l1Client.notifyLogin(notifyLoginParam, cb, beforeMessage);
        }
    },
    verifyToken: l1Client.verifyToken
}

module.exports = authApi;