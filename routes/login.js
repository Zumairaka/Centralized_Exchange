const express = require('express');
const router = express.Router();
const {registerModel} = require('../models/registerModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// login router
router.post('/', async function(req, res, next) {
    var pin = req.body.pin;
    var phone = req.body.phone;

    // retrieving the registered pin
    await registerModel.findOne({phone: phone}, async(error, phoneData) => {
        console.log(phoneData);

        // phone number exists
        if (phoneData) {

            // pin matches
            if (phoneData.pin == pin) {

                // generate new token
                var key = crypto.randomBytes(64).toString('hex');
                var user = {phone: phone, pin: pin, email: phoneData.email};
                var jwtToken = jwt.sign(user, key);

                // replacing the token at the databse
                await registerModel.findOneAndUpdate({phone: phone}, {token: jwtToken}, async (error, updateData) => {

                    // updation successful
                    if (updateData) {
                        res.send('Phone number: ' + phoneData.phone + ' Token: ' + jwtToken);
                    }
                    else if (error) {
                        res.json({'Status' : 'Token Updation Failed'});
                    }
                });
            }
            else {
                res.json({'Status' : 'Pin does not match'});
            }
        }
        else if (!phoneData) {
            res.json({'Status' : 'Phone number does not exist'});
        }
        else if (error) {
            res.json({'Status' : 'Error'});  
        }
    });
});

module.exports = router;