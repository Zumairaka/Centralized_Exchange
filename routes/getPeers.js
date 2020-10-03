const express = require('express');
const router = express.Router();
const {orderBookModel} = require('../models/orderBookModel');
const {clientBalanceModel} = require('../models/clientBalanceModel');
const {orderHistoryModel} = require('../models/orderHistoryModel');

// peer transactions
router.post('/', async function(req, res, next) {

    var data = req.body;
    var time = data.time;
    var enoughBalance = false;
    var companyId = "5f6df0c27cc3a92a98dd057c";
    var companyTradeCurrencyBalance = 0;
    var companyBaseCurrencyBalance = 0;

    //time = Math.floor(time.getTime() / 1000);

    // retrieve actual balances of company
    await clientBalanceModel.findOne({_id: companyId}, async (error, companyBalance) => {
        if (error) {
            res.json({'message' : "Error fetching the company balance", 'error' : 'true', 'data' : 'null'});
        }
        else if (!companyBalance) {
            res.json({'message' : "No account for the company", 'error' : 'true', 'data' : 'null'});
        }
        else {
            // retrieve company base currency balance
            switch (data.baseCurrency) {
                case 'BTC': companyBaseCurrencyBalance = companyBalance.BTCBalance;                                                                                
                            break;
                case 'ETH': companyBaseCurrencyBalance = companyBalance.ETHBalance;                                                                                
                            break;  
                case 'BCH': companyBaseCurrencyBalance = companyBalance.BCHBalance;                                                                                
                            break; 
                case 'CRMT': companyBaseCurrencyBalance = companyBalance.CRMTBalance;                                                                                
                            break;
                case 'USDT': companyBaseCurrencyBalance = companyBalance.USDTBalance;                                                                                
                            break;  
                case 'INR': companyBaseCurrencyBalance = companyBalance.INRBalance;                                                                                
                            break;
            }

            // retrieve company trading currency balance
            switch (data.tradingCurrency) {
                case 'BTC': companyTradeCurrencyBalance = companyBalance.BTCBalance;                                                                                
                            break;
                case 'ETH': companyTradeCurrencyBalance = companyBalance.ETHBalance;                                                                                
                            break;  
                case 'BCH': companyTradeCurrencyBalance = companyBalance.BCHBalance;                                                                                
                            break; 
                case 'CRMT': companyTradeCurrencyBalance = companyBalance.CRMTBalance;                                                                                
                            break;
                case 'USDT': companyTradeCurrencyBalance = companyBalance.USDTBalance;                                                                                
                            break;  
                case 'INR': companyTradeCurrencyBalance = companyBalance.INRBalance;                                                                                
                            break;
            }
           
    
    // search the order book for matching the trade requirements
    // Maker:- base currency BTC and trade currency ETH
    if (data.purpose == 'sell') {

        // order book data of maker
        var makerData = {_id: data.userid, baseCurrency: data.baseCurrency, tradingCurrency: data.tradingCurrency, purpose: data.purpose, volume: data.volume,
            price: data.price, time: time, flag: 'true'};
                
                // checking the seller balance for trade
                await clientBalanceModel.findOne({_id: data.userid}, async (error, makerBalance) => {
                    if (error) {
                        res.json({'message' : 'Error retrieving the balance.', 'error' : 'true', 'data' : 'null'});
                    }
                    // balance retrieved
                    else if (makerBalance) {
                        // check enough balance or not 

                        // identify trade currency
                        switch (data.tradingCurrency) {
                            case 'BTC': if (makerBalance.BTCBalance >= makerData.volume) {
                                            enoughBalance = true;
                                            var makerTradeCurrencyBalance = makerBalance.BTCBalance;
                                        }
                                        break;
                            case 'ETH': if (makerBalance.ETHBalance >= makerData.volume) {
                                            enoughBalance = true;
                                            var makerTradeCurrencyBalance = makerBalance.ETHBalance;
                                        }
                                        break;  
                            case 'BCH': if (makerBalance.BCHBalance >= makerData.volume) {
                                            enoughBalance = true;
                                            var makerTradeCurrencyBalance = makerBalance.BCHBalance;
                                        }
                                        break; 
                            case 'CRMT': if (makerBalance.CRMTBalance >= makerData.volume) {
                                            enoughBalance = true;
                                            var makerTradeCurrencyBalance = makerBalance.CRMTBalance;
                                        }
                                        break;
                            case 'USDT': if (makerBalance.USDTBalance >= makerData.volume) {
                                            enoughBalance = true;
                                            var makerTradeCurrencyBalance = makerBalance.USDTBalance;
                                        }
                                        break;
                            case 'INR': if (makerBalance.INRBalance >= makerData.volume) {
                                            enoughBalance = true;
                                            var makerTradeCurrencyBalance = makerBalance.INRBalance;
                                        }
                                        break;
                        }
                        
                        // identify base currency
                        switch (data.baseCurrency) {
                            case 'BTC': var makerBaseCurrencyBalance = makerBalance.BTCBalance;                                                                                
                                        break;
                            case 'ETH': var makerBaseCurrencyBalance = makerBalance.ETHBalance;                                                                                
                                        break; 
                            case 'BCH': var makerBaseCurrencyBalance = makerBalance.BCHBalance;                                                                                
                                        break; 
                            case 'CRMT': var makerBaseCurrencyBalance = makerBalance.CRMTBalance;                                                                                
                                        break;
                            case 'USDT': var makerBaseCurrencyBalance = makerBalance.USDTBalance;                                                                                
                                        break;
                            case 'INR': var makerBaseCurrencyBalance = makerBalance.INRBalance;                                                                                
                                        break;
                        }

                        if (enoughBalance == false) {
                            res.json({'message' : 'Not enough BTC balance in your account, cannot proceed', 'error' : 'true', 'data' : 'null'});
                        }
                        // enough balance
                        else if (enoughBalance == true) {

                            // adding to order book
                            var makerDataValues = new orderBookModel(makerData);
                            await makerDataValues.save( async (error, saveData) => {
                                if (error) {
                                    res.json({'message': 'Error with saving data to order book', 'error' : 'true', 'data' : 'null'});
                                }
                                // saved
                                else {                        
                                
                                    // search for matching buy order
                                    await orderBookModel.find({baseCurrency: makerData.baseCurrency, tradingCurrency: makerData.tradingCurrency,
                                        purpose: 'buy', price: makerData.price, flag: 'true'}).sort({'time': 'asc'}).exec( async (error, takerData) => {
                                        if (error) {
                                            res.json({'message' : 'Error finding the match', 'error' : 'true', 'data' : 'null'});
                                        }
                                        // no matches
                                        else if (takerData == '') {
                                            res.json({'message' : 'No match found, saved to order book', 'error' : 'false', 'data' : saveData});
                                        }
                                        // match
                                        else{
                                            console.log(takerData);                                            
                                                
                                                // traverse through each match data
                                                step(0);
                                                async function step(i) {
                                                    if (i < takerData.length) {                                                    

                                                            // fetch balance of buyer
                                                            await clientBalanceModel.findOne({_id: takerData[i]._id}, async (error, takerBalance) => {
                                                                if (error) {
                                                                    // go to next buyer error fetching the balance of buyer
                                                                    step(++i); 
                                                                }
                                                                // buyer balance retreived
                                                                else if (takerBalance) {

                                                                    // retrieve taker base currency balance
                                                                    switch (data.baseCurrency) {
                                                                        case 'BTC': var takerBaseCurrencyBalance = takerBalance.BTCBalance;                                                                                
                                                                                    break;
                                                                        case 'ETH': var takerBaseCurrencyBalance = takerBalance.ETHBalance;                                                                                
                                                                                    break;  
                                                                        case 'BCH': var takerBaseCurrencyBalance = takerBalance.BCHBalance;                                                                                
                                                                                    break; 
                                                                        case 'CRMT': var takerBaseCurrencyBalance = takerBalance.CRMTBalance;                                                                                
                                                                                    break;
                                                                        case 'USDT': var takerBaseCurrencyBalance = takerBalance.USDTBalance;                                                                                
                                                                                    break;  
                                                                        case 'INR': var takerBaseCurrencyBalance = takerBalance.INRBalance;                                                                                
                                                                                    break;
                                                                    }

                                                                    // retrieve taker trading currency balance
                                                                    switch (data.tradingCurrency) {
                                                                        case 'BTC': var takerTradeCurrencyBalance = takerBalance.BTCBalance;                                                                                
                                                                                    break;
                                                                        case 'ETH': var takerTradeCurrencyBalance = takerBalance.ETHBalance;                                                                                
                                                                                    break;  
                                                                        case 'BCH': var takerTradeCurrencyBalance = takerBalance.BCHBalance;                                                                                
                                                                                    break; 
                                                                        case 'CRMT': var takerTradeCurrencyBalance = takerBalance.CRMTBalance;                                                                                
                                                                                    break;
                                                                        case 'USDT': var takerTradeCurrencyBalance = takerBalance.USDTBalance;                                                                                
                                                                                    break;  
                                                                        case 'INR': var takerTradeCurrencyBalance = takerBalance.INRBalance;                                                                                
                                                                                    break;
                                                                    }

                                                                

                                                                   
                                                                        

                                                                        // condition 1 maker taker equal volume
                                                                        if (makerData.volume == takerData[i].volume) {
                                                                            
                                                                            makerTradeCurrencyBalance = makerTradeCurrencyBalance - takerData[i].volume; 

                                                                            // update balance
                                                                            switch (data.tradingCurrency) {
                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                            break;
                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break;  
                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break; 
                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                            break;
                                                                                case 'USDT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break;
                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break;
                                                                            }
                                                                            // update balance of maker
                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerTradeCurrBalData) => {
                                                                                if (error) {
                                                                                    res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                }
                                                                                // successfully updated maker trade balance
                                                                                else if (makerTradeCurrBalData) { 

                                                                                    // calculate transaction fee from maker balance
                                                                                    var makerTransactionFee = ( makerData.volume * 1.5 ) / 100 ;
                                                                                    companyTradeCurrencyBalance += makerTransactionFee;
                                                                                    takerTradeCurrencyBalance += ( makerData.volume - makerTransactionFee );

                                                                                    // update balance taker
                                                                                    switch (data.tradingCurrency) {
                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                    break;
                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;  
                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break; 
                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                    break;
                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                    }
                                                                                    // update balance of taker
                                                                                    await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerTradeCurrBalData) => {
                                                                                        if (error) {
                                                                                            // error with updating taker data. Revert the maker balance and go to next buyer
                                                                                            makerTradeCurrencyBalance += makerData.volume;

                                                                                            // update balance
                                                                                            switch (data.tradingCurrency) {
                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                            break;
                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;  
                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break; 
                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                            break;
                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                            }

                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                if (error) {
                                                                                                    res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                }
                                                                                                else {
                                                                                                    companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                    step(++i);
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                        // successfully updated taker currency balance
                                                                                        else if (takerTradeCurrBalData) {

                                                                                            // update balance of company
                                                                                            switch (data.tradingCurrency) {
                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                            break;
                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break;  
                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break; 
                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                            break;
                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break;
                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break;
                                                                                            }
                                                                                            // update trade currency balance of company                                                                                            
                                                                                            await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                if (error) {
                                                                                                    // error with updating company trade currency balance. Revert maker and taker balances and go to next buyer
                                                                                                    makerTradeCurrencyBalance += makerData.volume;

                                                                                                    // update balance
                                                                                                    switch (data.tradingCurrency) {
                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                        if (error) {
                                                                                                            res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                        }
                                                                                                        else {
                                                                                                            // revert taker balance
                                                                                                            takerTradeCurrencyBalance -= ( makerData.volume - makerTransactionFee );
                                                                                                            // update balance taker
                                                                                                            switch (data.tradingCurrency) {
                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }

                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                if (error) {
                                                                                                                    res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                }
                                                                                                                else {
                                                                                                                    companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                    step(++i);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                // successfully updated compnay trade currency balance
                                                                                                else if (companyTradeCurrBalData) {

                                                                                                    // transaction fee from taker balance
                                                                                                    var takerTransactionFee = ( takerData[i].price * takerData[i].volume  * 1.5 ) / 100;
                                                                                                    companyBaseCurrencyBalance += takerTransactionFee;
                                                                                                    
                                                                                                    // update base currency balance of maker
                                                                                                    makerBaseCurrencyBalance += (( takerData[i].volume * takerData[i].price) - takerTransactionFee);

                                                                                                    // update balance
                                                                                                    switch (data.baseCurrency) {
                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerBaseCurrBalData) => {
                                                                                                        if (error) {
                                                                                                            // error with updating company maker base currency balance. Revert maker, taker and company trade currency balances and try after sometime
                                                                                                            makerTradeCurrencyBalance += makerData.volume; 
                                                                                                            // update balance
                                                                                                            switch (data.tradingCurrency) {
                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }

                                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                if (error) {
                                                                                                                    res.json({'message' : 'Error with reverting trade balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                }
                                                                                                                else {
                                                                                                                    // revert taker balance
                                                                                                                    takerTradeCurrencyBalance -= ( makerData.volume - makerTransactionFee );
                                                                                                                    // update balance taker
                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
                                                                                                                    await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            // revert company maker transaction fee
                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                            // update balance of company
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting company trade currency balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    res.json({'message' : 'Error with updating maker base currency balance, transaction reverted, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                }
                                                                                                                            });

                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                        // successfully updated maker ETH balance
                                                                                                        else if (makerBaseCurrBalData) {
                                                                                                            // update taker ETH balance
                                                                                                            takerBaseCurrencyBalance -= (takerData[i].volume * takerData[i].price);

                                                                                                            // update balance taker
                                                                                                            switch (data.baseCurrency) {
                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerBaseCurrBalData) => {
                                                                                                                if (error) {
                                                                                                                    // revert maker, taker, company trade currency balances and base currency balance of maker and go to next buyer
                                                                                                                    makerTradeCurrencyBalance += makerData.volume; 
                                                                                                                     // update balance
                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }                                                                                                          
                                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            // revert taker balance
                                                                                                                            takerTradeCurrencyBalance -= ( makerData.volume - makerTransactionFee );
                                                                                                                            // update balance taker
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert company maker transaction fee
                                                                                                                                    companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                    // update balance of company
                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting company BTC balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert maker base currency balance
                                                                                                                                            makerBaseCurrencyBalance -= (( takerData[i].volume * takerData[i].price) - takerTransactionFee);
                                                                                                                                            // update balance
                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting maker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                                    step(++i);
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
        
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                                //successfully updated taker base currency balance
                                                                                                                else if (takerBaseCurrBalData) {
                                                                                                                    // update balance of company
                                                                                                                    switch (data.baseCurrency) {
                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
                                                                                                                    // update company base currency balance data
                                                                                                                    await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyBaseCurrBalData) => {
                                                                                                                        if (error) {
                                                                                                                            // revert maker, taker, company trade currency balances and maker, taker base currency balance and go to next buyer
                                                                                                                            makerTradeCurrencyBalance += makerData.volume;
                                                                                                                            // update balance
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting trade currency balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert taker balance
                                                                                                                                    takerTradeCurrencyBalance -= ( makerData.volume - makerTransactionFee );
                                                                                                                                    // update balance taker
                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting trade currency balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert company maker transaction fee
                                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                            // update balance of company
                                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting company BTC balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    // revert maker ETH balance
                                                                                                                                                    makerBaseCurrencyBalance -= (( takerData[i].volume * takerData[i].price) - takerTransactionFee);
                                                                                                                                                    // update balance
                                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                    break;
                                                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;  
                                                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break; 
                                                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                    }
                                                                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            res.json({'message' : 'Error with reverting maker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            // revert taker base currency balance
                                                                                                                                                            takerBaseCurrencyBalance += (takerData[i].volume * takerData[i].price);
                                                                                                                                                            // update balance taker
                                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                            break;
                                                                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break;  
                                                                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break; 
                                                                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                            }
                                                                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, tkaerUpETHBalData) => {
                                                                                                                                                                if (error) {
                                                                                                                                                                    res.json({'message' : 'Error with reverting taker base currency balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                                }
                                                                                                                                                                else {
                                                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                                                    step(++i);
                                                                                                                                                                }
                                                                                                                                                            });                                                                                                                                                            
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            });        
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                        // successfully updated company base currency balance
                                                                                                                        else if (companyBaseCurrBalData) {
                                                                                                                            // all balances successfully updated in the database now start updating order history
                                                                                                                            // update order book of maker
                                                                                                                            await orderBookModel.findOneAndUpdate({_id:makerData._id}, {flag: 'false'}, async (error, makerObData) => {
                                                                                                                                if (error) {
                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                    res.json({'message' : 'Transfer successful, Error updating the order book of maker', 'error' : 'true', 'data' : transferData});
                                                                                                                                }
                                                                                                                                // successfully updated order book of maker
                                                                                                                                else {
                                                                                                                                    // update order book of taker
                                                                                                                                    await orderBookModel.findOneAndUpdate({_id: takerData[i]._id}, {flag: 'false'}, async (error, takerObData) => {
                                                                                                                                        if (error) {
                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                            res.json({'message' : 'Transfer Successful, Error updating the order book of taker', 'error' : 'true', 'data' : transferData});
                                                                                                                                        }
                                                                                                                                        // successfully updated order book of taker
                                                                                                                                        else {
                                                                                                                                            // update order history
                                                                                                                                            var orderHistoryData = {makerId: makerData._id, takerId: takerData[i]._id, baseCurrency: makerData.baseCurrency, 
                                                                                                                                                tradingCurrency: makerData.tradingCurrency, purpose: makerData.purpose, volume: makerData.volume, 
                                                                                                                                                price: makerData.price, time: makerData.time, flag: 'false'};
                                                                                                                
                                                                                                                                            orderHistoryData = new orderHistoryModel(orderHistoryData);                                                                        
                                                                                                                                            await orderHistoryData.save( async (error, odHistoryData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                                    res.json({'message' : 'Transaction successful, Error with saving order history', 'error' : 'true', 'data' : transferData});
                                                                                                                                                }
                                                                                                                                                // successfully updated order history
                                                                                                                                                else {
                                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData, orderHistory: odHistoryData};
                                                                                                                                                    res.json({'message' : 'Transfer Successful, Successfully updated all the reports', 'error' : 'false', 'data' : transferData});
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                }
                                                                            });                                                            
                                                                        }
                                                                        // condition 2 maker volume is greater than taker volume
                                                                        else if (makerData.volume > takerData[i].volume) {
                                                                            // update trade currency balance of maker
                                                                            makerTradeCurrencyBalance = makerTradeCurrencyBalance - takerData[i].volume;  
                                                                            // update balance
                                                                            switch (data.tradingCurrency) {
                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                            break;
                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break;  
                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break; 
                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                            break;
                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break;
                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break;
                                                                            }
                                                                            console.log(makerUpdateBalance);

                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerTradeCurrBalData) => {
                                                                                if (error) {
                                                                                    res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                }
                                                                                // successfully updated maker trade currency balance
                                                                                else if (makerTradeCurrBalData) { 

                                                                                    // calculate transaction fee from maker balance
                                                                                    var makerTransactionFee = ( takerData[i].volume * 1.5 ) / 100 ;
                                                                                    companyTradeCurrencyBalance += makerTransactionFee;
                                                                                    takerTradeCurrencyBalance += ( takerData[i].volume - makerTransactionFee );

                                                                                    // update balance taker
                                                                                    switch (data.tradingCurrency) {
                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                    break;
                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;  
                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break; 
                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                    break;
                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                    }
                                                                                    console.log(takerUpdateBalance);
                                                                                    // update trade currency balance of taker
                                                                                    await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerTradeCurrBalData) => {
                                                                                        if (error) {
                                                                                            // error with updating taker data. Revert the maker balance and go to next buyer
                                                                                            makerTradeCurrencyBalance += takerData[i].volume;
                                                                                            // update balance
                                                                                            switch (data.tradingCurrency) {
                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                            break;
                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;  
                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break; 
                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                            break;
                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                            }

                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                if (error) {
                                                                                                    res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                }
                                                                                                else {
                                                                                                    companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                    step(++i);
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                        // successfully updated taker BTC balance
                                                                                        else if (takerTradeCurrBalData) {
                                                                                            // update balance of company
                                                                                            switch (data.tradingCurrency) {
                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                            break;
                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break;  
                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break; 
                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                            break;
                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break;
                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break;
                                                                                            }
                                                                                            console.log(companyUpdateBalance);
                                                                                            await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                if (error) {
                                                                                                    // error with updating company BTC balance. Revert maker and taker balances and go to next buyer
                                                                                                    makerTradeCurrencyBalance += takerData[i].volume;
                                                                                                    // update balance
                                                                                                    switch (data.tradingCurrency) {
                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                        if (error) {
                                                                                                            res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                        }
                                                                                                        else {
                                                                                                            // revert taker balance                                                                                                            
                                                                                                            takerTradeCurrencyBalance -= ( takerData[i].volume - makerTransactionFee );
                                                                                                            // update balance taker
                                                                                                            switch (data.tradingCurrency) {
                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                if (error) {
                                                                                                                    res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                }
                                                                                                                else {
                                                                                                                    companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                    step(++i);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                // successfully updated compnay trade currency balance
                                                                                                else if (companyTradeCurrBalData) {

                                                                                                    // transaction fee from taker balance
                                                                                                    var takerTransactionFee = ( takerData[i].price * takerData[i].volume  * 1.5 ) / 100;
                                                                                                    companyBaseCurrencyBalance += takerTransactionFee;
                                                                                                    
                                                                                                    // update base currency balance of maker
                                                                                                    makerBaseCurrencyBalance += (( takerData[i].volume * takerData[i].price) - takerTransactionFee);
                                                                                                    // update balance
                                                                                                    switch (data.baseCurrency) {
                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
                                                                                                    console.log(makerUpdateBalance);

                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerBaseCurrBalData) => {
                                                                                                        if (error) {
                                                                                                            // error with updating company maker ETH balance. Revert maker, taker and company BTC balances and try after sometime
                                                                                                            makerTradeCurrencyBalance += takerData[i].volume; 
                                                                                                             // update balance
                                                                                                             switch (data.tradingCurrency) {
                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }                                                                                                          
                                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                if (error) {
                                                                                                                    res.json({'message' : 'Error with reverting BTC balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                }
                                                                                                                else {
                                                                                                                    // revert taker balance
                                                                                                                    takerTradeCurrencyBalance -= ( takerData[i].volume - makerTransactionFee );
                                                                                                                    // update balance taker
                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
                                                                                                                    await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            // revert company maker transaction fee
                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                            // update balance of company
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting company BTC balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    res.json({'message' : 'Error with updating maker ETH balance, transaction reverted, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                }
                                                                                                                            });

                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                        // successfully updated maker ETH balance
                                                                                                        else if (makerBaseCurrBalData) {
                                                                                                            // update taker ETH balance
                                                                                                            takerBaseCurrencyBalance -= (takerData[i].volume * takerData[i].price);
                                                                                                            // update balance taker
                                                                                                            switch (data.baseCurrency) {
                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            console.log(takerUpdateBalance);

                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerBaseCurrBalData) => {
                                                                                                                if (error) {
                                                                                                                    // revert maker, taker, company BTC balances and ETH balance maker and go to next buyer
                                                                                                                    makerTradeCurrencyBalance += takerData[i].volume;   
                                                                                                                    // update balance
                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }                                                                                                          
                                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            // revert taker balance
                                                                                                                            takerTradeCurrencyBalance -= ( takerData[i].volume - makerTransactionFee );
                                                                                                                            // update balance taker
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert company maker transaction fee
                                                                                                                                    companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                    // update balance of company
                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting company BTC balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert maker ETH balance
                                                                                                                                            makerBaseCurrencyBalance -= (( takerData[i].volume * takerData[i].price) - takerTransactionFee);
                                                                                                                                            // update balance
                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting maker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                                    step(++i);
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
        
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                                //successfully updated taker ETH balance
                                                                                                                else if (takerBaseCurrBalData) {
                                                                                                                    // update balance of company
                                                                                                                    switch (data.baseCurrency) {
                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
                                                                                                                    console.log(companyUpdateBalance);
                                                                                                                    // update company ETH balance data
                                                                                                                    await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyBaseCurrBalData) => {
                                                                                                                        if (error) {
                                                                                                                            // revert maker, taker, company BTC balances and maker, taker ETH balance and go to next buyer
                                                                                                                            makerTradeCurrencyBalance += takerData[i].volume; 
                                                                                                                            // update balance
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }                                                                                                            
                                                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting BTC balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert taker balance
                                                                                                                                    takerTradeCurrencyBalance -= ( takerData[i].volume - makerTransactionFee );
                                                                                                                                    // update balance taker
                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert company maker transaction fee
                                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                            // update balance of company
                                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting company BTC balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    // revert maker ETH balance
                                                                                                                                                    makerBaseCurrencyBalance -= (( takerData[i].volume * takerData[i].price) - takerTransactionFee);
                                                                                                                                                    // update balance
                                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                    break;
                                                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;  
                                                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break; 
                                                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                    }
                                                                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            res.json({'message' : 'Error with reverting maker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            // revert taker ETH balance
                                                                                                                                                            takerBaseCurrencyBalance += (takerData[i].volume * takerData[i].price);
                                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                            break;
                                                                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break;  
                                                                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break; 
                                                                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                            }
                                                                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, tkaerUpETHBalData) => {
                                                                                                                                                                if (error) {
                                                                                                                                                                    res.json({'message' : 'Error eith reverting taker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                                }
                                                                                                                                                                else {
                                                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                                                    step(++i);
                                                                                                                                                                }
                                                                                                                                                            });                                                                                                                                                            
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            });        
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                        // successfully updated company ETH balance
                                                                                                                        else if (companyBaseCurrBalData) {
                                                                                                                            // all balances successfully updated in the database now start updating order history
                                                                                                                            // update order book of maker
                                                                                                                            await orderBookModel.findOneAndUpdate({_id:makerData._id}, {volume: (makerData.volume - takerData[i].volume)}, async (error, makerObData) => {
                                                                                                                                if (error) {
                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                    res.json({'message' : 'Transfer successful, Error updating the order book of maker', 'error' : 'true', 'data' : transferData});
                                                                                                                                }
                                                                                                                                // successfully updated order book of maker
                                                                                                                                else {
                                                                                                                                    // update order book of taker
                                                                                                                                    await orderBookModel.findOneAndUpdate({_id: takerData[i]._id}, {flag: 'false'}, async (error, takerObData) => {
                                                                                                                                        if (error) {
                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                            res.json({'message' : 'Transfer Successful, Error updating the order book of taker', 'error' : 'true', 'data' : transferData});
                                                                                                                                        }
                                                                                                                                        // successfully updated order book of taker
                                                                                                                                        else {
                                                                                                                                            // update order history
                                                                                                                                            var orderHistoryData = {makerId: makerData._id, takerId: takerData[i]._id, baseCurrency: makerData.baseCurrency, 
                                                                                                                                                tradingCurrency: makerData.tradingCurrency, purpose: makerData.purpose, volume: takerData[i].volume, 
                                                                                                                                                price: makerData.price, time: makerData.time, flag: 'false'};
                                                                                                                
                                                                                                                                            orderHistoryData = new orderHistoryModel(orderHistoryData);                                                                        
                                                                                                                                            await orderHistoryData.save( async (error, odHistoryData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                                    res.json({'message' : 'Transaction successful, Error with saving order history', 'error' : 'true', 'data' : transferData});
                                                                                                                                                }
                                                                                                                                                // successfully updated order history
                                                                                                                                                else {
                                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData, orderHistory: odHistoryData};
                                                                                                                                                    res.json({'message' : 'Transfer Successful, Successfully updated all the reports', 'error' : 'false', 'data' : transferData});
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }); 
                                                                        }
                                                                        // condition 3 maker volume is less than taker volume
                                                                        else if (makerData.volume < takerData[i].volume) {
                                                                            // update BTC balance of maker
                                                                            makerTradeCurrencyBalance = makerTradeCurrencyBalance - makerData.volume;
                                                                            // update balance
                                                                            switch (data.tradingCurrency) {
                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                            break;
                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break;  
                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break; 
                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                            break;
                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break;
                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                            break;
                                                                            }   
                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerTradeCurrBalData) => {
                                                                                if (error) {
                                                                                    res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                }
                                                                                // successfully updated maker BTC balance
                                                                                else if (makerTradeCurrBalData) { 

                                                                                    // calculate transaction fee from maker balance
                                                                                    var makerTransactionFee = ( makerData.volume * 1.5 ) / 100 ;
                                                                                    companyTradeCurrencyBalance += makerTransactionFee;
                                                                                    takerTradeCurrencyBalance += ( makerData.volume - makerTransactionFee );

                                                                                    // update balance taker
                                                                                    switch (data.tradingCurrency) {
                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                    break;
                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;  
                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break; 
                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                    break;
                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                    }
                                                                                    // update BTC balance of taker
                                                                                    await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerTradeCurrBalData) => {
                                                                                        if (error) {
                                                                                            // error with updating taker data. Revert the maker balance and go to next buyer
                                                                                            makerTradeCurrencyBalance += makerData.volume;
                                                                                            // update balance
                                                                                            switch (data.tradingCurrency) {
                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                            break;
                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;  
                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break; 
                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                            break;
                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                            }
                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                if (error) {
                                                                                                    res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                }
                                                                                                else {
                                                                                                    companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                    step(++i);
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                        // successfully updated taker BTC balance
                                                                                        else if (takerTradeCurrBalData) {
                                                                                            // update balance of company
                                                                                            switch (data.tradingCurrency) {
                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                            break;
                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break;  
                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break; 
                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                            break;
                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break;
                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                            break;
                                                                                            }
                                                                                            // update BTC balance of company
                                                                                            await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                if (error) {
                                                                                                    // error with updating company BTC balance. Revert maker and taker balances and go to next buyer
                                                                                                    makerTradeCurrencyBalance += makerData.volume;
                                                                                                    // update balance
                                                                                                    switch (data.tradingCurrency) {
                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                        if (error) {
                                                                                                            res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                        }
                                                                                                        else {
                                                                                                            // revert taker balance
                                                                                                            takerTradeCurrencyBalance -= ( makerData.volume - makerTransactionFee );
                                                                                                            // update balance taker
                                                                                                            switch (data.tradingCurrency) {
                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                if (error) {
                                                                                                                    res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                }
                                                                                                                else {
                                                                                                                    companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                    step(++i);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                // successfully updated compnay BTC balance
                                                                                                else if (companyTradeCurrBalData) {

                                                                                                    // transaction fee from taker balance
                                                                                                    var takerTransactionFee = ( takerData[i].price * makerData.volume  * 1.5 ) / 100;
                                                                                                    companyBaseCurrencyBalance += takerTransactionFee;
                                                                                                    
                                                                                                    // update ETH balance of maker
                                                                                                    makerBaseCurrencyBalance += (( makerData.volume * takerData[i].price) - takerTransactionFee);
                                                                                                    // update balance
                                                                                                    switch (data.baseCurrency) {
                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerBaseCurrBalData) => {
                                                                                                        if (error) {
                                                                                                            // error with updating company maker ETH balance. Revert maker, taker and company BTC balances and try after sometime
                                                                                                            makerTradeCurrencyBalance += makerData.volume;
                                                                                                            // update balance
                                                                                                            switch (data.tradingCurrency) {
                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }                                                                                                           
                                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                if (error) {
                                                                                                                    res.json({'message' : 'Error with reverting BTC balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                }
                                                                                                                else {
                                                                                                                    // revert taker balance
                                                                                                                    takerTradeCurrencyBalance -= ( makerData.volume - makerTransactionFee );
                                                                                                                    // update balance taker
                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
                                                                                                                    await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            // revert company maker transaction fee
                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                            // update balance of company
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting company BTC balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    res.json({'message' : 'Error with updating maker ETH balance, transaction reverted, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                }
                                                                                                                            });

                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                        // successfully updated maker ETH balance
                                                                                                        else if (makerBaseCurrBalData) {
                                                                                                            // update taker ETH balance
                                                                                                            takerBaseCurrencyBalance -= (makerData.volume * takerData[i].price);
                                                                                                            switch (data.baseCurrency) {
                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerBaseCurrBalData) => {
                                                                                                                if (error) {
                                                                                                                    // revert maker, taker, company BTC balances and ETH balance maker and go to next buyer
                                                                                                                    makerTradeCurrencyBalance += makerData.volume;
                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }                                                                                                            
                                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            // revert taker balance
                                                                                                                            takerTradeCurrencyBalance -= ( makerData.volume - makerTransactionFee );
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert company maker transaction fee
                                                                                                                                    companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                    // update balance of company
                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting company BTC balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert maker ETH balance
                                                                                                                                            makerBaseCurrencyBalance -= (( makerData.volume * takerData[i].price) - takerTransactionFee);
                                                                                                                                            // update balance
                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting maker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                                    step(++i);
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
        
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                                //successfully updated taker ETH balance
                                                                                                                else if (takerBaseCurrBalData) {
                                                                                                                    // update balance of company
                                                                                                                    switch (data.baseCurrency) {
                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
                                                                                                                    // update company ETH balance data
                                                                                                                    await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyBaseCurrBalData) => {
                                                                                                                        if (error) {
                                                                                                                            // revert maker, taker, company BTC balances and maker, taker ETH balance and go to next buyer
                                                                                                                            makerTradeCurrencyBalance += makerData.volume; 
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }                                                                                                            
                                                                                                                            await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting BTC balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert taker balance
                                                                                                                                    takerTradeCurrencyBalance -= ( makerData.volume - makerTransactionFee );
                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert company maker transaction fee
                                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                            // update balance of company
                                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.update({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting company BTC balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    // revert maker ETH balance
                                                                                                                                                    makerBaseCurrencyBalance -= (( makerData.volume * takerData[i].price) - takerTransactionFee);
                                                                                                                                                    // update balance
                                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                    break;
                                                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;  
                                                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break; 
                                                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                    }
                                                                                                                                                    await clientBalanceModel.update({_id: makerData._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            res.json({'message' : 'Error with reverting maker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            // revert taker ETH balance
                                                                                                                                                            takerBaseCurrencyBalance += (makerData.volume * takerData[i].price);
                                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                            break;
                                                                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break;  
                                                                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break; 
                                                                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                            }
                                                                                                                                                            await clientBalanceModel.update({_id: takerData[i]._id}, {takerUpdateBalance}, async (error, tkaerUpETHBalData) => {
                                                                                                                                                                if (error) {
                                                                                                                                                                    res.json({'message' : 'Error eith reverting taker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                                }
                                                                                                                                                                else {
                                                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                                                    step(++i);
                                                                                                                                                                }
                                                                                                                                                            });                                                                                                                                                            
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            });        
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                        // successfully updated company ETH balance
                                                                                                                        else if (companyBaseCurrBalData) {
                                                                                                                            // all balances successfully updated in the database now start updating order history
                                                                                                                            // update order book of maker
                                                                                                                            await orderBookModel.findOneAndUpdate({_id:makerData._id}, {flag: 'false'}, async (error, makerObData) => {
                                                                                                                                if (error) {
                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                    res.json({'message' : 'Transfer successful, Error updating the order book of maker', 'error' : 'true', 'data' : transferData});
                                                                                                                                }
                                                                                                                                // successfully updated order book of maker
                                                                                                                                else {
                                                                                                                                    // update order book of taker
                                                                                                                                    await orderBookModel.findOneAndUpdate({_id: takerData[i]._id}, {volume: (takerData[i].volume - makerData.volume)}, async (error, takerObData) => {
                                                                                                                                        if (error) {
                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                            res.json({'message' : 'Transfer Successful, Error updating the order book of taker', 'error' : 'true', 'data' : transferData});
                                                                                                                                        }
                                                                                                                                        // successfully updated order book of taker
                                                                                                                                        else {
                                                                                                                                            // update order history
                                                                                                                                            var orderHistoryData = {makerId: makerData._id, takerId: takerData[i]._id, baseCurrency: makerData.baseCurrency, 
                                                                                                                                                tradingCurrency: makerData.tradingCurrency, purpose: makerData.purpose, volume: makerData.volume, 
                                                                                                                                                price: makerData.price, time: makerData.time, flag: 'false'};
                                                                                                                
                                                                                                                                            orderHistoryData = new orderHistoryModel(orderHistoryData);                                                                        
                                                                                                                                            await orderHistoryData.save( async (error, odHistoryData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                                    res.json({'message' : 'Transaction successful, Error with saving order history', 'error' : 'true', 'data' : transferData});
                                                                                                                                                }
                                                                                                                                                // successfully updated order history
                                                                                                                                                else {
                                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData, orderHistory: odHistoryData};
                                                                                                                                                    res.json({'message' : 'Transfer Successful, Successfully updated all the reports', 'error' : 'false', 'data' : transferData});
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                }
                                                                            });                                                            
                                                                        }
                                                                    
                                                                }   
                                                            
                                                        
                                                    });
                                                }
                                            }
                                            
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }

            // taker data
            else if (data.purpose == 'buy') {

                // order book data of taker
                var takerData = {_id: data.userid, baseCurrency: data.baseCurrency, tradingCurrency: data.tradingCurrency, purpose: data.purpose, volume: data.volume,
                    price: data.price, time: time, flag: 'true'};
                        
                        // checking the seller balance for trade
                        await clientBalanceModel.findOne({_id: data.userid}, async (error, takerBalance) => {
                            if (error) {
                                res.json({'message' : 'Error retrieving the balance.', 'error' : 'true', 'data' : 'null'});
                            }
                            // balance retrieved
                            else if (takerBalance) {
                                // check enough balance or not 
        
                                // identify base currency
                                switch (data.baseCurrency) {
                                    case 'BTC': if (takerBalance.BTCBalance >= (takerData.volume * takerData.price)) {
                                                    enoughBalance = true;
                                                    var takerBaseCurrencyBalance = takerBalance.BTCBalance;
                                                }
                                                break;
                                    case 'ETH': if (takerBalance.ETHBalance >= (takerData.volume * takerData.price)) {
                                                    enoughBalance = true;
                                                    var takerBaseCurrencyBalance = takerBalance.ETHBalance;
                                                }
                                                break;  
                                    case 'BCH': if (takerBalance.BCHBalance >= (takerData.volume * takerData.price)) {
                                                    enoughBalance = true;
                                                    var takerBaseCurrencyBalance = takerBalance.BCHBalance;
                                                }
                                                break; 
                                    case 'CRMT': if (takerBalance.CRMTBalance >= (takerData.volume * takerData.price)) {
                                                    enoughBalance = true;
                                                    var takerBaseCurrencyBalance = takerBalance.CRMTBalance;
                                                }
                                                break;
                                    case 'USDT': if (takerBalance.USDTBalance >= (takerData.volume * takerData.price)) {
                                                    enoughBalance = true;
                                                    var takerBaseCurrencyBalance = takerBalance.USDTBalance;
                                                }
                                                break;
                                    case 'INR': if (takerBalance.INRBalance >= (takerData.volume * takerData.price)) {
                                                    enoughBalance = true;
                                                    var takerBaseCurrencyBalance = takerBalance.INRBalance;
                                                }
                                                break;
                                }
                                
                                // identify trade currency
                                switch (data.tradingCurrency) {
                                    case 'BTC': var takerTradeCurrencyBalance = takerBalance.BTCBalance;                                                                                
                                                break;
                                    case 'ETH': var takerTradeCurrencyBalance = takerBalance.ETHBalance;                                                                                
                                                break;  
                                    case 'BCH': var takerTradeCurrencyBalance = takerBalance.BCHBalance;                                                                                
                                                break; 
                                    case 'CRMT': var takerTradeCurrencyBalance = takerBalance.CRMTBalance;                                                                                
                                                break;
                                    case 'USDT': var takerTradeCurrencyBalance = takerBalance.USDTBalance;                                                                                
                                                break;  
                                    case 'INR': var takerTradeCurrencyBalance = takerBalance.INRBalance;                                                                                
                                                break;
                                }
        
                                if (enoughBalance == false) {
                                    res.json({'message' : 'Not enough Base Currency balance in your account, cannot proceed', 'error' : 'true', 'data' : 'null'});
                                }
                                // enough balance
                                else if (enoughBalance == true) {
        
                                    // adding to order book
                                    var takerDataValues = new orderBookModel(takerData);
                                    await takerDataValues.save( async (error, saveData) => {
                                        if (error) {
                                            res.json({'message': 'Error with saving data to order book', 'error' : 'true', 'data' : 'null'});
                                        }
                                        // saved
                                        else {                        
                                        
                                            // search for matching sell order
                                            await orderBookModel.find({baseCurrency: takerData.baseCurrency, tradingCurrency: takerData.tradingCurrency,
                                                purpose: 'sell', price: takerData.price, flag: 'true'}).sort({'time': 'asc'}).exec( async (error, makerData) => {
                                                if (error) {
                                                    res.json({'message' : 'Error finding the match', 'error' : 'true', 'data' : 'null'});
                                                }
                                                // no matches
                                                else if (makerData == '') {
                                                    res.json({'message' : 'No match found, saved to order book', 'error' : 'false', 'data' : saveData});
                                                }
                                                // match
                                                else{
                                                    console.log(makerData);                                            
                                                        
                                                        // traverse through each match data
                                                        step(0);
                                                        async function step(i) {  
                                                                if (i < makerData.length) { 
                                                                    console.log('i: '+i);
        
                                                                    // fetch balance of buyer
                                                                    await clientBalanceModel.findOne({_id: makerData[i]._id}, async (error, makerBalance) => {
                                                                        if (error) {
                                                                            // go to next seller error fetching the balance of buyer
                                                                            step(++i); 
                                                                        }
                                                                        // seller balance retreived
                                                                        else if (makerBalance) {
        
                                                                            // retrieve maker base currency balance
                                                                            switch (data.baseCurrency) {
                                                                                case 'BTC': var makerBaseCurrencyBalance = makerBalance.BTCBalance;                                                                                
                                                                                            break;
                                                                                case 'ETH': var makerBaseCurrencyBalance = makerBalance.ETHBalance;                                                                                
                                                                                            break;  
                                                                                case 'BCH': var makerBaseCurrencyBalance = makerBalance.BCHBalance;                                                                                
                                                                                            break; 
                                                                                case 'CRMT': var makerBaseCurrencyBalance = makerBalance.CRMTBalance;                                                                                
                                                                                            break;
                                                                                case 'USDT': var makerBaseCurrencyBalance = makerBalance.USDTBalance;                                                                                
                                                                                            break;  
                                                                                case 'INR': var makerBaseCurrencyBalance = makerBalance.INRBalance;                                                                                
                                                                                            break;
                                                                            }
        
                                                                            // retrieve taker trading currency balance
                                                                            switch (data.tradingCurrency) {
                                                                                case 'BTC': var makerTradeCurrencyBalance = makerBalance.BTCBalance;                                                                                
                                                                                            break;
                                                                                case 'ETH': var makerTradeCurrencyBalance = makerBalance.ETHBalance;                                                                                
                                                                                            break;  
                                                                                case 'BCH': var makerTradeCurrencyBalance = makerBalance.BCHBalance;                                                                                
                                                                                            break; 
                                                                                case 'CRMT': var makerTradeCurrencyBalance = makerBalance.CRMTBalance;                                                                                
                                                                                            break;
                                                                                case 'USDT': var makerTradeCurrencyBalance = makerBalance.USDTBalance;                                                                                
                                                                                            break;  
                                                                                case 'INR': var makerTradeCurrencyBalance = makerBalance.INRBalance;                                                                                
                                                                                            break;
                                                                            }
        
                                                                        
        
                                                                           
                                                                                
        
                                                                                // condition 1 maker taker equal volume
                                                                                if (takerData.volume == makerData[i].volume) {
                                                                                    
                                                                                    takerBaseCurrencyBalance -= (takerData.volume * takerData.price);
        
                                                                                    // update base balance taker
                                                                                    switch (data.baseCurrency) {
                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                    break;
                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;  
                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break; 
                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                    break;
                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                    }
                                                                                    // update balance of maker
                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerTradeCurrBalData) => {
                                                                                        if (error) {
                                                                                            res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                        }
                                                                                        // successfully updated maker trade balance
                                                                                        else if (makerTradeCurrBalData) { 
        
                                                                                            // calculate transaction fee from taker balance
                                                                                            var takerTransactionFee = ( takerData.price * takerData.volume  * 1.5 ) / 100;
                                                                                            companyBaseCurrencyBalance += takerTransactionFee;
                                                                                            makerBaseCurrencyBalance += (( takerData.volume * takerData.price) - takerTransactionFee);
        
                                                                                            // update base balance maker
                                                                                            switch (data.baseCurrency) {
                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                            break;
                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;  
                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break; 
                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                            break;
                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                            }
                                                                                            // update balance of taker
                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, takerTradeCurrBalData) => {
                                                                                                if (error) {
                                                                                                    // error with updating maker data. Revert the taker base balance and go to next seller
                                                                                                    takerBaseCurrencyBalance += (takerData.volume * takerData.price);
        
                                                                                                    // update base balance taker
                                                                                                    switch (data.baseCurrency) {
                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
        
                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                        if (error) {
                                                                                                            res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                        }
                                                                                                        else {
                                                                                                            companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                            step(++i);
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                // successfully updated maker base currency balance
                                                                                                else if (takerTradeCurrBalData) {
        
                                                                                                    // update balance of company
                                                                                                    switch (data.baseCurrency) {
                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
                                                                                                    // update base currency balance of company                                                                                            
                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                        if (error) {
                                                                                                            // error with updating company base currency balance. Revert maker and taker balances and go to next seller
                                                                                                            takerBaseCurrencyBalance += (takerData.volume * takerData.price);
        
                                                                                                            // update base balance taker
                                                                                                            switch (data.baseCurrency) {
                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                if (error) {
                                                                                                                    res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                }
                                                                                                                else {
                                                                                                                    // revert maker balance
                                                                                                                    makerBaseCurrencyBalance -= (( takerData.volume * takerData.price) - takerTransactionFee);
        
                                                                                                                    // update base balance maker
                                                                                                                    switch (data.baseCurrency) {
                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
        
                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                            step(++i);
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                        // successfully updated compnay base currency balance
                                                                                                        else if (companyTradeCurrBalData) {
        
                                                                                                            // transaction fee from maker balance
                                                                                                            var makerTransactionFee = (makerData[i].volume  * 1.5 ) / 100;
                                                                                                            companyTradeCurrencyBalance += makerTransactionFee;
                                                                                                            
                                                                                                            // update trade currency balance of maker
                                                                                                            makerTradeCurrencyBalance -= makerData[i].volume;
        
                                                                                                            // update balance
                                                                                                            switch (data.tradingCurrency) {
                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerBaseCurrBalData) => {
                                                                                                                if (error) {
                                                                                                                    // error with updating maker trade currency balance. Revert maker, taker and company base currency balances and try after sometime
                                                                                                                    takerBaseCurrencyBalance += (takerData.volume * takerData.price);
        
                                                                                                                    // update base balance taker
                                                                                                                    switch (data.baseCurrency) {
                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
        
                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with reverting base balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            // revert maker base balance
                                                                                                                            // revert maker balance
                                                                                                                            makerBaseCurrencyBalance -= (( takerData.volume * takerData.price) - takerTransactionFee);
        
                                                                                                                            // update base balance maker
                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting base balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert company taker transaction fee
                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                    // update balance of company
                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting company base currency balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            res.json({'message' : 'Error with updating maker trade currency balance, transaction reverted, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                        }
                                                                                                                                    });
        
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                                // successfully updated maker trade balance
                                                                                                                else if (makerBaseCurrBalData) {
                                                                                                                    // update taker trade balance
                                                                                                                    takerTradeCurrencyBalance += (makerData[i].volume - makerTransactionFee);
        
                                                                                                                    // update balance taker
                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, takerBaseCurrBalData) => {
                                                                                                                        if (error) {
                                                                                                                            // revert maker, taker, company base currency balances and trade currency balance of maker and go to next seller
                                                                                                                            makerBaseCurrencyBalance -= (( takerData.volume * takerData.price) - takerTransactionFee);
        
                                                                                                                            // update base balance maker
                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }                                                                                                          
                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting base balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert taker base balance
                                                                                                                                    takerBaseCurrencyBalance += (takerData.volume * takerData.price);
        
                                                                                                                                    // update base balance taker
                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert company taker transaction fee
                                                                                                                                            companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                            // update balance of company
                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting company base balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    // revert maker trade currency balance
                                                                                                                                                    makerTradeCurrencyBalance += makerData[i].volume;
        
                                                                                                                                                    // update balance
                                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                    break;
                                                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;  
                                                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break; 
                                                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                    }
                                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            res.json({'message' : 'Error with reverting maker trade balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                                            step(++i);
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            });
                
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                        //successfully updated taker trade currency balance
                                                                                                                        else if (takerBaseCurrBalData) {
                                                                                                                            // update trade balance of company
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            // update company base currency balance data
                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyBaseCurrBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    // revert maker, taker, company base currency balances and maker, taker trade currency balance and go to next seller
                                                                                                                                    makerBaseCurrencyBalance -= (( takerData.volume * takerData.price) - takerTransactionFee);
        
                                                                                                                                    // update base balance maker
                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }       
                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting base currency balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert taker base balance
                                                                                                                                            takerBaseCurrencyBalance += (takerData.volume * takerData.price);
        
                                                                                                                                            // update base balance taker
                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting base currency balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    // revert company taker transaction fee
                                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                                    // update balance of company
                                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                    break;
                                                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break;  
                                                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break; 
                                                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                    }
                                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            res.json({'message' : 'Error with reverting company base balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            // revert maker trade balance
                                                                                                                                                            makerTradeCurrencyBalance += makerData[i].volume;
        
                                                                                                                                                            // update balance
                                                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                            break;
                                                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break;  
                                                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break; 
                                                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                            }
                                                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                                if (error) {
                                                                                                                                                                    res.json({'message' : 'Error with reverting maker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                                }
                                                                                                                                                                else {
                                                                                                                                                                    // revert taker trade currency balance
                                                                                                                                                                    takerTradeCurrencyBalance -= (makerData[i].volume - makerTransactionFee);
        
                                                                                                                                                                    // update balance taker
                                                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                                    break;
                                                                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break;  
                                                                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break; 
                                                                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                                                                    break;
                                                                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break;
                                                                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break;
                                                                                                                                                                    }
                                                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, tkaerUpETHBalData) => {
                                                                                                                                                                        if (error) {
                                                                                                                                                                            res.json({'message' : 'Error with reverting taker trade currency balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                                        }
                                                                                                                                                                        else {
                                                                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                                                            step(++i);
                                                                                                                                                                        }
                                                                                                                                                                    });                                                                                                                                                            
                                                                                                                                                                }
                                                                                                                                                            });
                                                                                                                                                        }
                                                                                                                                                    });        
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                                // successfully updated company trade currency balance
                                                                                                                                else if (companyBaseCurrBalData) {
                                                                                                                                    // all balances successfully updated in the database now start updating order history
                                                                                                                                    // update order book of maker
                                                                                                                                    await orderBookModel.findOneAndUpdate({_id: makerData[i]._id}, {flag: 'false'}, async (error, makerObData) => {
                                                                                                                                        if (error) {
                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                            res.json({'message' : 'Transfer successful, Error updating the order book of maker', 'error' : 'true', 'data' : transferData});
                                                                                                                                        }
                                                                                                                                        // successfully updated order book of maker
                                                                                                                                        else {
                                                                                                                                            // update order book of taker
                                                                                                                                            await orderBookModel.findOneAndUpdate({_id: takerData._id}, {flag: 'false'}, async (error, takerObData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                                    res.json({'message' : 'Transfer Successful, Error updating the order book of taker', 'error' : 'true', 'data' : transferData});
                                                                                                                                                }
                                                                                                                                                // successfully updated order book of taker
                                                                                                                                                else {
                                                                                                                                                    // update order history
                                                                                                                                                    var orderHistoryData = {makerId: makerData[i]._id, takerId: takerData._id, baseCurrency: takerData.baseCurrency, 
                                                                                                                                                        tradingCurrency: takerData.tradingCurrency, purpose: takerData.purpose, volume: takerData.volume, 
                                                                                                                                                        price: takerData.price, time: takerData.time, flag: 'false'};
                                                                                                                        
                                                                                                                                                    orderHistoryData = new orderHistoryModel(orderHistoryData);                                                                        
                                                                                                                                                    await orderHistoryData.save( async (error, odHistoryData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                                            res.json({'message' : 'Transaction successful, Error with saving order history', 'error' : 'true', 'data' : transferData});
                                                                                                                                                        }
                                                                                                                                                        // successfully updated order history
                                                                                                                                                        else {
                                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData, orderHistory: odHistoryData};
                                                                                                                                                            res.json({'message' : 'Transfer Successful, Successfully updated all the reports', 'error' : 'false', 'data' : transferData});
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    });                                                            
                                                                                }
                                                                                // condition 2 taker volume is less than maker volume
                                                                                else if (takerData.volume < makerData[i].volume) {
                                                                                    
                                                                                    takerBaseCurrencyBalance -= (takerData.volume * takerData.price);
        
                                                                                    // update base balance taker
                                                                                    switch (data.baseCurrency) {
                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                    break;
                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;  
                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break; 
                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                    break;
                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                    }
                                                                                    // update balance of maker
                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerTradeCurrBalData) => {
                                                                                        if (error) {
                                                                                            res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                        }
                                                                                        // successfully updated maker trade balance
                                                                                        else if (makerTradeCurrBalData) { 
        
                                                                                            // calculate transaction fee from taker balance
                                                                                            var takerTransactionFee = ( takerData.price * takerData.volume  * 1.5 ) / 100;
                                                                                            companyBaseCurrencyBalance += takerTransactionFee;
                                                                                            makerBaseCurrencyBalance += (( takerData.volume * takerData.price) - takerTransactionFee);
                                                                                            
                                                                                            console.log(makerData[i]._id);
                                                                                            // update base balance maker
                                                                                            switch (data.baseCurrency) {
                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                            break;
                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;  
                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break; 
                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                            break;
                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                            }
                                                                                            // update balance of taker
                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, takerTradeCurrBalData) => {
                                                                                                if (error) {
                                                                                                    // error with updating maker data. Revert the taker base balance and go to next seller
                                                                                                    takerBaseCurrencyBalance += (takerData.volume * takerData.price);
        
                                                                                                    // update base balance taker
                                                                                                    switch (data.baseCurrency) {
                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
        
                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                        if (error) {
                                                                                                            res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                        }
                                                                                                        else {
                                                                                                            companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                            step(++i);
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                // successfully updated maker base currency balance
                                                                                                else if (takerTradeCurrBalData) {
        
                                                                                                    // update balance of company
                                                                                                    switch (data.baseCurrency) {
                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
                                                                                                    // update base currency balance of company                                                                                            
                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                        if (error) {
                                                                                                            // error with updating company base currency balance. Revert maker and taker balances and go to next seller
                                                                                                            takerBaseCurrencyBalance += (takerData.volume * takerData.price);
        
                                                                                                            // update base balance taker
                                                                                                            switch (data.baseCurrency) {
                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                if (error) {
                                                                                                                    res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                }
                                                                                                                else {
                                                                                                                    // revert maker balance
                                                                                                                    makerBaseCurrencyBalance -= (( takerData.volume * takerData.price) - takerTransactionFee);
        
                                                                                                                    // update base balance maker
                                                                                                                    switch (data.baseCurrency) {
                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
        
                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                            step(++i);
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                        // successfully updated compnay base currency balance
                                                                                                        else if (companyTradeCurrBalData) {
        
                                                                                                            // transaction fee from maker balance
                                                                                                            var makerTransactionFee = (takerData.volume * 1.5 ) / 100;
                                                                                                            companyTradeCurrencyBalance += makerTransactionFee;
                                                                                                            
                                                                                                            // update trade currency balance of maker
                                                                                                            makerTradeCurrencyBalance -= takerData.volume;
        
                                                                                                            // update balance
                                                                                                            switch (data.tradingCurrency) {
                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerBaseCurrBalData) => {
                                                                                                                if (error) {
                                                                                                                    // error with updating maker trade currency balance. Revert maker, taker and company base currency balances and try after sometime
                                                                                                                    takerBaseCurrencyBalance += (takerData.volume * takerData.price);
        
                                                                                                                    // update base balance taker
                                                                                                                    switch (data.baseCurrency) {
                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
        
                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with reverting base balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            // revert maker base balance
                                                                                                                            // revert maker balance
                                                                                                                            makerBaseCurrencyBalance -= (( takerData.volume * takerData.price) - takerTransactionFee);
        
                                                                                                                            // update base balance maker
                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting base balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert company taker transaction fee
                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                    // update balance of company
                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting company base currency balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            res.json({'message' : 'Error with updating maker trade currency balance, transaction reverted, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                        }
                                                                                                                                    });
        
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                                // successfully updated maker trade balance
                                                                                                                else if (makerBaseCurrBalData) {
                                                                                                                    // update taker trade balance
                                                                                                                    takerTradeCurrencyBalance += (takerData.volume - makerTransactionFee);
        
                                                                                                                    // update balance taker
                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, takerBaseCurrBalData) => {
                                                                                                                        if (error) {
                                                                                                                            // revert maker, taker, company base currency balances and trade currency balance of maker and go to next seller
                                                                                                                            makerBaseCurrencyBalance -= (( takerData.volume * takerData.price) - takerTransactionFee);
        
                                                                                                                            // update base balance maker
                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }                                                                                                          
                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting base balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert taker base balance
                                                                                                                                    takerBaseCurrencyBalance += (takerData.volume * takerData.price);
        
                                                                                                                                    // update base balance taker
                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert company taker transaction fee
                                                                                                                                            companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                            // update balance of company
                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting company base balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    // revert maker trade currency balance
                                                                                                                                                    makerTradeCurrencyBalance += takerData.volume;
        
                                                                                                                                                    // update balance
                                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                    break;
                                                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;  
                                                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break; 
                                                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                    }
                                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            res.json({'message' : 'Error with reverting maker trade balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                                            step(++i);
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            });
                
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                        //successfully updated taker trade currency balance
                                                                                                                        else if (takerBaseCurrBalData) {
                                                                                                                            // update trade balance of company
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            // update company base currency balance data
                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyBaseCurrBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    // revert maker, taker, company base currency balances and maker, taker trade currency balance and go to next seller
                                                                                                                                    makerBaseCurrencyBalance -= (( takerData.volume * takerData.price) - takerTransactionFee);
        
                                                                                                                                    // update base balance maker
                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }       
                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting base currency balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert taker base balance
                                                                                                                                            takerBaseCurrencyBalance += (takerData.volume * takerData.price);
        
                                                                                                                                            // update base balance taker
                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting base currency balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    // revert company taker transaction fee
                                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                                    // update balance of company
                                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                    break;
                                                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break;  
                                                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break; 
                                                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                    }
                                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            res.json({'message' : 'Error with reverting company base balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            // revert maker trade balance
                                                                                                                                                            makerTradeCurrencyBalance += takerData.volume;
        
                                                                                                                                                            // update balance
                                                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                            break;
                                                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break;  
                                                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break; 
                                                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                            }
                                                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                                if (error) {
                                                                                                                                                                    res.json({'message' : 'Error with reverting maker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                                }
                                                                                                                                                                else {
                                                                                                                                                                    // revert taker trade currency balance
                                                                                                                                                                    takerTradeCurrencyBalance -= (takerData.volume - makerTransactionFee);
        
                                                                                                                                                                    // update balance taker
                                                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                                    break;
                                                                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break;  
                                                                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break; 
                                                                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                                                                    break;
                                                                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break;
                                                                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break;
                                                                                                                                                                    }
                                                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, tkaerUpETHBalData) => {
                                                                                                                                                                        if (error) {
                                                                                                                                                                            res.json({'message' : 'Error with reverting taker trade currency balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                                        }
                                                                                                                                                                        else {
                                                                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                                                            step(++i);
                                                                                                                                                                        }
                                                                                                                                                                    });                                                                                                                                                            
                                                                                                                                                                }
                                                                                                                                                            });
                                                                                                                                                        }
                                                                                                                                                    });        
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                                // successfully updated company trade currency balance
                                                                                                                                else if (companyBaseCurrBalData) {
                                                                                                                                    // all balances successfully updated in the database now start updating order history
                                                                                                                                    // update order book of maker
                                                                                                                                    await orderBookModel.findOneAndUpdate({_id: makerData[i]._id}, {volume: (makerData[i].volume - takerData.volume)}, async (error, makerObData) => {
                                                                                                                                        if (error) {
                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                            res.json({'message' : 'Transfer successful, Error updating the order book of maker', 'error' : 'true', 'data' : transferData});
                                                                                                                                        }
                                                                                                                                        // successfully updated order book of maker
                                                                                                                                        else {
                                                                                                                                            // update order book of taker
                                                                                                                                            await orderBookModel.findOneAndUpdate({_id: takerData._id}, {flag: 'false'}, async (error, takerObData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                                    res.json({'message' : 'Transfer Successful, Error updating the order book of taker', 'error' : 'true', 'data' : transferData});
                                                                                                                                                }
                                                                                                                                                // successfully updated order book of taker
                                                                                                                                                else {
                                                                                                                                                    // update order history
                                                                                                                                                    var orderHistoryData = {makerId: makerData[i]._id, takerId: takerData._id, baseCurrency: takerData.baseCurrency, 
                                                                                                                                                        tradingCurrency: takerData.tradingCurrency, purpose: takerData.purpose, volume: takerData.volume, 
                                                                                                                                                        price: takerData.price, time: takerData.time, flag: 'false'};
                                                                                                                        
                                                                                                                                                    orderHistoryData = new orderHistoryModel(orderHistoryData);                                                                        
                                                                                                                                                    await orderHistoryData.save( async (error, odHistoryData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                                            res.json({'message' : 'Transaction successful, Error with saving order history', 'error' : 'true', 'data' : transferData});
                                                                                                                                                        }
                                                                                                                                                        // successfully updated order history
                                                                                                                                                        else {
                                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData, orderHistory: odHistoryData};
                                                                                                                                                            res.json({'message' : 'Transfer Successful, Successfully updated all the reports', 'error' : 'false', 'data' : transferData});
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    });                                                            
                                                                                }
                                                                                // condition 3 taker volume is greater than maker volume
                                                                                else if (takerData.volume > makerData[i].volume) {
                                                                                    
                                                                                    takerBaseCurrencyBalance -= (makerData[i].volume * takerData.price);
        
                                                                                    // update base balance taker
                                                                                    switch (data.baseCurrency) {
                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                    break;
                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;  
                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break; 
                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                    break;
                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                    break;
                                                                                    }
                                                                                    // update balance of maker
                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerTradeCurrBalData) => {
                                                                                        if (error) {
                                                                                            res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                        }
                                                                                        // successfully updated maker trade balance
                                                                                        else if (makerTradeCurrBalData) { 
        
                                                                                            // calculate transaction fee from taker balance
                                                                                            var takerTransactionFee = ( takerData.price * makerData[i].volume  * 1.5 ) / 100;
                                                                                            companyBaseCurrencyBalance += takerTransactionFee;
                                                                                            makerBaseCurrencyBalance += (( makerData[i].volume * takerData.price) - takerTransactionFee);
        
                                                                                            // update base balance maker
                                                                                            switch (data.baseCurrency) {
                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                            break;
                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;  
                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break; 
                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                            break;
                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                            break;
                                                                                            }
                                                                                            // update balance of taker
                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, takerTradeCurrBalData) => {
                                                                                                if (error) {
                                                                                                    // error with updating maker data. Revert the taker base balance and go to next seller
                                                                                                    takerBaseCurrencyBalance += (makerData[i].volume * takerData.price);
        
                                                                                                    // update base balance taker
                                                                                                    switch (data.baseCurrency) {
                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
        
                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                        if (error) {
                                                                                                            res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                        }
                                                                                                        else {
                                                                                                            companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                            step(++i);
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                // successfully updated maker base currency balance
                                                                                                else if (takerTradeCurrBalData) {
        
                                                                                                    // update balance of company
                                                                                                    switch (data.baseCurrency) {
                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                    break;
                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break;  
                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break; 
                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                    break;
                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                    break;
                                                                                                    }
                                                                                                    // update base currency balance of company                                                                                            
                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                        if (error) {
                                                                                                            // error with updating company base currency balance. Revert maker and taker balances and go to next seller
                                                                                                            takerBaseCurrencyBalance += (makerData[i].volume * takerData.price);
        
                                                                                                            // update base balance taker
                                                                                                            switch (data.baseCurrency) {
                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                if (error) {
                                                                                                                    res.json({'message' : 'Error with updating balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                }
                                                                                                                else {
                                                                                                                    // revert maker balance
                                                                                                                    makerBaseCurrencyBalance -= (( makerData[i].volume * takerData.price) - takerTransactionFee);
        
                                                                                                                    // update base balance maker
                                                                                                                    switch (data.baseCurrency) {
                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
        
                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with updating balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                            step(++i);
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                        // successfully updated compnay base currency balance
                                                                                                        else if (companyTradeCurrBalData) {
        
                                                                                                            // transaction fee from maker balance
                                                                                                            var makerTransactionFee = (makerData[i].volume  * 1.5 ) / 100;
                                                                                                            companyTradeCurrencyBalance += makerTransactionFee;
                                                                                                            
                                                                                                            // update trade currency balance of maker
                                                                                                            makerTradeCurrencyBalance -= makerData[i].volume;
        
                                                                                                            // update balance
                                                                                                            switch (data.tradingCurrency) {
                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                            break;
                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;  
                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break; 
                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                            break;
                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                            break;
                                                                                                            }
                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerBaseCurrBalData) => {
                                                                                                                if (error) {
                                                                                                                    // error with updating maker trade currency balance. Revert maker, taker and company base currency balances and try after sometime
                                                                                                                    takerBaseCurrencyBalance += (makerData[i].volume * takerData.price);
        
                                                                                                                    // update base balance taker
                                                                                                                    switch (data.baseCurrency) {
                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
        
                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                        if (error) {
                                                                                                                            res.json({'message' : 'Error with reverting base balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            // revert maker base balance
                                                                                                                            // revert maker balance
                                                                                                                            makerBaseCurrencyBalance -= (( makerData[i].volume * takerData.price) - takerTransactionFee);
        
                                                                                                                            // update base balance maker
                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting base balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert company taker transaction fee
                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                    // update balance of company
                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting company base currency balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            res.json({'message' : 'Error with updating maker trade currency balance, transaction reverted, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                        }
                                                                                                                                    });
        
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                                // successfully updated maker trade balance
                                                                                                                else if (makerBaseCurrBalData) {
                                                                                                                    // update taker trade balance
                                                                                                                    takerTradeCurrencyBalance += (makerData[i].volume - makerTransactionFee);
        
                                                                                                                    // update balance taker
                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                    break;
                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;  
                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break; 
                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                    break;
                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                    break;
                                                                                                                    }
                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, takerBaseCurrBalData) => {
                                                                                                                        if (error) {
                                                                                                                            // revert maker, taker, company base currency balances and trade currency balance of maker and go to next seller
                                                                                                                            makerBaseCurrencyBalance -= (( makerData[i].volume * takerData.price) - takerTransactionFee);
        
                                                                                                                            // update base balance maker
                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }                                                                                                          
                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    res.json({'message' : 'Error with reverting base balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                }
                                                                                                                                else {
                                                                                                                                    // revert taker base balance
                                                                                                                                    takerBaseCurrencyBalance += (makerData[i].volume * takerData.price);
        
                                                                                                                                    // update base balance taker
                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerBaseCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBaseCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBaseCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBaseCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBaseCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBaseCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }
                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting BTC balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert company taker transaction fee
                                                                                                                                            companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                            // update balance of company
                                                                                                                                            switch (data.baseCurrency) {
                                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting company base balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    // revert maker trade currency balance
                                                                                                                                                    makerTradeCurrencyBalance += makerData[i].volume;
        
                                                                                                                                                    // update balance
                                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                    break;
                                                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;  
                                                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break; 
                                                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                    }
                                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            res.json({'message' : 'Error with reverting maker trade balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                                            step(++i);
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            });
                
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                        //successfully updated taker trade currency balance
                                                                                                                        else if (takerBaseCurrBalData) {
                                                                                                                            // update trade balance of company
                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                case 'BTC': var companyUpdateBalance = {BTCBalance: companyTradeCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                            break;
                                                                                                                                case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyTradeCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;  
                                                                                                                                case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyTradeCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break; 
                                                                                                                                case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyTradeCurrencyBalance};
                                                                                                                                            break;
                                                                                                                                case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyTradeCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                                case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyTradeCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                            break;
                                                                                                                            }
                                                                                                                            // update company base currency balance data
                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyBaseCurrBalData) => {
                                                                                                                                if (error) {
                                                                                                                                    // revert maker, taker, company base currency balances and maker, taker trade currency balance and go to next seller
                                                                                                                                    makerBaseCurrencyBalance -= (( makerData[i].volume * takerData.price) - takerTransactionFee);
        
                                                                                                                                    // update base balance maker
                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                        case 'BTC': var makerUpdateBalance = {BTCBalance: makerBaseCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                    break;
                                                                                                                                        case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBaseCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break;  
                                                                                                                                        case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBaseCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break; 
                                                                                                                                        case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBaseCurrencyBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBaseCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                        case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBaseCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                    break;
                                                                                                                                    }       
                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpBTCBalData) => {
                                                                                                                                        if (error) {
                                                                                                                                            res.json({'message' : 'Error with reverting base currency balance of maker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                        }
                                                                                                                                        else {
                                                                                                                                            // revert taker base balance
                                                                                                                                            takerBaseCurrencyBalance += (makerData[i].volume * takerData.price);
        
                                                                                                                                            // update base balance taker
                                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                                case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                            break;
                                                                                                                                                case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break;  
                                                                                                                                                case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break; 
                                                                                                                                                case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                                case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                            break;
                                                                                                                                            }
                                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, takerUpBTCBalData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    res.json({'message' : 'Error with reverting base currency balance of taker, transaction failed try after sometime', 'error' : 'true', 'data' : 'null'});    
                                                                                                                                                }
                                                                                                                                                else {
                                                                                                                                                    // revert company taker transaction fee
                                                                                                                                                    companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                                                    // update balance of company
                                                                                                                                                    switch (data.baseCurrency) {
                                                                                                                                                        case 'BTC': var companyUpdateBalance = {BTCBalance: companyBaseCurrencyBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                    break;
                                                                                                                                                        case 'ETH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBaseCurrencyBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break;  
                                                                                                                                                        case 'BCH': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBaseCurrencyBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break; 
                                                                                                                                                        case 'CRMT':var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBaseCurrencyBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'USDT': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBaseCurrencyBalance, INRBalance: companyBalance.INRBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                        case 'INR': var companyUpdateBalance = {BTCBalance: companyBalance.BTCBalance, ETHBalance: companyBalance.ETHBalance, USDTBalance: companyBalance.USDTBalance, INRBalance: companyBaseCurrencyBalance, BCHBalance: companyBalance.BCHBalance, CRMTBalance: companyBalance.CRMTBalance};
                                                                                                                                                                    break;
                                                                                                                                                    }
                                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: companyId}, {companyUpdateBalance}, async (error, companyTradeCurrBalData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            res.json({'message' : 'Error with reverting company base balance, transaction failed', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                        }
                                                                                                                                                        else {
                                                                                                                                                            // revert maker trade balance
                                                                                                                                                            makerTradeCurrencyBalance += makerData[i].volume;
        
                                                                                                                                                            // update balance
                                                                                                                                                            switch (data.tradingCurrency) {
                                                                                                                                                                case 'BTC': var makerUpdateBalance = {BTCBalance: makerTradeCurrencyBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                            break;
                                                                                                                                                                case 'ETH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerTradeCurrencyBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break;  
                                                                                                                                                                case 'BCH': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerTradeCurrencyBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break; 
                                                                                                                                                                case 'CRMT':var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerTradeCurrencyBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'USDT': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerTradeCurrencyBalance, INRBalance: makerBalance.INRBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                                case 'INR': var makerUpdateBalance = {BTCBalance: makerBalance.BTCBalance, ETHBalance: makerBalance.ETHBalance, USDTBalance: makerBalance.USDTBalance, INRBalance: makerTradeCurrencyBalance, BCHBalance: makerBalance.BCHBalance, CRMTBalance: makerBalance.CRMTBalance};
                                                                                                                                                                            break;
                                                                                                                                                            }
                                                                                                                                                            await clientBalanceModel.findOneAndUpdate({_id: makerData[i]._id}, {makerUpdateBalance}, async (error, makerUpETHBalData) => {
                                                                                                                                                                if (error) {
                                                                                                                                                                    res.json({'message' : 'Error with reverting maker ETH balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                                }
                                                                                                                                                                else {
                                                                                                                                                                    // revert taker trade currency balance
                                                                                                                                                                    takerTradeCurrencyBalance -= (makerData[i].volume - makerTransactionFee);
        
                                                                                                                                                                    // update balance taker
                                                                                                                                                                    switch (data.tradingCurrency) {
                                                                                                                                                                        case 'BTC': var takerUpdateBalance = {BTCBalance: takerTradeCurrencyBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};                                                                                                                                                                                            
                                                                                                                                                                                    break;
                                                                                                                                                                        case 'ETH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerTradeCurrencyBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break;  
                                                                                                                                                                        case 'BCH': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerTradeCurrencyBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break; 
                                                                                                                                                                        case 'CRMT':var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerTradeCurrencyBalance};
                                                                                                                                                                                    break;
                                                                                                                                                                        case 'USDT': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerTradeCurrencyBalance, INRBalance: takerBalance.INRBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break;
                                                                                                                                                                        case 'INR': var takerUpdateBalance = {BTCBalance: takerBalance.BTCBalance, ETHBalance: takerBalance.ETHBalance, USDTBalance: takerBalance.USDTBalance, INRBalance: takerTradeCurrencyBalance, BCHBalance: takerBalance.BCHBalance, CRMTBalance: takerBalance.CRMTBalance};
                                                                                                                                                                                    break;
                                                                                                                                                                    }
                                                                                                                                                                    await clientBalanceModel.findOneAndUpdate({_id: takerData._id}, {takerUpdateBalance}, async (error, tkaerUpETHBalData) => {
                                                                                                                                                                        if (error) {
                                                                                                                                                                            res.json({'message' : 'Error with reverting taker trade currency balance, transaction failed, try after sometime', 'error' : 'true', 'data' : 'null'});
                                                                                                                                                                        }
                                                                                                                                                                        else {
                                                                                                                                                                            companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                                                                            step(++i);
                                                                                                                                                                        }
                                                                                                                                                                    });                                                                                                                                                            
                                                                                                                                                                }
                                                                                                                                                            });
                                                                                                                                                        }
                                                                                                                                                    });        
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                                // successfully updated company trade currency balance
                                                                                                                                else if (companyBaseCurrBalData) {
                                                                                                                                    // all balances successfully updated in the database now start updating order history
                                                                                                                                    // update order book of maker
                                                                                                                                    await orderBookModel.findOneAndUpdate({_id: makerData[i]._id}, {flag: 'false'}, async (error, makerObData) => {
                                                                                                                                        if (error) {
                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                            res.json({'message' : 'Transfer successful, Error updating the order book of maker', 'error' : 'true', 'data' : transferData});
                                                                                                                                        }
                                                                                                                                        // successfully updated order book of maker
                                                                                                                                        else {
                                                                                                                                            // update order book of taker
                                                                                                                                            await orderBookModel.findOneAndUpdate({_id: takerData._id}, {volume: (takerData.volume - makerData[i].volume)}, async (error, takerObData) => {
                                                                                                                                                if (error) {
                                                                                                                                                    var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                                    res.json({'message' : 'Transfer Successful, Error updating the order book of taker', 'error' : 'true', 'data' : transferData});
                                                                                                                                                }
                                                                                                                                                // successfully updated order book of taker
                                                                                                                                                else {
                                                                                                                                                    // update order history
                                                                                                                                                    var orderHistoryData = {makerId: makerData[i]._id, takerId: takerData._id, baseCurrency: takerData.baseCurrency, 
                                                                                                                                                        tradingCurrency: takerData.tradingCurrency, purpose: takerData.purpose, volume: makerData[i].volume, 
                                                                                                                                                        price: takerData.price, time: takerData.time, flag: 'false'};
                                                                                                                        
                                                                                                                                                    orderHistoryData = new orderHistoryModel(orderHistoryData);                                                                        
                                                                                                                                                    await orderHistoryData.save( async (error, odHistoryData) => {
                                                                                                                                                        if (error) {
                                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData};
                                                                                                                                                            res.json({'message' : 'Transaction successful, Error with saving order history', 'error' : 'true', 'data' : transferData});
                                                                                                                                                        }
                                                                                                                                                        // successfully updated order history
                                                                                                                                                        else {
                                                                                                                                                            var transferData = {makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData, orderHistory: odHistoryData};
                                                                                                                                                            res.json({'message' : 'Transfer Successful, Successfully updated all the reports', 'error' : 'false', 'data' : transferData});
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    });                                                            
                                                                                }
                                                                            
                                                                        }   
                                                                    
                                                                
                                                            });
                                                        }
                                                    }
                                                    
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
        }
    });
    
});

module.exports = router;                                                                                                                                                                 