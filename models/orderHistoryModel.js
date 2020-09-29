const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
        makerId : {
            type: String,
            required: true
        },
        takerId : {
            type: String,
            required: true
        },
        baseCurrency : {
            type: String,
            required: true
        },
        tradingCurrency : {
            type: String,
            required: true
        },
        purpose : {
            type: String,
            required: true
        },
        volume : {
            type: Number,
            required: true
        },
        price : {
            type: Number,
            required: true
        },
        time : {
            type: Number,
            required: true
        },
        flag : {
            type: Boolean,
            required:  true
        }      
});

const orderHistoryModel = mongoose.model('orderhistory', orderHistorySchema);
module.exports = {orderHistoryModel};