const express = require('express');
const { default: Web3 } = require('web3');
const router = express.Router();
const {clientAccountModel} = require('../models/clientAccountModel');
const {registerModel} = require('../models/registerModel');

// router for tranferring the currency
router.post('/', async function(req, res, next) {
    res.render('transfer', {phone: req.body.phone});
});

// Amount transfer
router.post('/send', async function (req, res, next) {
    pin = req.body.pin;
    phone = req.body.phone;
    amount = req.body.amount;
    //console.log(phone);
    //console.log(pin);

    // retrieving the pin
    await registerModel.findOne({phone: phone}, async (error, regData) => {
        //console.log(regData);
        if (pin != regData.pin) {
            res.send('Wrong pin');
        }
        else if(!regData) {
            res.send('Phone number is not registered one');
        }
        else if (pin == regData.pin) {
            // retrieve the keys for the client
            await clientAccountModel.findOne({phone: phone}, async (error, accountData) => {
                //console.log(accountData);

                if (!accountData) {
                    res.send('No wallet created for this client');
                }
                else {
                // tranfer the amount using contract
                    await web3.eth.getAccounts().then( async (accounts) => {
                    
                        console.log(accounts);
                        await contract.methods.fundTransfer(accountData.address)
                            .send({ from: accounts[0], gas: 600000, value: web3.utils.toWei(amount, 'ether')})
                            .on('transactionHash', async (hash) => {

                                // update database
                                await clientAccountModel.findOneAndUpdate({phone: phone}, {balance : accountData.balance + amount}, (error, saveData) => {
                                    if (error) {
                                        res.send(error);
                                    }
                                    else {
                                        res.send('Transfer Successful');
                                    }
                                });
                            }).on((error) => {
                                res.send(error.message);
                        });
                    });
                }
            });
        }
    }); 
});


// router for balance
router.post('/balance', async function(req, res, next) {
    var phone = req.body.phone;
    console.log(phone);

    // retrieve the account details
    await clientAccountModel.findOne({phone: phone}, async (error, accountData) => {
        console.log(accountData);
        if (!accountData) {
            res.send('Wallet does not exist');
        }
        else {
                res.send('Balance is: ' + accountData.balance);
        }
    });

});

module.exports = router;