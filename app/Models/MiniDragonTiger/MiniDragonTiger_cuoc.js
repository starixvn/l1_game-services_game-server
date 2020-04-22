
let mongoose = require('mongoose');

let Schema = new mongoose.Schema({
    uid: { type: String, required: true },    // ID Người cược
    name: { type: String, required: true },    // Name Người cược
    phien: { type: Number, required: true, index: true },    // phiên cược
    red: { type: Boolean, required: true },    // loại tiền (Red = true,   Xu = false)

    Dragon: { type: Number, default: 0 },         // Số tiền đặt Hươu
    Draw: { type: Number, default: 0 },         // Số tiền đặt Bầu
    Tiger: { type: Number, default: 0 },         // Số tiền đặt Gà

    thanhtoan: { type: Boolean, default: false },    // tình trạng thanh toán
    bigWin: { type: Boolean, default: false },    // Thắng lớn
    betwin: { type: Number, default: 0 },	       // Tiền thắng được
    time: { type: Date },                       // thời gian cược,

    memberId: { type: Number },
    siteId: { type: String }
});

module.exports = mongoose.model('MiniDragonTiger_cuoc', Schema);