const express = require('express');
const router = express.Router();

//opt verification router
router.post('/', function(req, res, next) {

    if (req.body.otp == '123456') {
        res.render('pinVerification', {phone: req.body.phoneNumber});
    }
    else {
        res.render('mobVerification', {phone: req.body.phoneNumber});
    }
});

module.exports = router;