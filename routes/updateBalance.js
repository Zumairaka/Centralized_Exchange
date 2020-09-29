const express = require('express');
const router = express.Router();
const {clientBalanceModel} = require('../models/clientBalanceModel');

// to update balances of clients
router.post('/', async function(req, res, next) {
    var data = req.body;

    // retrieve current balance of client
    await clientBalanceModel.findOne({_id: data.userid}, async (error, balance) => {
        if (error) {
            res.json({'message' : 'Error retrieving the current balance', 'error' : 'true', 'data' : 'null'});
        }
        else {
            // update the balance
            switch (data.currency) {
                case 'BTC' : await clientBalanceModel.findOneAndUpdate({_id: data.userid}, {BTCBalance: balance.BTCBalance + data.amount}, (error, update) => {
                                    if (error) {
                                        res.json({'message':'Error updating the balance', 'error':'true', 'data':'null'});
                                    }
                                    else {
                                        res.json({'message':'Updated balance successfully', 'error':'false', 'data': update});
                                    }
                             });
                             break;
                case 'ETH' : await clientBalanceModel.findOneAndUpdate({_id: data.userid}, {ETHBalance: balance.ETHBalance + data.amount}, (error, update) => {
                                    if (error) {
                                        res.json({'message':'Error updating the balance', 'error':'true', 'data':'null'});
                                    }
                                    else {
                                        res.json({'message':'Updated balance successfully', 'error':'false', 'data': update});
                                    }
                             });
                             break;
                case 'USDT' : await clientBalanceModel.findOneAndUpdate({_id: data.userid}, {USDTBalance: balance.USDTBalance + data.amount}, (error, update) => {
                                    if (error) {
                                        res.json({'message':'Error updating the balance', 'error':'true', 'data':'null'});
                                    }
                                    else {
                                        res.json({'message':'Updated balance successfully', 'error':'false', 'data': update});
                                    }
                             });
                             break;
                case 'INR' : await clientBalanceModel.findOneAndUpdate({_id: data.userid}, {INRBalance: balance.INRBalance + data.amount}, (error, update) => {
                                    if (error) {
                                        res.json({'message':'Error updating the balance', 'error':'true', 'data':'null'});
                                    }
                                    else {
                                        res.json({'message':'Updated balance successfully', 'error':'false', 'data': update});
                                    }
                             });
                             break;
                case 'BCH' : await clientBalanceModel.findOneAndUpdate({_id: data.userid}, {BCHBalance: balance.BCHBalance + data.amount}, (error, update) => {
                                    if (error) {
                                        res.json({'message':'Error updating the balance', 'error':'true', 'data':'null'});
                                    }
                                    else {
                                        res.json({'message':'Updated balance successfully', 'error':'false', 'data': update});
                                    }
                             });
                             break;
                case 'CRMT' : await clientBalanceModel.findOneAndUpdate({_id: data.userid}, {CRMTBalance: balance.CRMTBalance + data.amount}, (error, update) => {
                                    if (error) {
                                        res.json({'message':'Error updating the balance', 'error':'true', 'data':'null'});
                                    }
                                    else {
                                        res.json({'message':'Updated balance successfully', 'error':'false', 'data': update});
                                    }
                             }); 
                             break;
                default: res.json({'message' : 'Error', 'error' : 'true', 'data' : 'null'});
            }
        }
    });

});

module.exports = router;