let mongoose = require('mongoose');

let Schema = new mongoose.Schema({
    ssoToken: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, unique: true },
    siteId: { type: String },
    userId: { type: String },
    username: { type: String },
    owSeq: { type: String, required: true },
    memberId: { type: Number, required: true },
    ssoTime: { type: Date, required: true },
    recheckInTime: { type: Date, required: true },
    ip: { type: String, required: true },
    browserUserAgent: { type: String }
});

module.exports = mongoose.model('UserSessions', Schema);