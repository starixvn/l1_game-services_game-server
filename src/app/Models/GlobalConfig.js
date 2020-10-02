
let mongoose = require('mongoose');

let Schema = new mongoose.Schema({
    name: { type: String },
    value: { type: String },
});

module.exports = mongoose.model('GlobalConfig', Schema);