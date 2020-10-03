const mongoose = require('mongoose');

const orderBookSchema = new mongoose.Schema({

        userid: {
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
            type: String,
            required: true
        },
        flag : {
            type: Boolean,
            required:  true
        }      
});

const orderBookModel = mongoose.model('orderbook', orderBookSchema);
module.exports = {orderBookModel};