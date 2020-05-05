const AutoIncrement = require("mongoose-auto-increment-reworked")
  .MongooseAutoIncrementID;
const mongoose = require("mongoose");

class Card {

}
const card = {
  card: Number,
  type: Number,
};

const player = {
  type: {
    card1: card,
    card2: card,
    card3: card
  }
};

const Schema = new mongoose.Schema({
  player: player,
  banker: player,
  time: {
    type: Date,
    default: new Date()
  }
});

Schema.plugin(AutoIncrement.plugin, {
  modelName: "bacarat_phien",
  field: "id"
});

module.exports = mongoose.model("baccarat_phien", Schema);
