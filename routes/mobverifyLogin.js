const experss = require('express');
const router = experss.Router();

// Otp generation at login
router.post('/', function (req, res, next) {
    var phone = req.body.phone;
    console.log(phone);
    res.render('mobVerificationLogin', {phone: phone});
});

module.exports = router;