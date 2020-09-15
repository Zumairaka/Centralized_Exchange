const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema( {
        phone: {
            type: Number,
            unique: true,
            required: true
        },
        fname: {
            type: String,
            required: true
        },
        lname: {
            type: String,
            required: true
        },
        email: {
            type: String,
            unique: true,
            required: true
        },
        pin: {
            type: String,
            required: true
        }
});

const registerModel = mongoose.model('client', registerSchema);
module.exports = {registerModel};