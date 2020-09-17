const express = require('express');
const router = express.Router();
const {clientCurrencyModel} = require('../models/clientCurrencyModel');
const {registerModel} = require('../models/registerModel');

// creating wallet for the client
router.post('/', async function(req, res, next) {
    pin = req.body.pin;
    phone = req.body.phone;

    // retrieving the pin
    await registerModel.findOne({phone: phone}, async (error, phoneData) => {
        console.log(phoneData);

        // phone number not registered
        if(!phoneData) {
            res.json({'message': 'Phone number is not registered one', 'error' : 'true', 'data' : 'null'});
        }
        // phone number registered
        else if (phoneData) {
            // pin does not match
            if (pin != phoneData.pin) {
                res.json({'message': 'Wrong pin', 'error' : 'true', 'data' : 'null'});
            }
            // pin matches
            else if (pin == phoneData.pin) {
                // storing the balance
                var clientCurrency = {_id: phoneData._id, BTCBalance: 0, ETHBalance: 0, USDBalance: 0, INRBalance: 0};
                var clientCurrencyData = new clientCurrencyModel(clientCurrency);
                //console.log (clientCurrencyData);

                // storing the balance details
                await clientCurrencyData.save((error, saveData) => {
                    if (error) {
                        res.json({'message': 'Error with Updating Balance', 'error' : 'true', 'data' : 'null'});
                    }
                    else if (saveData) {
                        var resData = {'userid' : saveData._id, 'BTCBalance' : saveData.BTCBalance,
                         'ETHBalance' : saveData.ETHBalance, 'USDBalance' : saveData.USDBalance, 'INRBalance' : saveData.INRBalance};
                        res.json({'message': 'Balance Updated Successfully', 'error' : 'false', 'data' : resData});
                    }
                });
            }
        }
        // error finding the phone number
        else if (error) {
            res.json({'message': 'Error', 'error' : 'true', 'data' : 'null'});
        }
    }); 
});

module.exports = router;