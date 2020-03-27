
let mongoose = require('mongoose');

let Schema = new mongoose.Schema({	
	name:   {type: String,  required: true},
	enabled:   {type: Boolean,  required: true}, 	
	minbet: {type: mongoose.Schema.Types.Number, required: true},
	maxbet: {type: mongoose.Schema.Types.Number, required: true},
	disabledround: {type: Number, required: false},
	botenabled: {type: Boolean, default: false}, 
	maxbot: {type: Number, required: true}
});

Schema.index({name: 1}, {unique: true, background: true});

module.exports = mongoose.model('game_configs', Schema);