const express = require('express');
const router = express.Router();
const {clientAccountModel} = require('../models/clientAccountModel');
const {registerModel} = require('../models/registerModel');

// creating wallet for the client
router.post('/', async function(req, res, next) {
    pin = req.body.pin;
    phone = req.body.phone;
    //console.log(phone);
    //console.log(pin);

    // retrieving the pin
    await registerModel.findOne({phone: phone}, async (error, data) => {
        console.log(data);
        if (pin != data.pin) {
            res.send('Wrong pin');
        }
        else if(!data) {
            res.send('Phone number is not registered one');
        }
        else if (pin == data.pin) {
            var keygenerator = await web3.eth.accounts.create(web3.utils.randomHex(32));

            //var keystore = await web3.eth.accounts.encrypt(keygenerator.privateKey, pin);
            //console.log(keystore);

            var clientAccount = { phone: phone, privateKey: keygenerator.privateKey, address: keygenerator.address, balance: 0 };
            var clientAccountData = new clientAccountModel(clientAccount);
            //console.log (clientAccountData);

            await clientAccountData.save((error, saveData) => {
                if (error) {
                    res.send('Error with Storing the wallet ');
                }
                else {
                    res.send('Wallet Stored Successfully');
                }
            });
        }
    }); 
});

module.exports = router;