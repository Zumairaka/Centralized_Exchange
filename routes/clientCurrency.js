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
            res.json({'Status': 'Phone number is not registered one'});
        }
        // phone number registered
        else if (phoneData) {
            // pin does not match
            if (pin != phoneData.pin) {
                res.json({'Status': 'Wrong pin'});
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
                        res.json({'Status': 'Error with Updating Balance'});
                    }
                    else if (saveData) {
                        res.json({'Status': 'Balance Updated Successfully'});
                    }
                });
            }
        }
        // error finding the phone number
        else if (error) {
            res.json({'Status': 'Error'});
        }
    }); 
});

module.exports = router;