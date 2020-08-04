let mongoose = require("mongoose");

let Schema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, 
  obCustId: { type: String, required: true }, 
  time: { type: Date, default: new Date() }, 
  used: { type: Boolean, default: false }
});

module.exports = mongoose.model("User_Spin", Schema);
