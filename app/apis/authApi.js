const l1Client = require('./clients/l1Client');

const authApi = {
    nofityLogin: (session, data, cb) => {
        var notifyLoginParam = {
            memberId: session.memberId,
            characterName: data.characterName,
            seq: session.owSeq,
            siteId: session.siteId,
            firstLogin: data.firstLogin
        };

        l1Client.notifyLogin(notifyLoginParam, cb);
    },
    verifyToken: l1Client.verifyToken
}



module.exports = authApi;