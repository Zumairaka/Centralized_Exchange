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
var loginRouter = require('./routes/login');
var createBTCNodeRouter = require('./routes/createBTCNode');
var createETHNodeRouter = require('./routes/createETHNode');
var clientCurrencyRouter = require('./routes/clientCurrency');

var app = express();

//set up mongo connection
mongoose.connect('mongodb://localhost:27017/FYNZON');
//mongoose.connect("mongodb+srv://Zumairaka:parveen00@cluster0-rops0.mongodb.net/FYNZON?retryWrites=true&w=majority");
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
app.use('/login', loginRouter);
app.use('/createBTCNode', createBTCNodeRouter);
app.use('/createETHNode', createETHNodeRouter);
app.use('/clientCurrency', clientCurrencyRouter);

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
