const mongoose = require('mongoose');

const clientETHAccountSchema = new mongoose.Schema({    
        privateKey: {
            type: String,
            required: true,
            unique: true
        },
        address: {
            type: String,
            required: true,
            unique: true
        }
});

const clientETHAccountModel = mongoose.model('clientethaccount', clientETHAccountSchema);
module.exports = {clientETHAccountModel};