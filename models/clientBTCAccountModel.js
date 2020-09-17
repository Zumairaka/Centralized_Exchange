const mongoose = require('mongoose');

const clientBTCAccountSchema = new mongoose.Schema({    
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

const clientBTCAccountModel = mongoose.model('clientbtcaccount', clientBTCAccountSchema);
module.exports = {clientBTCAccountModel};