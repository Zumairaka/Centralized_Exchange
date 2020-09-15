const express = require('express');
const router = express.Router();
const {registerModel} = require('../models/registerModel');

// login router
router.get('/', function(req, res, next) {
    res.render('login');
});

// login pin verification router
router.post('/pinVerification', async function(req, res, next) {

    var pin = req.body.pin;
    var phone = req.body.phone;

    // retrieving the registered pin
    await registerModel.findOne({phone: phone}, async (error, data) => {

        console.log(data);
        if (pin == data.pin) {
            res.render('home', {phone: phone, fname: data.fname, lname: data.lname});
        }
        else {
            res.render('pinVerification', {phone: phone});
        }
    })
});

module.exports = router;