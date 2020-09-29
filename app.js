var express = require('express');
var path = require('path');
const cors = require('cors');
const bodyparser = require('body-parser');
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
var clientBalanceRouter = require('./routes/clientBalance');
var updateBalanceRouter = require('./routes/updateBalance');
var getPeersRouter = require('./routes/getPeers');

var app = express();

//set up mongo connection
//mongoose.connect('mongodb://localhost:27017/FYNZON');
mongoose.connect("mongodb+srv://Zumairaka:parveen00@cluster0-rops0.mongodb.net/FYNZON?retryWrites=true&w=majority");
mongoose.set('useFindAndModify', false);
var db=mongoose.connection;
db.on('error',(error)=>{
    console.log(error);
});
db.once('open',()=>{
    console.log("Success");
});

app.use(express.static(path.join(__dirname,"/public")));
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({     // to support URL-encoded bodies
    extended: true
  }));

//routers
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/createBTCNode', createBTCNodeRouter);
app.use('/createETHNode', createETHNodeRouter);
app.use('/clientBalance', clientBalanceRouter);
app.use('/updateBalance', updateBalanceRouter);
app.use('/getPeers', getPeersRouter);


app.listen(process.env.PORT || 3000,function(){
    console.log("Listeing to Port: 3000");
});
