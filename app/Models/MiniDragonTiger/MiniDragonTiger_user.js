
let mongoose = require('mongoose');

let Schema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    red: { type: Number, default: 0 },
    red_lost: { type: Number, default: 0 },
    redPlay: { type: Number, default: 0 },
});

module.exports = mongoose.model('MiniDragonTiger_user', Schema);
