
let mongoose = require('mongoose');

let Schema = new mongoose.Schema({
	_id: {type: mongoose.Schema.Types.ObjectId,  required: true},
	name:   {type: String,  required: true},
	enabled:   {type: Boolean,  required: true}, 
	bot:    {type: Boolean, default: false}, 
	minbet: {type: mongoose.Schema.Types.Number, required: true},
	maxbet: {type: mongoose.Schema.Types.Number, required: true}
});

module.exports = mongoose.model('game_configs', Schema);