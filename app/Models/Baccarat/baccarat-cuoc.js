const mongoose = require("mongoose");

const betRecord = {
  type: Number,
  default: 0
};

const bet = {
  type: {
    player: betRecord,
    banker: betRecord,
    big: betRecord, // Tài
    small: betRecord, // Xỉu
    tie: betRecord
  }
};

const Schema = new mongoose.Schema({
  uid: { type: String, required: true }, // ID Người cược
  name: { type: String, required: true }, // Name Người cược
  phien: { type: Number, required: true, index: true }, // phiên cược
  bet: bet, // Thông tin cược
  thanhtoan: { type: Boolean, default: false }, // tình trạng thanh toán
  betwin: { type: Number, default: 0 }, // Tiền thắng được
  time: { type: Date }, // thời gian cược,
  memberId: { type: Number },
  siteId: { type: String }
});

module.exports = mongoose.model("baccarat_cuoc", Schema);
