let mongoose = require('mongoose');

let Schema = new mongoose.Schema({
    ssoToken: { type: String, unique: true },
    sessionId: { type: String, unique: true },
    siteId: { type: String },
    userId: { type: String },
    username: { type: String },
    owSeq: { type: String, },
    memberId: { type: Number, },
    ssoTime: { type: Date, },
    recheckInTime: { type: Date, required: true },
    ip: { type: String, },
    browserUserAgent: { type: String },
    language: { type: String }
});

module.exports = mongoose.model('UserSessions', Schema);