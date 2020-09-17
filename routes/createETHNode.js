const express = require('express');
const router = express.Router();
const {clientETHAccountModel} = require('../models/clientETHAccountModel');
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
                var keygenerator = await web3.eth.accounts.create(web3.utils.randomHex(32));

                //var keystore = await web3.eth.accounts.encrypt(keygenerator.privateKey, pin);
                //console.log(keystore);

                var clientETHAccount = {_id: phoneData._id, privateKey: keygenerator.privateKey, address: keygenerator.address};
                var clientETHAccountData = new clientETHAccountModel(clientETHAccount);
                //console.log (clientETHAccountData);

                // storing the account details
                await clientETHAccountData.save((error, saveData) => {
                    if (error) {
                        res.json({'Status': 'Error with Storing the ETH Account Data '});
                    }
                    else if (saveData) {
                        res.json({'Status': 'Wallet Stored Successfully'});
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