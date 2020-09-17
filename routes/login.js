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

                    // login successful
                    if (updateData) {
                        //console.log(updateData);
                        var resData = {'userid' : updateData._id, 'phone' : updateData.phone, 'token' : updateData.token};
                        res.json({'message' : 'Login Successful', 'error' : 'false', 'data' : resData});
                    }
                    else if (error) {
                        res.json({'message' : 'Token Updation Failed', 'error': 'true', 'data' : 'null'});
                    }
                });
            }
            else {
                res.json({'message' : 'Pin does not match', 'error' : 'true', 'data' : 'null'});
            }
        }
        else if (!phoneData) {
            res.json({'message' : 'Phone number does not exist', 'error' : 'true', 'data' : 'null'});
        }
        else if (error) {
            res.json({'message' : 'Error', 'error' : 'true', 'data' : 'null'});  
        }
    });
});

module.exports = router;