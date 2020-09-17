const express = require('express');
const router = express.Router();
const {clientBTCAccountModel} = require('../models/clientBTCAccountModel');
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
                var keygenerator = await web3.eth.accounts.create(web3.utils.randomHex(32));

                //var keystore = await web3.eth.accounts.encrypt(keygenerator.privateKey, pin);
                //console.log(keystore);

                var clientBTCAccount = {_id: phoneData._id, privateKey: keygenerator.privateKey, address: keygenerator.address};
                var clientBTCAccountData = new clientBTCAccountModel(clientBTCAccount);
                console.log (clientBTCAccountData);

                // storing the account details
                await clientBTCAccountData.save((error, saveData) => {
                    if (error) {
                        res.json({'message': 'Error with Storing the BTC Account Data ', 'error' : 'true', 'data' : 'null'});
                    }
                    else if (saveData) {
                        var resData = {'userid' : saveData._id, 'address' : saveData.address};
                        res.json({'message': 'Wallet Stored Successfully', 'error' : 'false', 'data' : resData});
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