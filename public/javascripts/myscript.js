
// regular expression for email
var email_reg = /\S+@\S+\.\S+/;
// regular expression for number
var num_reg = /^[0-9]+$/;

// register validation
function registerValidation(form) {

    if (num_reg.test(form.phone.value) == false || form.phone.value.length != 10) {
        alert('Please enter a valid 10 digit phone number');
        return false;
    }
    else if (form.fname.value == '') {
        alert('Please enter a first name');
        return false;
    }
    else if (form.lname.value == '') {
        alert('Please enter a last name');
        return false;
    }
    else if (email_reg.test(form.email.value) == false)
    {
        alert("Please enter a valid email!");
        return false;
    }
    else if (form.pin.value.length != 4 || num_reg.test(form.pin.value) == false) {
        alert('Please enter 4 digit pin');
        return false;
    }
    else if (form.cpin.value != form.pin.value) 
    {
        alert("Pin and confirm pin does not match");
        return false
    }
}

// otp validation
function otpValidation(form) {
    if (form.otp.value.length != 6 || num_reg.test(form.otp.value) == false ) {
        alert(' Please Enter a valid 6 digit otp');
        return false;
    }
}

// phone number validation
function numberValidation(form) {
    if (form.phone.value.length != 10 || num_reg.test(form.phone.value) == false ) {
        alert('Please Enter a valid 10 digit phone number');
        return false;
    }
}

// pin number validation
function pinValidation(form) {
    if (num_reg.test(form.pin.value) == false || form.pin.value.length != 4) {
        alert(' Please enter a valid 4 digit pin');
        return false;
    }
}
