const express = require('express');
const router = express.Router();
const {registerModel} = require('../models/registerModel');


//registration router
router.post('/', async function(req, res, next) {
    var data = req.body;
    console.log(data);
    var regData = { phone: data.phone, fname: data.fname, lname: data.lname, email: data.email, pin: data.pin };
    var clientData = new registerModel(regData);
    await clientData.save((error, data) => {
        if(error) {
            res.json({'Status': 'Error'});
            throw error;
        }
        else {
            res.render('mobVerification', {phone: data.phone});
        }
    });
});

//update number page router
router.get('/updateNumber/:phoneOld', function(req, res, next) {
    phone = req.params.phoneOld;
    res.render('updateNumber', {phone: phone});
});

//saving updated number
router.post('/saveUpdatedNumber', async function(req, res, next) {

    await registerModel.findOneAndUpdate({phone: req.body.oldphone}, {phone: req.body.phone}, (error, data) => {
        if (error) {
            res.json({'Status': 'Error'});
        }
        else {
            res.render('mobVerification', {phone: req.body.phone});
        }
    });
});

module.exports = router;