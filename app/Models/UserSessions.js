let mongoose = require('mongoose');

let Schema = new mongoose.Schema({
    ssoToken: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, unique: true },
    owToken: { type: String, required: true },
    owSeq: { type: String, required: true },
    username: { type: String, required: true },
    ssoTime: { type: Date, required: true },
    recheckInTime: { type: Date, required: true },
    ip: { type: String, required: true},
    browserUserAgent: { type: String }
});

module.exports = mongoose.model('UserSessions', Schema);