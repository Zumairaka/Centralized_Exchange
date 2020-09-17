const mongoose = require('mongoose');

const clientCurrencySchema = new mongoose.Schema( {
        BTCBalance: {
            type: Number
        },
        ETHBalance: {
            type: Number
        },
        USDBalance: {
            type: Number
        },
        INRBalance: {
            type: Number
        }
});

const clientCurrencyModel = mongoose.model('clientcurrency', clientCurrencySchema);
module.exports = {clientCurrencyModel};