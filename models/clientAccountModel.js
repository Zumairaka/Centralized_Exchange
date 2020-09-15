const mongoose = require('mongoose');

const clientAccountSchema = new mongoose.Schema( {
        phone: {
            type: Number,
            unique: true,
            required: true
        },
        privateKey: {
            type: String,
            required: true,
            unique: true
        },
        address: {
            type: String,
            required: true,
            unique: true
        },
        balance: {
            type: Number,
            required: true
        }
});

const clientAccountModel = mongoose.model('clientaccount', clientAccountSchema);
module.exports = {clientAccountModel};