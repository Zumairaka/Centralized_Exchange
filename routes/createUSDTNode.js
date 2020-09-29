const express = require('express');
const router = express.Router();
const {clientUSDTAccountModel} = require('../models/clientUSDTAccountModel');
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

                // check already created a node
                await clientUSDTAccountModel.findOne({_id: phoneData._id}, async function(error, accountData) {
                    // exists
                    if (accountData) {
                        res.json({'message' : 'Account already exists', 'error' : 'true', 'data' : accountData.address});
                    }
                    // does not exist
                    else if (!accountData) {
                        var keygenerator = await web3.eth.accounts.create(web3.utils.randomHex(32));

                        //var keystore = await web3.eth.accounts.encrypt(keygenerator.privateKey, pin);
                        //console.log(keystore);
        
                        var clientUSDTAccount = {_id: phoneData._id, privateKey: keygenerator.privateKey, address: keygenerator.address};
                        var clientUSDTAccountData = new clientUSDTAccountModel(clientUSDTAccount);
                        //console.log (clientUSDTAccountData);
        
                        // storing the account details
                        await clientUSDTAccountData.save((error, saveData) => {
                            if (error) {
                                res.json({'message': 'Error with Storing the ETH Account Data ', 'error' : 'true', 'data' : 'null'});
                            }
                            else if (saveData) {
                                var resData = {'userid' : saveData._id, 'address' : saveData.address};
                                res.json({'message': 'Wallet Stored Successfully', 'error' : 'false', 'data' : resData});                    }
                        });
                    }
                    else if (error) {
                        res.json({'message' : 'Error', 'error' : 'true', 'data' : 'null'});
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