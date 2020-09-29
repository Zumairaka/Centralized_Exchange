const mongoose = require('mongoose');

const clientUSDTAccountSchema = new mongoose.Schema({  

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

const clientUSDTAccountModel = mongoose.model('clientustdaccount', clientUSDTAccountSchema);
module.exports = {clientUSDTAccountModel};