const AutoIncrement = require('mongoose-auto-increment-reworked').MongooseAutoIncrementID;
const mongoose = require('mongoose');

const card = {
	card: Number,
	type: Number
};

const player = {
	card1: card,
	card2: card,
	card3: card
};

const Schema = new mongoose.Schema({
	player: player,
	banker: player,
	time: {
		type: Date,
		default: new Date()
	},
});

Schema.plugin(AutoIncrement.plugin, {
	modelName: 'mini_bacarat_phien',
	field: 'id'
});

module.exports = mongoose.model('mini_baccarat_phien', Schema);