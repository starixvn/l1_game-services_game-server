
const randomString = require("randomstring");
const UserSession = require('./../Models/UserSessions');
const CryptoJS = require("crypto-js");
const secretKey = 'my secret';
const moment = require('moment');

async function initUserSessionWithSignInFlow(username) {
    const data = { memberKey: username };
    const authParams = {
        browserUserAgent: 'browserUserAgent',
        ip: 'localhost'
    };

    return await initUserSession(data, authParams)
}

async function initUserSession(data, authParams) {
    let userSession = await UserSession.findOne({ 'ssoToken': authParams.token });

    if (!userSession) {
        var sessionId = randomString.generate() + '_' + data.memberKey;
        userSession = await UserSession.create({
            'ssoToken': authParams.token,
            'sessionId': sessionId,
            'owSeq': data.seq,
            'username': data.memberKey,
            'memberId': data.memberId,
            'ssoTime': new Date(),
            'recheckInTime': new Date(),
            'ip': authParams.ip,
            'browserUserAgent': authParams.browserUserAgent,
            'siteId': data.siteId,
            'userId': data.userId,
            'language': data.language,
            'isOnline': true
        });
    }

    let userSessionIdEncrypted = CryptoJS.AES.encrypt(userSession.sessionId, secretKey).toString();

    return {
        userSessionIdEncrypted,
        userSession
    };
}

function generatedEncryptedSessionId(userSessionId) {
    return CryptoJS.AES.encrypt(userSessionId, secretKey).toString();
}

async function verifyUserSession(encryptedSessionId, authUsername) {
    let bytes = CryptoJS.AES.decrypt(encryptedSessionId, secretKey);
    let userSessionId = bytes.toString(CryptoJS.enc.Utf8);
    let userSession = null;
    let isAuthenticated = false;

    if (!!userSessionId) {
        try {
            userSession = await UserSession.findOne({ sessionId: userSessionId });
            const now = moment();
            const lastCheckinTime = moment(userSession.recheckInTime).add(5, 'm');
            if (!!userSession
                && userSession.username === authUsername) {
                isAuthenticated = true;
            }
        }
        catch (ex) {
            console.log('Error', e);
        }
    }

    return {
        userSession,
        isAuthenticated
    }
}

module.exports = {
    initUserSession,
    verifyUserSession,
    initUserSessionWithSignInFlow,
    generatedEncryptedSessionId
}