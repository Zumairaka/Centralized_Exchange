const mongoose = require('mongoose');

const clientBalanceSchema = new mongoose.Schema({
    
        BTCBalance: {
            type: Number
        },
        ETHBalance: {
            type: Number
        },
        USDTBalance: {
            type: Number
        },
        INRBalance: {
            type: Number
        },
        BCHBalance: {
            type: Number
        },
        CRMTBalance: {
            type: Number
        }

});

const clientBalanceModel = mongoose.model('clientbalance', clientBalanceSchema);
module.exports = {clientBalanceModel};