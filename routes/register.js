var express = require('express');
var router = express.Router();
const {registerModel} = require('../models/registerModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');


//registration router
router.post('/', async function(req, res, next) {
    var data = req.body;
    console.log(data);

    // phone verification before storing the details
    await registerModel.findOne({phone: data.phone}, async function(error, phoneData) {

        // phone does not exist
        if (!phoneData) {

            // email verification before storing the data
            await registerModel.findOne({email: data.email}, async function(error, emailData) {
                
                //email does not exist
                if (!emailData) {
                    
                    // jwt token
                    var user = {phone: data.phone, pin: data.pin, email: data.email};
                    var key = crypto.randomBytes(64).toString('hex');
                    var jwtToken = jwt.sign(user, key);
                    console.log(jwtToken);

                    // storing the data as new client
                    var regData = { phone: data.phone, fname: data.fname, lname: data.lname, email: data.email, pin: data.pin, token: jwtToken };
                    var clientData = new registerModel(regData);
                    await clientData.save((error, storeData) => {
                        if(error) {
                            res.json({'message' : 'Error With Registration', 'error' : 'true', 'data' : 'null'});
                            throw error;
                        }
                        // successful
                        else {
                            //console.log(storeData);
                            var resData = {'userid': storeData._id, 'phone' : storeData.phone, 'token' : storeData.token};
                            res.json({'message' : 'Successfully Registered', 'error' : 'false', 'data' : resData});
                        }
                    });
                }
                // email exists
                else if (emailData) {
                    res.json({'message' : 'Email Already Exists', 'error' : 'true', 'data' : 'null'});
                }
                else {
                    res.json({'message' : 'Error With Registration', 'error' : 'true', 'data' : 'null'});
                }
            });
            
        }
        // phone exists
        else if (phoneData) {
            res.json({'message' : 'Phone Number Already Exists', 'error' : 'true', 'data' : 'null'});
        }
        else {
            res.json({'message' : 'Error With Registration', 'error' : 'true', 'data' : 'null'});
        } 
    });
});

module.exports = router;
