var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var createError = require('http-errors');
var Web3 = require('web3');
var mongoose = require('mongoose');

// web3 connection
web3 = new Web3( new Web3.providers.HttpProvider('http://localhost:8545'));
const MyContractJson = require(path.join(__dirname, '/Truffle/build/contracts/FundTransfer.json'));
const contractAddress = MyContractJson.networks['5777'].address;
const abi = MyContractJson.abi;

contract = new web3.eth.Contract(abi, contractAddress);

// routers
var registerRouter = require('./routes/register');
var mobverifiedRouter = require('./routes/mobverified');
var mobverifyRouter = require('./routes/mobverify');
var loginRouter = require('./routes/login');
var createNodeRouter = require('./routes/createNode');
var mobverifiedLoginRouter = require('./routes/mobverifiedLogin');
var mobverifyLoginRouter = require('./routes/mobverifyLogin');
var transferRouter = require('./routes/transfer');

var app = express();

//set up mongo connection
mongoose.connect('mongodb://localhost:27017/FYNZON');
mongoose.set('useFindAndModify', false);
var db=mongoose.connection;
db.on('error',(error)=>{
    console.log(error);
});
db.once('open',()=>{
    console.log("Success");
});

// setup view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//routers
app.use('/register', registerRouter);
app.use('/mobverified', mobverifiedRouter);
app.use('/mobverify', mobverifyRouter);
app.use('/login', loginRouter);
app.use('/createNode', createNodeRouter);
app.use('/mobverifiedLogin', mobverifiedLoginRouter);
app.use('/mobverifyLogin', mobverifyLoginRouter);
app.use('/transfer', transferRouter);

// error handler
app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
