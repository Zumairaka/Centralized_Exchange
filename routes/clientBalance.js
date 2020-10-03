const express = require('express');
const router = express.Router();
const {clientBalanceModel} = require('../models/clientBalanceModel');
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
                // initializing the balance
                var clientBalance = {_id: phoneData._id, BTCBalance: 0, ETHBalance: 0, USDTBalance: 0, INRBalance: 0, BCHBalance: 0, CRMTBalance: 0};
                var clientBalanceData = new clientBalanceModel(clientBalance);
                //console.log (clientCurrencyData);

                // storing the balance details
                await clientBalanceData.save((error, balanceData) => {
                    if (error) {
                        res.json({'message': 'Error with Updating Balance', 'error' : 'true', 'data' : 'null'});
                    }
                    else if (balanceData) {
                        res.json({'message': 'Balance Updated Successfully', 'error' : 'false', 'data' : balanceData});
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


// get Balance
router.post('/getBalance', async function(req, res, next) {
    var _id = req.body.userid;
    await clientBalanceModel.findOne({_id: _id}, async (error, balanceData) => {
        if (error) {
            res.json({'message' : 'Error', 'error' : 'true', 'data' : 'null'});
        }
        else if (balanceData) {
            res.json({'message' : 'Your Balance', 'error' : 'false', 'data' : balanceData});
        }
    });
});

module.exports = router;