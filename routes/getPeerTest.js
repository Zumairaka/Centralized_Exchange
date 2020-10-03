const express = require('express');
const router = express.Router();
const { orderBookModel } = require('../models/orderBookModel');
const { clientBalanceModel } = require('../models/clientBalanceModel');
const { orderHistoryModel } = require('../models/orderHistoryModel');

// peer transactions
router.post('/', async function (req, res, next) {

    var data = req.body;
    var time = Date.now();
    var enoughBalance = false;
    var companyId = "5f6df0c27cc3a92a98dd057c";
    var companyTradeCurrencyBalance = 0;
    var companyBaseCurrencyBalance = 0;

    // retrieve actual balances of company
    await clientBalanceModel.findOne({ _id: companyId }, async (error, companyBalance) => {
        if (error) {
            res.json({ 'message': "Error fetching the company balance", 'error': 'true', 'data': 'null' });
        }
        else if (!companyBalance) {
            res.json({ 'message': "No account for the company", 'error': 'true', 'data': 'null' });
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

            // Maker
            if (data.purpose == 'sell') {

                // order book data of maker
                var makerData = {
                    userid: data.userid, baseCurrency: data.baseCurrency, tradingCurrency: data.tradingCurrency, purpose: data.purpose, volume: data.volume,
                    price: data.price, time: time, flag: 'true'
                };

                // checking the maker balance for trade
                await clientBalanceModel.findOne({ _id: data.userid }, async (error, makerBalance) => {
                    if (error) {
                        res.json({ 'message': 'Error retrieving the balance.', 'error': 'true', 'data': 'null' });
                    }
                    // balance retrieved
                    else if (makerBalance) {
                        // check enough balance or not 

                        // identify trade currency
                        switch (data.tradingCurrency) {
                            case 'BTC': if (makerBalance.BTCBalance >= makerData.volume) {
                                enoughBalance = true;
                                var makerTradeCurrencyBalance = makerBalance.BTCBalance - makerData.volume;
                                var makerUpdateBalance = { BTCBalance: makerTradeCurrencyBalance };
                            }
                                break;
                            case 'ETH': if (makerBalance.ETHBalance >= makerData.volume) {
                                enoughBalance = true;
                                var makerTradeCurrencyBalance = makerBalance.ETHBalance - makerData.volume;
                                var makerUpdateBalance = { ETHBalance: makerTradeCurrencyBalance };
                            }
                                break;
                            case 'BCH': if (makerBalance.BCHBalance >= makerData.volume) {
                                enoughBalance = true;
                                var makerTradeCurrencyBalance = makerBalance.BCHBalance - makerData.volume;
                                var makerUpdateBalance = { BCHBalance: makerTradeCurrencyBalance };
                            }
                                break;
                            case 'CRMT': if (makerBalance.CRMTBalance >= makerData.volume) {
                                enoughBalance = true;
                                var makerTradeCurrencyBalance = makerBalance.CRMTBalance - makerData.volume;
                                var makerUpdateBalance = { CRMTBalance: makerTradeCurrencyBalance };
                            }
                                break;
                            case 'USDT': if (makerBalance.USDTBalance >= makerData.volume) {
                                enoughBalance = true;
                                var makerTradeCurrencyBalance = makerBalance.USDTBalance - makerData.volume;
                                var makerUpdateBalance = { USDTBalance: makerTradeCurrencyBalance };
                            }
                                break;
                            case 'INR': if (makerBalance.INRBalance >= makerData.volume) {
                                enoughBalance = true;
                                var makerTradeCurrencyBalance = makerBalance.INRBalance - makerData.volume;
                                var makerUpdateBalance = { INRBalance: makerTradeCurrencyBalance };
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
                            res.json({ 'message': 'Not enough trade currency balance in your account, cannot proceed', 'error': 'true', 'data': 'null' });
                        }
                        // enough balance
                        else if (enoughBalance == true) {
                            // lock the volume balance
                            await clientBalanceModel.findByIdAndUpdate(makerData.userid, makerUpdateBalance, async function (error, makerLockedTradeBalance) {
                                if (error) {
                                    res.json({ 'message': 'Error with locking the balance', 'error': 'true', 'data': 'null' });
                                }
                                else {
                                    // adding to order book
                                    var makerDataValues = new orderBookModel(makerData);
                                    // save to order book
                                    await makerDataValues.save(async (error, saveData) => {
                                        if (error) {
                                            res.json({ 'message': 'Error with saving data to order book', 'error': 'true', 'data': 'null' });
                                        }
                                        // saved
                                        else {

                                            // search for matching buy order
                                            await orderBookModel.find({
                                                baseCurrency: makerData.baseCurrency, tradingCurrency: makerData.tradingCurrency,
                                                purpose: 'buy', price: makerData.price, flag: 'true'
                                            }).sort({ 'time': 'asc' }).exec(async (error, takerData) => {
                                                if (error) {
                                                    res.json({ 'message': 'Error finding the match', 'error': 'true', 'data': 'null' });
                                                }
                                                // no matches
                                                else if (takerData == '') {
                                                    res.json({ 'message': 'No match found, saved to order book', 'error': 'false', 'data': saveData });
                                                }
                                                // match
                                                else {
                                                    console.log(takerData);

                                                    // traverse through each match data
                                                    step(0);
                                                    async function step(i) {
                                                        if (i < takerData.length) {

                                                            // fetch balance of buyer
                                                            await clientBalanceModel.findOne({ _id: takerData[i].userid }, async (error, takerBalance) => {
                                                                if (error) {
                                                                    // go to next buyer error fetching the balance of buyer
                                                                    step(++i);
                                                                }
                                                                // buyer balance retreived
                                                                else if (takerBalance) {



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

                                                                        // calculate transaction fee from maker balance
                                                                        var makerTransactionFee = (makerData.volume * 1.5) / 100;
                                                                        companyTradeCurrencyBalance += makerTransactionFee;
                                                                        takerTradeCurrencyBalance += (makerData.volume - makerTransactionFee);

                                                                        // update balance taker
                                                                        switch (data.tradingCurrency) {
                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                        }
                                                                        // update balance of taker
                                                                        await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerTradeCurrBalData) => {
                                                                            if (error) {
                                                                                // error with updating taker data, go to next buyer                                                                                                                                                                                                                                                                                                                                                                        
                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                step(++i);

                                                                            }
                                                                            // successfully updated taker currency balance
                                                                            else if (takerTradeCurrBalData) {

                                                                                // update balance of company
                                                                                switch (data.tradingCurrency) {
                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                }
                                                                                // update trade currency balance of company                                                                                            
                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                    if (error) {
                                                                                        // error with updating company trade currency balance. Revert taker balances and go to next buyer




                                                                                        // revert taker balance
                                                                                        takerTradeCurrencyBalance -= (makerData.volume - makerTransactionFee);
                                                                                        // update balance taker
                                                                                        switch (data.tradingCurrency) {
                                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                        }

                                                                                        await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                            if (error) {
                                                                                                res.json({ 'message': 'Error with reverting balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                            }
                                                                                            else {
                                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                step(++i);
                                                                                            }
                                                                                        });


                                                                                    }
                                                                                    // successfully updated compnay trade currency balance
                                                                                    else if (companyTradeCurrBalData) {

                                                                                        // transaction fee from taker balance
                                                                                        var takerTransactionFee = (takerData[i].price * takerData[i].volume * 1.5) / 100;
                                                                                        companyBaseCurrencyBalance += takerTransactionFee;

                                                                                        // update base currency balance of maker
                                                                                        makerBaseCurrencyBalance += ((takerData[i].volume * takerData[i].price) - takerTransactionFee);

                                                                                        // update balance maker
                                                                                        switch (data.baseCurrency) {
                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                        }
                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData.userid, makerUpdateBalance, async (error, makerBaseCurrBalData) => {
                                                                                            if (error) {
                                                                                                // error with updating company maker base currency balance. Revert taker and company trade currency balances and try after sometime



                                                                                                // revert taker balance
                                                                                                takerTradeCurrencyBalance -= (makerData.volume - makerTransactionFee);
                                                                                                // update balance taker
                                                                                                switch (data.tradingCurrency) {
                                                                                                    case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                                    if (error) {
                                                                                                        res.json({ 'message': 'Error with reverting trade balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                    }
                                                                                                    else {
                                                                                                        // revert company maker transaction fee
                                                                                                        companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                        // update balance of company
                                                                                                        switch (data.tradingCurrency) {
                                                                                                            case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting company trade currency balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {
                                                                                                                res.json({ 'message': 'Error with updating maker base currency balance, transaction reverted, try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                        });

                                                                                                    }
                                                                                                });


                                                                                            }
                                                                                            // successfully updated maker base currency balance
                                                                                            else if (makerBaseCurrBalData) {


                                                                                                // update balance of company
                                                                                                switch (data.baseCurrency) {
                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                // update company base currency balance data
                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyBaseCurrBalData) => {
                                                                                                    if (error) {
                                                                                                        // revert taker, company trade currency balances and maker, taker base currency balance and go to next buyer


                                                                                                        // revert taker balance
                                                                                                        takerTradeCurrencyBalance -= (makerData.volume - makerTransactionFee);
                                                                                                        // update balance taker
                                                                                                        switch (data.tradingCurrency) {
                                                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting trade currency balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {
                                                                                                                // revert company maker transaction fee
                                                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                // update balance of company
                                                                                                                switch (data.tradingCurrency) {
                                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                }
                                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                                    if (error) {
                                                                                                                        res.json({ 'message': 'Error with reverting company trade balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        // revert maker base  balance
                                                                                                                        makerBaseCurrencyBalance -= ((takerData[i].volume * takerData[i].price) - takerTransactionFee);
                                                                                                                        // update balance
                                                                                                                        switch (data.baseCurrency) {
                                                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                        }
                                                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData.userid, makerUpdateBalance, async (error, makerUpETHBalData) => {
                                                                                                                            if (error) {
                                                                                                                                res.json({ 'message': 'Error with reverting maker base balance, transaction failed, try after sometime', 'error': 'true', 'data': 'null' });
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
                                                                                                    // successfully updated company base currency balance
                                                                                                    else if (companyBaseCurrBalData) {
                                                                                                        // all balances successfully updated in the database now start updating order history
                                                                                                        // update order book of maker
                                                                                                        await orderBookModel.findOneAndUpdate({ userid: makerData.userid }, { flag: 'false' }, async (error, makerObData) => {
                                                                                                            if (error) {
                                                                                                                var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                res.json({ 'message': 'Transfer successful, Error updating the order book of maker', 'error': 'true', 'data': transferData });
                                                                                                            }
                                                                                                            // successfully updated order book of maker
                                                                                                            else {
                                                                                                                // update order book of taker
                                                                                                                await orderBookModel.findOneAndUpdate({ userid: takerData[i].userid }, { flag: 'false' }, async (error, takerObData) => {
                                                                                                                    if (error) {
                                                                                                                        var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                        res.json({ 'message': 'Transfer Successful, Error updating the order book of taker', 'error': 'true', 'data': transferData });
                                                                                                                    }
                                                                                                                    // successfully updated order book of taker
                                                                                                                    else {
                                                                                                                        // update order history
                                                                                                                        var orderHistoryData = {
                                                                                                                            makerId: makerData.userid, takerId: takerData[i].userid, baseCurrency: makerData.baseCurrency,
                                                                                                                            tradingCurrency: makerData.tradingCurrency, purpose: makerData.purpose, volume: makerData.volume,
                                                                                                                            price: makerData.price, time: makerData.time, flag: 'false'
                                                                                                                        };

                                                                                                                        orderHistoryData = new orderHistoryModel(orderHistoryData);
                                                                                                                        await orderHistoryData.save(async (error, odHistoryData) => {
                                                                                                                            if (error) {

                                                                                                                                res.json({ 'message': 'Transaction successful, Error with saving order history', 'error': 'true', 'data': 'null' });
                                                                                                                            }
                                                                                                                            // successfully updated order history
                                                                                                                            else {

                                                                                                                                res.json({ 'message': 'Transfer Successful, Successfully updated all the reports', 'error': 'false', 'data': 'null' });
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




                                                                        // calculate transaction fee from maker balance
                                                                        var makerTransactionFee = (takerData[i].volume * 1.5) / 100;
                                                                        companyTradeCurrencyBalance += makerTransactionFee;
                                                                        takerTradeCurrencyBalance += (takerData[i].volume - makerTransactionFee);

                                                                        // update balance taker
                                                                        switch (data.tradingCurrency) {
                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                        }
                                                                        console.log(takerUpdateBalance);
                                                                        // update trade currency balance of taker
                                                                        await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerTradeCurrBalData) => {
                                                                            if (error) {
                                                                                // error with updating taker data, go to next buyer

                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                step(++i);

                                                                            }
                                                                            // successfully updated taker trade balance
                                                                            else if (takerTradeCurrBalData) {
                                                                                // update balance of company
                                                                                switch (data.tradingCurrency) {
                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                }
                                                                                console.log(companyUpdateBalance);
                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                    if (error) {
                                                                                        // error with updating company trade balance. Revert taker balances and go to next buyer


                                                                                        // revert taker balance                                                                                                            
                                                                                        takerTradeCurrencyBalance -= (takerData[i].volume - makerTransactionFee);
                                                                                        // update balance taker
                                                                                        switch (data.tradingCurrency) {
                                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                        }
                                                                                        await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                            if (error) {
                                                                                                res.json({ 'message': 'Error with updating balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                            }
                                                                                            else {
                                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                step(++i);
                                                                                            }
                                                                                        });


                                                                                    }
                                                                                    // successfully updated compnay trade currency balance
                                                                                    else if (companyTradeCurrBalData) {

                                                                                        // transaction fee from taker balance
                                                                                        var takerTransactionFee = (takerData[i].price * takerData[i].volume * 1.5) / 100;
                                                                                        companyBaseCurrencyBalance += takerTransactionFee;

                                                                                        // update base currency balance of maker
                                                                                        makerBaseCurrencyBalance += ((takerData[i].volume * takerData[i].price) - takerTransactionFee);
                                                                                        // update balance
                                                                                        switch (data.baseCurrency) {
                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                        }
                                                                                        console.log(makerUpdateBalance);

                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData.userid, makerUpdateBalance, async (error, makerBaseCurrBalData) => {
                                                                                            if (error) {
                                                                                                // error with updating maker base balance. Revert taker and company trade balances and try after sometime


                                                                                                // revert taker balance
                                                                                                takerTradeCurrencyBalance -= (takerData[i].volume - makerTransactionFee);
                                                                                                // update balance taker
                                                                                                switch (data.tradingCurrency) {
                                                                                                    case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                                    if (error) {
                                                                                                        res.json({ 'message': 'Error with reverting trade balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                    }
                                                                                                    else {
                                                                                                        // revert company maker transaction fee
                                                                                                        companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                        // update balance of company
                                                                                                        switch (data.tradingCurrency) {
                                                                                                            case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting company trade balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {
                                                                                                                res.json({ 'message': 'Error with updating maker base balance, transaction reverted, try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                        });

                                                                                                    }
                                                                                                });


                                                                                            }
                                                                                            // successfully updated maker base balance
                                                                                            else if (makerBaseCurrBalData) {




                                                                                                // update balance of company
                                                                                                switch (data.baseCurrency) {
                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                console.log(companyUpdateBalance);
                                                                                                // update company base balance data
                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyBaseCurrBalData) => {
                                                                                                    if (error) {
                                                                                                        // revert taker, company trade balances and maker, taker base balance and go to next buyer


                                                                                                        // revert taker balance
                                                                                                        takerTradeCurrencyBalance -= (takerData[i].volume - makerTransactionFee);
                                                                                                        // update balance taker
                                                                                                        switch (data.tradingCurrency) {
                                                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting trade balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {
                                                                                                                // revert company maker transaction fee
                                                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                // update balance of company
                                                                                                                switch (data.tradingCurrency) {
                                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                }
                                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                                    if (error) {
                                                                                                                        res.json({ 'message': 'Error with reverting company trade balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        // revert maker base balance
                                                                                                                        makerBaseCurrencyBalance -= ((takerData[i].volume * takerData[i].price) - takerTransactionFee);
                                                                                                                        // update balance
                                                                                                                        switch (data.baseCurrency) {
                                                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                        }
                                                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData.userid, makerUpdateBalance, async (error, makerUpETHBalData) => {
                                                                                                                            if (error) {
                                                                                                                                res.json({ 'message': 'Error with reverting maker base balance, transaction failed, try after sometime', 'error': 'true', 'data': 'null' });
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
                                                                                                    // successfully updated company base currency balance
                                                                                                    else if (companyBaseCurrBalData) {
                                                                                                        // all balances successfully updated in the database now start updating order history
                                                                                                        // update order book of maker
                                                                                                        await orderBookModel.findOneAndUpdate({ userid: makerData.userid }, { volume: (makerData.volume - takerData[i].volume) }, async (error, makerObData) => {
                                                                                                            if (error) {
                                                                                                                var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                res.json({ 'message': 'Transfer successful, Error updating the order book of maker', 'error': 'true', 'data': transferData });
                                                                                                            }
                                                                                                            // successfully updated order book of maker
                                                                                                            else {
                                                                                                                // update order book of taker
                                                                                                                await orderBookModel.findOneAndUpdate({ userid: takerData[i].userid }, { flag: 'false' }, async (error, takerObData) => {
                                                                                                                    if (error) {
                                                                                                                        var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                        res.json({ 'message': 'Transfer Successful, Error updating the order book of taker', 'error': 'true', 'data': transferData });
                                                                                                                    }
                                                                                                                    // successfully updated order book of taker
                                                                                                                    else {
                                                                                                                        // update order history
                                                                                                                        var orderHistoryData = {
                                                                                                                            makerId: makerData.userid, takerId: takerData[i].userid, baseCurrency: makerData.baseCurrency,
                                                                                                                            tradingCurrency: makerData.tradingCurrency, purpose: makerData.purpose, volume: takerData[i].volume,
                                                                                                                            price: makerData.price, time: makerData.time, flag: 'false'
                                                                                                                        };

                                                                                                                        orderHistoryData = new orderHistoryModel(orderHistoryData);
                                                                                                                        await orderHistoryData.save(async (error, odHistoryData) => {
                                                                                                                            if (error) {

                                                                                                                                res.json({ 'message': 'Transaction successful, Error with saving order history', 'error': 'true', 'data': 'null' });
                                                                                                                            }
                                                                                                                            // successfully updated order history
                                                                                                                            else {

                                                                                                                                res.json({ 'message': 'Transfer Successful, Successfully updated all the reports', 'error': 'false', 'data': 'null' });
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



                                                                        // calculate transaction fee from maker balance
                                                                        var makerTransactionFee = (makerData.volume * 1.5) / 100;
                                                                        companyTradeCurrencyBalance += makerTransactionFee;
                                                                        takerTradeCurrencyBalance += (makerData.volume - makerTransactionFee);

                                                                        // update balance taker
                                                                        switch (data.tradingCurrency) {
                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                break;
                                                                        }
                                                                        // update trade balance of taker
                                                                        await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerTradeCurrBalData) => {
                                                                            if (error) {
                                                                                // error with updating taker data, go to next buyer


                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                step(++i);

                                                                            }
                                                                            // successfully updated taker trade balance
                                                                            else if (takerTradeCurrBalData) {
                                                                                // update balance of company
                                                                                switch (data.tradingCurrency) {
                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                        break;
                                                                                }
                                                                                // update trade balance of company
                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                    if (error) {


                                                                                        // revert taker balance
                                                                                        takerTradeCurrencyBalance -= (makerData.volume - makerTransactionFee);
                                                                                        // update balance taker
                                                                                        switch (data.tradingCurrency) {
                                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                        }
                                                                                        await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                            if (error) {
                                                                                                res.json({ 'message': 'Error with updating balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                            }
                                                                                            else {
                                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                step(++i);
                                                                                            }
                                                                                        });


                                                                                    }
                                                                                    // successfully updated compnay trade balance
                                                                                    else if (companyTradeCurrBalData) {

                                                                                        // transaction fee from taker balance
                                                                                        var takerTransactionFee = (takerData[i].price * makerData.volume * 1.5) / 100;
                                                                                        companyBaseCurrencyBalance += takerTransactionFee;

                                                                                        // update base balance of maker
                                                                                        makerBaseCurrencyBalance += ((makerData.volume * takerData[i].price) - takerTransactionFee);
                                                                                        // update balance
                                                                                        switch (data.baseCurrency) {
                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                        }
                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData.userid, makerUpdateBalance, async (error, makerBaseCurrBalData) => {
                                                                                            if (error) {
                                                                                                // error with updating maker base balance. Revert taker and company trade balances and try after sometime


                                                                                                // revert taker balance
                                                                                                takerTradeCurrencyBalance -= (makerData.volume - makerTransactionFee);
                                                                                                // update balance taker
                                                                                                switch (data.tradingCurrency) {
                                                                                                    case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                                    if (error) {
                                                                                                        res.json({ 'message': 'Error with reverting base balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                    }
                                                                                                    else {
                                                                                                        // revert company maker transaction fee
                                                                                                        companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                        // update balance of company
                                                                                                        switch (data.tradingCurrency) {
                                                                                                            case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting company trade balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {
                                                                                                                res.json({ 'message': 'Error with updating maker base balance, transaction reverted, try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                        });

                                                                                                    }
                                                                                                });


                                                                                            }
                                                                                            // successfully updated maker base balance
                                                                                            else if (makerBaseCurrBalData) {


                                                                                                // update balance of company
                                                                                                switch (data.baseCurrency) {
                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                // update company base balance data
                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyBaseCurrBalData) => {
                                                                                                    if (error) {
                                                                                                        // revert taker, company trade balances and maker base balance and go to next buyer


                                                                                                        // revert taker balance
                                                                                                        takerTradeCurrencyBalance -= (makerData.volume - makerTransactionFee);
                                                                                                        switch (data.tradingCurrency) {
                                                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(takerData[i].userid, takerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting trade balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {
                                                                                                                // revert company maker transaction fee
                                                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                // update balance of company
                                                                                                                switch (data.tradingCurrency) {
                                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                                                        break;
                                                                                                                }
                                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                                    if (error) {
                                                                                                                        res.json({ 'message': 'Error with reverting company trade balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                                    }
                                                                                                                    else {
                                                                                                                        // revert maker base balance
                                                                                                                        makerBaseCurrencyBalance -= ((makerData.volume * takerData[i].price) - takerTransactionFee);
                                                                                                                        // update balance
                                                                                                                        switch (data.baseCurrency) {
                                                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                        }
                                                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData.userid, makerUpdateBalance, async (error, makerUpETHBalData) => {
                                                                                                                            if (error) {
                                                                                                                                res.json({ 'message': 'Error with reverting maker base balance, transaction failed, try after sometime', 'error': 'true', 'data': 'null' });
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
                                                                                                    // successfully updated company ETH balance
                                                                                                    else if (companyBaseCurrBalData) {
                                                                                                        // all balances successfully updated in the database now start updating order history
                                                                                                        // update order book of maker
                                                                                                        await orderBookModel.findOneAndUpdate({ userid: makerData.userid }, { flag: 'false' }, async (error, makerObData) => {
                                                                                                            if (error) {
                                                                                                                var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                res.json({ 'message': 'Transfer successful, Error updating the order book of maker', 'error': 'true', 'data': transferData });
                                                                                                            }
                                                                                                            // successfully updated order book of maker
                                                                                                            else {
                                                                                                                // update order book of taker
                                                                                                                await orderBookModel.findOneAndUpdate({ userid: takerData[i].userid }, { volume: (takerData[i].volume - makerData.volume) }, async (error, takerObData) => {
                                                                                                                    if (error) {
                                                                                                                        var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                        res.json({ 'message': 'Transfer Successful, Error updating the order book of taker', 'error': 'true', 'data': transferData });
                                                                                                                    }
                                                                                                                    // successfully updated order book of taker
                                                                                                                    else {
                                                                                                                        // update order history
                                                                                                                        var orderHistoryData = {
                                                                                                                            makerId: makerData.userid, takerId: takerData[i].userid, baseCurrency: makerData.baseCurrency,
                                                                                                                            tradingCurrency: makerData.tradingCurrency, purpose: makerData.purpose, volume: makerData.volume,
                                                                                                                            price: makerData.price, time: makerData.time, flag: 'false'
                                                                                                                        };

                                                                                                                        orderHistoryData = new orderHistoryModel(orderHistoryData);
                                                                                                                        await orderHistoryData.save(async (error, odHistoryData) => {
                                                                                                                            if (error) {

                                                                                                                                res.json({ 'message': 'Transaction successful, Error with saving order history', 'error': 'true', 'data': 'null' });
                                                                                                                            }
                                                                                                                            // successfully updated order history
                                                                                                                            else {

                                                                                                                                res.json({ 'message': 'Transfer Successful, Successfully updated all the reports', 'error': 'false', 'data': 'null' });
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
                            });
                        }
                    }
                });
            }

            // taker data
            else if (data.purpose == 'buy') {

                // order book data of taker
                var takerData = {
                    userid: data.userid, baseCurrency: data.baseCurrency, tradingCurrency: data.tradingCurrency, purpose: data.purpose, volume: data.volume,
                    price: data.price, time: time, flag: 'true'
                };

                // checking the seller balance for trade
                await clientBalanceModel.findOne({ _id: data.userid }, async (error, takerBalance) => {
                    if (error) {
                        res.json({ 'message': 'Error retrieving the balance.', 'error': 'true', 'data': 'null' });
                    }
                    // balance retrieved
                    else if (takerBalance) {
                        // check enough balance or not 

                        // identify base currency
                        switch (data.baseCurrency) {
                            case 'BTC': if (takerBalance.BTCBalance >= (takerData.volume * takerData.price)) {
                                enoughBalance = true;
                                var takerBaseCurrencyBalance = takerBalance.BTCBalance - (takerData.volume * takerData.price);
                                var takerUpdateBalance = { BTCBalance: takerBaseCurrencyBalance };
                            }
                                break;
                            case 'ETH': if (takerBalance.ETHBalance >= (takerData.volume * takerData.price)) {
                                enoughBalance = true;
                                var takerBaseCurrencyBalance = takerBalance.ETHBalance - (takerData.volume * takerData.price);
                                var takerUpdateBalance = { ETHBalance: takerBaseCurrencyBalance };
                            }
                                break;
                            case 'BCH': if (takerBalance.BCHBalance >= (takerData.volume * takerData.price)) {
                                enoughBalance = true;
                                var takerBaseCurrencyBalance = takerBalance.BCHBalance - (takerData.volume * takerData.price);
                                var takerUpdateBalance = { BCHBalance: takerBaseCurrencyBalance };
                            }
                                break;
                            case 'CRMT': if (takerBalance.CRMTBalance >= (takerData.volume * takerData.price)) {
                                enoughBalance = true;
                                var takerBaseCurrencyBalance = takerBalance.CRMTBalance - (takerData.volume * takerData.price);
                                var takerUpdateBalance = { CRMTBalance: takerBaseCurrencyBalance };
                            }
                                break;
                            case 'USDT': if (takerBalance.USDTBalance >= (takerData.volume * takerData.price)) {
                                enoughBalance = true;
                                var takerBaseCurrencyBalance = takerBalance.USDTBalance - (takerData.volume * takerData.price);
                                var takerUpdateBalance = { USDTBalance: takerBaseCurrencyBalance };
                            }
                                break;
                            case 'INR': if (takerBalance.INRBalance >= (takerData.volume * takerData.price)) {
                                enoughBalance = true;
                                var takerBaseCurrencyBalance = takerBalance.INRBalance - (takerData.volume * takerData.price);
                                var takerUpdateBalance = { INRBalance: takerBaseCurrencyBalance };
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
                            res.json({ 'message': 'Not enough Base Currency balance in your account, cannot proceed', 'error': 'true', 'data': 'null' });
                        }
                        // enough balance
                        else if (enoughBalance == true) {

                            // adding to order book
                            var takerDataValues = new orderBookModel(takerData);

                            // locking base currency of taker
                            await clientBalanceModel.findByIdAndUpdate(takerData.userid, takerUpdateBalance, async function (error, takerLockedBaseValue) {
                                if (error) {
                                    res.json({ 'message': 'Error locking the base currency value of taker', 'error': 'true', 'data': 'null' });
                                }
                                else {


                                    // saving taker data
                                    await takerDataValues.save(async (error, saveData) => {
                                        if (error) {
                                            res.json({ 'message': 'Error with saving data to order book', 'error': 'true', 'data': 'null' });
                                        }
                                        // saved
                                        else {

                                            // search for matching sell order
                                            await orderBookModel.find({
                                                baseCurrency: takerData.baseCurrency, tradingCurrency: takerData.tradingCurrency,
                                                purpose: 'sell', price: takerData.price, flag: 'true'
                                            }).sort({ 'time': 'asc' }).exec(async (error, makerData) => {
                                                if (error) {
                                                    res.json({ 'message': 'Error finding the match', 'error': 'true', 'data': 'null' });
                                                }
                                                // no matches
                                                else if (makerData == '') {
                                                    res.json({ 'message': 'No match found, saved to order book', 'error': 'false', 'data': saveData });
                                                }
                                                // match
                                                else {
                                                    console.log(makerData);

                                                    // traverse through each match data
                                                    step(0);
                                                    async function step(i) {
                                                        if (i < makerData.length) {
                                                            console.log('i: ' + i);

                                                            // fetch balance of buyer
                                                            await clientBalanceModel.findOne({ _id: makerData[i].userid }, async (error, makerBalance) => {
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








                                                                    // condition 1 maker taker equal volume
                                                                    if (takerData.volume == makerData[i].volume) {




                                                                        // calculate transaction fee from taker balance
                                                                        var takerTransactionFee = (takerData.price * takerData.volume * 1.5) / 100;
                                                                        companyBaseCurrencyBalance += takerTransactionFee;
                                                                        makerBaseCurrencyBalance += ((takerData.volume * takerData.price) - takerTransactionFee);

                                                                        // update base balance maker
                                                                        switch (data.baseCurrency) {
                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                        }
                                                                        // update balance of taker
                                                                        await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, takerTradeCurrBalData) => {
                                                                            if (error) {
                                                                                // error with updating maker data, go to next seller




                                                                                companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                step(++i);


                                                                            }
                                                                            // successfully updated maker base currency balance
                                                                            else if (takerTradeCurrBalData) {

                                                                                // update balance of company
                                                                                switch (data.baseCurrency) {
                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                }
                                                                                // update base currency balance of company                                                                                            
                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                    if (error) {
                                                                                        // error with updating company base currency balance. Revert maker balances and go to next seller


                                                                                        // revert maker balance
                                                                                        makerBaseCurrencyBalance -= ((takerData.volume * takerData.price) - takerTransactionFee);

                                                                                        // update base balance maker
                                                                                        switch (data.baseCurrency) {
                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                        }

                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                            if (error) {
                                                                                                res.json({ 'message': 'Error with updating balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                            }
                                                                                            else {
                                                                                                companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                step(++i);
                                                                                            }
                                                                                        });


                                                                                    }
                                                                                    // successfully updated compnay base currency balance
                                                                                    else if (companyTradeCurrBalData) {

                                                                                        // transaction fee from maker balance
                                                                                        var makerTransactionFee = (makerData[i].volume * 1.5) / 100;
                                                                                        companyTradeCurrencyBalance += makerTransactionFee;


                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, makerBaseCurrBalData) => {
                                                                                            if (error) {
                                                                                                // error with updating maker trade currency balance. Revert maker and company base currency balances and try after sometime



                                                                                                // revert maker base balance

                                                                                                makerBaseCurrencyBalance -= ((takerData.volume * takerData.price) - takerTransactionFee);

                                                                                                // update base balance maker
                                                                                                switch (data.baseCurrency) {
                                                                                                    case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                                    if (error) {
                                                                                                        res.json({ 'message': 'Error with reverting base balance of maker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                    }
                                                                                                    else {
                                                                                                        // revert company taker transaction fee
                                                                                                        companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                        // update balance of company
                                                                                                        switch (data.baseCurrency) {
                                                                                                            case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting company base currency balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {
                                                                                                                res.json({ 'message': 'Error with updating maker trade currency balance, transaction reverted, try after sometime', 'error': 'true', 'data': 'null' });
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
                                                                                                    case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                await clientBalanceModel.findByIdAndUpdate(takerData.userid, takerUpdateBalance, async (error, takerBaseCurrBalData) => {
                                                                                                    if (error) {
                                                                                                        // revert maker, company base currency balances and trade currency balance of maker and go to next seller
                                                                                                        makerBaseCurrencyBalance -= ((takerData.volume * takerData.price) - takerTransactionFee);

                                                                                                        // update base balance maker
                                                                                                        switch (data.baseCurrency) {
                                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, makerUpBTCBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting base balance of maker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {


                                                                                                                // revert company taker transaction fee
                                                                                                                companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                // update balance of company
                                                                                                                switch (data.baseCurrency) {
                                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                }
                                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                                    if (error) {
                                                                                                                        res.json({ 'message': 'Error with reverting company base balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                                    }
                                                                                                                    else {


                                                                                                                        companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                        step(++i);


                                                                                                                    }
                                                                                                                });



                                                                                                            }
                                                                                                        });
                                                                                                    }
                                                                                                    //successfully updated taker trade currency balance
                                                                                                    else if (takerBaseCurrBalData) {
                                                                                                        // update trade balance of company
                                                                                                        switch (data.tradingCurrency) {
                                                                                                            case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        // update company base currency balance data
                                                                                                        await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyBaseCurrBalData) => {
                                                                                                            if (error) {
                                                                                                                // revert maker, company base currency balances and taker trade currency balance and go to next seller
                                                                                                                makerBaseCurrencyBalance -= ((takerData.volume * takerData.price) - takerTransactionFee);

                                                                                                                // update base balance maker
                                                                                                                switch (data.baseCurrency) {
                                                                                                                    case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                }
                                                                                                                await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, makerUpBTCBalData) => {
                                                                                                                    if (error) {
                                                                                                                        res.json({ 'message': 'Error with reverting base currency balance of maker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                                    }
                                                                                                                    else {


                                                                                                                        // revert company taker transaction fee
                                                                                                                        companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                        // update balance of company
                                                                                                                        switch (data.baseCurrency) {
                                                                                                                            case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                                                                break;
                                                                                                                        }
                                                                                                                        await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                                            if (error) {
                                                                                                                                res.json({ 'message': 'Error with reverting company base balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                                            }
                                                                                                                            else {


                                                                                                                                // revert taker trade currency balance
                                                                                                                                takerTradeCurrencyBalance -= (makerData[i].volume - makerTransactionFee);

                                                                                                                                // update balance taker
                                                                                                                                switch (data.tradingCurrency) {
                                                                                                                                    case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                                                        break;
                                                                                                                                    case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                                                        break;
                                                                                                                                    case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                                                        break;
                                                                                                                                    case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                                                        break;
                                                                                                                                    case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                                                        break;
                                                                                                                                    case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                                                        break;
                                                                                                                                }
                                                                                                                                await clientBalanceModel.findByIdAndUpdate(takerData.userid, takerUpdateBalance, async (error, tkaerUpETHBalData) => {
                                                                                                                                    if (error) {
                                                                                                                                        res.json({ 'message': 'Error with reverting taker trade currency balance, transaction failed, try after sometime', 'error': 'true', 'data': 'null' });
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
                                                                                                            // successfully updated company trade currency balance
                                                                                                            else if (companyBaseCurrBalData) {
                                                                                                                // all balances successfully updated in the database now start updating order history
                                                                                                                // update order book of maker
                                                                                                                await orderBookModel.findOneAndUpdate({ userid: makerData[i].userid }, { flag: 'false' }, async (error, makerObData) => {
                                                                                                                    if (error) {
                                                                                                                        var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                        res.json({ 'message': 'Transfer successful, Error updating the order book of maker', 'error': 'true', 'data': transferData });
                                                                                                                    }
                                                                                                                    // successfully updated order book of maker
                                                                                                                    else {
                                                                                                                        // update order book of taker
                                                                                                                        await orderBookModel.findOneAndUpdate({ userid: takerData.userid }, { flag: 'false' }, async (error, takerObData) => {
                                                                                                                            if (error) {
                                                                                                                                var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                                res.json({ 'message': 'Transfer Successful, Error updating the order book of taker', 'error': 'true', 'data': transferData });
                                                                                                                            }
                                                                                                                            // successfully updated order book of taker
                                                                                                                            else {
                                                                                                                                // update order history
                                                                                                                                var orderHistoryData = {
                                                                                                                                    makerId: makerData[i].userid, takerId: takerData.userid, baseCurrency: takerData.baseCurrency,
                                                                                                                                    tradingCurrency: takerData.tradingCurrency, purpose: takerData.purpose, volume: takerData.volume,
                                                                                                                                    price: takerData.price, time: takerData.time, flag: 'false'
                                                                                                                                };

                                                                                                                                orderHistoryData = new orderHistoryModel(orderHistoryData);
                                                                                                                                await orderHistoryData.save(async (error, odHistoryData) => {
                                                                                                                                    if (error) {

                                                                                                                                        res.json({ 'message': 'Transaction successful, Error with saving order history', 'error': 'true', 'data': 'null' });
                                                                                                                                    }
                                                                                                                                    // successfully updated order history
                                                                                                                                    else {

                                                                                                                                        res.json({ 'message': 'Transfer Successful, Successfully updated all the reports', 'error': 'false', 'data': 'null' });
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




                                                                        // calculate transaction fee from taker balance
                                                                        var takerTransactionFee = (takerData.price * takerData.volume * 1.5) / 100;
                                                                        companyBaseCurrencyBalance += takerTransactionFee;
                                                                        makerBaseCurrencyBalance += ((takerData.volume * takerData.price) - takerTransactionFee);

                                                                        console.log(makerData[i].userid);
                                                                        // update base balance maker
                                                                        switch (data.baseCurrency) {
                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                        }
                                                                        // update balance of taker
                                                                        await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, takerTradeCurrBalData) => {
                                                                            if (error) {
                                                                                // error with updating maker data, go to next seller



                                                                                companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                step(++i);


                                                                            }
                                                                            // successfully updated maker base currency balance
                                                                            else if (takerTradeCurrBalData) {

                                                                                // update balance of company
                                                                                switch (data.baseCurrency) {
                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                }
                                                                                // update base currency balance of company                                                                                            
                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                    if (error) {
                                                                                        // error with updating company base currency balance. Revert maker balance and go to next seller


                                                                                        // revert maker balance
                                                                                        makerBaseCurrencyBalance -= ((takerData.volume * takerData.price) - takerTransactionFee);

                                                                                        // update base balance maker
                                                                                        switch (data.baseCurrency) {
                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                        }

                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                            if (error) {
                                                                                                res.json({ 'message': 'Error with updating balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                            }
                                                                                            else {
                                                                                                companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                step(++i);
                                                                                            }
                                                                                        });


                                                                                    }
                                                                                    // successfully updated compnay base currency balance
                                                                                    else {

                                                                                        // transaction fee from maker balance
                                                                                        var makerTransactionFee = (takerData.volume * 1.5) / 100;
                                                                                        companyTradeCurrencyBalance += makerTransactionFee;



                                                                                        // update taker trade balance
                                                                                        takerTradeCurrencyBalance += (takerData.volume - makerTransactionFee);

                                                                                        // update balance taker
                                                                                        switch (data.tradingCurrency) {
                                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                        }
                                                                                        await clientBalanceModel.findByIdAndUpdate(takerData.userid, takerUpdateBalance, async (error, takerBaseCurrBalData) => {
                                                                                            if (error) {
                                                                                                // revert maker, company base currency balances and trade currency balance of maker and go to next seller
                                                                                                makerBaseCurrencyBalance -= ((takerData.volume * takerData.price) - takerTransactionFee);

                                                                                                // update base balance maker
                                                                                                switch (data.baseCurrency) {
                                                                                                    case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, makerUpBTCBalData) => {
                                                                                                    if (error) {
                                                                                                        res.json({ 'message': 'Error with reverting base balance of maker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                    }
                                                                                                    else {


                                                                                                        // revert company taker transaction fee
                                                                                                        companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                        // update balance of company
                                                                                                        switch (data.baseCurrency) {
                                                                                                            case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting company base balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {


                                                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                step(++i);


                                                                                                            }
                                                                                                        });



                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                            //successfully updated taker trade currency balance
                                                                                            else {
                                                                                                // update trade balance of company
                                                                                                switch (data.tradingCurrency) {
                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                // update company trade currency balance data
                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyBaseCurrBalData) => {
                                                                                                    if (error) {
                                                                                                        // revert maker, company base currency balances and taker trade currency balance and go to next seller
                                                                                                        makerBaseCurrencyBalance -= ((takerData.volume * takerData.price) - takerTransactionFee);

                                                                                                        // update base balance maker
                                                                                                        switch (data.baseCurrency) {
                                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, makerUpBTCBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting base currency balance of maker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {


                                                                                                                // revert company taker transaction fee
                                                                                                                companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                // update balance of company
                                                                                                                switch (data.baseCurrency) {
                                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                }
                                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                                    if (error) {
                                                                                                                        res.json({ 'message': 'Error with reverting company base balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                                    }
                                                                                                                    else {


                                                                                                                        // revert taker trade currency balance
                                                                                                                        takerTradeCurrencyBalance -= (takerData.volume - makerTransactionFee);

                                                                                                                        // update balance taker
                                                                                                                        switch (data.tradingCurrency) {
                                                                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                        }
                                                                                                                        await clientBalanceModel.findByIdAndUpdate(takerData.userid, takerUpdateBalance, async (error, tkaerUpETHBalData) => {
                                                                                                                            if (error) {
                                                                                                                                res.json({ 'message': 'Error with reverting taker trade currency balance, transaction failed, try after sometime', 'error': 'true', 'data': 'null' });
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
                                                                                                    // successfully updated company trade currency balance
                                                                                                    else if (companyBaseCurrBalData) {
                                                                                                        // all balances successfully updated in the database now start updating order history
                                                                                                        // update order book of maker
                                                                                                        await orderBookModel.findOneAndUpdate({ userid: makerData[i].userid }, { volume: (makerData[i].volume - takerData.volume) }, async (error, makerObData) => {
                                                                                                            if (error) {
                                                                                                                var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                res.json({ 'message': 'Transfer successful, Error updating the order book of maker', 'error': 'true', 'data': transferData });
                                                                                                            }
                                                                                                            // successfully updated order book of maker
                                                                                                            else {
                                                                                                                // update order book of taker
                                                                                                                await orderBookModel.findOneAndUpdate({ userid: takerData.userid }, { flag: 'false' }, async (error, takerObData) => {
                                                                                                                    if (error) {
                                                                                                                        var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                        res.json({ 'message': 'Transfer Successful, Error updating the order book of taker', 'error': 'true', 'data': transferData });
                                                                                                                    }
                                                                                                                    // successfully updated order book of taker
                                                                                                                    else {
                                                                                                                        // update order history
                                                                                                                        var orderHistoryData = {
                                                                                                                            makerId: makerData[i].userid, takerId: takerData.userid, baseCurrency: takerData.baseCurrency,
                                                                                                                            tradingCurrency: takerData.tradingCurrency, purpose: takerData.purpose, volume: takerData.volume,
                                                                                                                            price: takerData.price, time: takerData.time, flag: 'false'
                                                                                                                        };

                                                                                                                        orderHistoryData = new orderHistoryModel(orderHistoryData);
                                                                                                                        await orderHistoryData.save(async (error, odHistoryData) => {
                                                                                                                            if (error) {

                                                                                                                                res.json({ 'message': 'Transaction successful, Error with saving order history', 'error': 'true', 'data': 'null' });
                                                                                                                            }
                                                                                                                            // successfully updated order history
                                                                                                                            else {

                                                                                                                                res.json({ 'message': 'Transfer Successful, Successfully updated all the reports', 'error': 'false', 'data': 'null' });
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




                                                                        // calculate transaction fee from taker balance
                                                                        var takerTransactionFee = (takerData.price * makerData[i].volume * 1.5) / 100;
                                                                        companyBaseCurrencyBalance += takerTransactionFee;
                                                                        makerBaseCurrencyBalance += ((makerData[i].volume * takerData.price) - takerTransactionFee);

                                                                        // update base balance maker
                                                                        switch (data.baseCurrency) {
                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                break;
                                                                        }
                                                                        // update balance of taker
                                                                        await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, takerTradeCurrBalData) => {
                                                                            if (error) {
                                                                                // error with updating maker data, go to next seller



                                                                                companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                step(++i);

                                                                            }
                                                                            // successfully updated maker base currency balance
                                                                            else if (takerTradeCurrBalData) {

                                                                                // update balance of company
                                                                                switch (data.baseCurrency) {
                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                        break;
                                                                                }
                                                                                // update base currency balance of company                                                                                            
                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                    if (error) {
                                                                                        // error with updating company base currency balance. Revert maker balances and go to next seller


                                                                                        // revert maker balance
                                                                                        makerBaseCurrencyBalance -= ((makerData[i].volume * takerData.price) - takerTransactionFee);

                                                                                        // update base balance maker
                                                                                        switch (data.baseCurrency) {
                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                break;
                                                                                        }

                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, takerUpBTCBalData) => {
                                                                                            if (error) {
                                                                                                res.json({ 'message': 'Error with updating balance of taker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                            }
                                                                                            else {
                                                                                                companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                step(++i);
                                                                                            }
                                                                                        });


                                                                                    }
                                                                                    // successfully updated compnay base currency balance
                                                                                    else if (companyTradeCurrBalData) {

                                                                                        // transaction fee from maker balance
                                                                                        var makerTransactionFee = (makerData[i].volume * 1.5) / 100;
                                                                                        companyTradeCurrencyBalance += makerTransactionFee;



                                                                                        // update taker trade balance
                                                                                        takerTradeCurrencyBalance += (makerData[i].volume - makerTransactionFee);

                                                                                        // update balance taker
                                                                                        switch (data.tradingCurrency) {
                                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                break;
                                                                                        }
                                                                                        await clientBalanceModel.findByIdAndUpdate(takerData.userid, takerUpdateBalance, async (error, takerBaseCurrBalData) => {
                                                                                            if (error) {
                                                                                                // revert maker, company base currency balances and trade currency balance of maker and go to next seller
                                                                                                makerBaseCurrencyBalance -= ((makerData[i].volume * takerData.price) - takerTransactionFee);

                                                                                                // update base balance maker
                                                                                                switch (data.baseCurrency) {
                                                                                                    case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, makerUpBTCBalData) => {
                                                                                                    if (error) {
                                                                                                        res.json({ 'message': 'Error with reverting base balance of maker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                    }
                                                                                                    else {


                                                                                                        // revert company taker transaction fee
                                                                                                        companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                        // update balance of company
                                                                                                        switch (data.baseCurrency) {
                                                                                                            case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting company base balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {


                                                                                                                companyTradeCurrencyBalance -= makerTransactionFee;
                                                                                                                step(++i);

                                                                                                            }
                                                                                                        });



                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                            //successfully updated taker trade currency balance
                                                                                            else if (takerBaseCurrBalData) {
                                                                                                // update trade balance of company
                                                                                                switch (data.tradingCurrency) {
                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyTradeCurrencyBalance };
                                                                                                        break;
                                                                                                }
                                                                                                // update company base currency balance data
                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyBaseCurrBalData) => {
                                                                                                    if (error) {
                                                                                                        // revert maker, company base currency balances and maker, taker trade currency balance and go to next seller
                                                                                                        makerBaseCurrencyBalance -= ((makerData[i].volume * takerData.price) - takerTransactionFee);

                                                                                                        // update base balance maker
                                                                                                        switch (data.baseCurrency) {
                                                                                                            case 'BTC': var makerUpdateBalance = { BTCBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'ETH': var makerUpdateBalance = { ETHBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'BCH': var makerUpdateBalance = { BCHBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'CRMT': var makerUpdateBalance = { CRMTBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'USDT': var makerUpdateBalance = { USDTBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                            case 'INR': var makerUpdateBalance = { INRBalance: makerBaseCurrencyBalance };
                                                                                                                break;
                                                                                                        }
                                                                                                        await clientBalanceModel.findByIdAndUpdate(makerData[i].userid, makerUpdateBalance, async (error, makerUpBTCBalData) => {
                                                                                                            if (error) {
                                                                                                                res.json({ 'message': 'Error with reverting base currency balance of maker, transaction failed try after sometime', 'error': 'true', 'data': 'null' });
                                                                                                            }
                                                                                                            else {


                                                                                                                // revert company taker transaction fee
                                                                                                                companyBaseCurrencyBalance -= takerTransactionFee;
                                                                                                                // update balance of company
                                                                                                                switch (data.baseCurrency) {
                                                                                                                    case 'BTC': var companyUpdateBalance = { BTCBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'ETH': var companyUpdateBalance = { ETHBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'BCH': var companyUpdateBalance = { BCHBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'CRMT': var companyUpdateBalance = { CRMTBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'USDT': var companyUpdateBalance = { USDTBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                    case 'INR': var companyUpdateBalance = { INRBalance: companyBaseCurrencyBalance };
                                                                                                                        break;
                                                                                                                }
                                                                                                                await clientBalanceModel.findByIdAndUpdate(companyId, companyUpdateBalance, async (error, companyTradeCurrBalData) => {
                                                                                                                    if (error) {
                                                                                                                        res.json({ 'message': 'Error with reverting company base balance, transaction failed', 'error': 'true', 'data': 'null' });
                                                                                                                    }
                                                                                                                    else {


                                                                                                                        // revert taker trade currency balance
                                                                                                                        takerTradeCurrencyBalance -= (makerData[i].volume - makerTransactionFee);

                                                                                                                        // update balance taker
                                                                                                                        switch (data.tradingCurrency) {
                                                                                                                            case 'BTC': var takerUpdateBalance = { BTCBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'ETH': var takerUpdateBalance = { ETHBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'BCH': var takerUpdateBalance = { BCHBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'CRMT': var takerUpdateBalance = { CRMTBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'USDT': var takerUpdateBalance = { USDTBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                            case 'INR': var takerUpdateBalance = { INRBalance: takerTradeCurrencyBalance };
                                                                                                                                break;
                                                                                                                        }
                                                                                                                        await clientBalanceModel.findByIdAndUpdate(takerData.userid, takerUpdateBalance, async (error, tkaerUpETHBalData) => {
                                                                                                                            if (error) {
                                                                                                                                res.json({ 'message': 'Error with reverting taker trade currency balance, transaction failed, try after sometime', 'error': 'true', 'data': 'null' });
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
                                                                                                    // successfully updated company trade currency balance
                                                                                                    else if (companyBaseCurrBalData) {
                                                                                                        // all balances successfully updated in the database now start updating order history
                                                                                                        // update order book of maker
                                                                                                        await orderBookModel.findOneAndUpdate({ userid: makerData[i].userid }, { flag: 'false' }, async (error, makerObData) => {
                                                                                                            if (error) {
                                                                                                                var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                res.json({ 'message': 'Transfer successful, Error updating the order book of maker', 'error': 'true', 'data': transferData });
                                                                                                            }
                                                                                                            // successfully updated order book of maker
                                                                                                            else {
                                                                                                                // update order book of taker
                                                                                                                await orderBookModel.findOneAndUpdate({ userid: takerData.userid }, { volume: (takerData.volume - makerData[i].volume) }, async (error, takerObData) => {
                                                                                                                    if (error) {
                                                                                                                        var transferData = { makerBalanceData: makerBaseCurrBalData, takerBalanceData: takerBaseCurrBalData, companyBalanceData: companyBaseCurrBalData };
                                                                                                                        res.json({ 'message': 'Transfer Successful, Error updating the order book of taker', 'error': 'true', 'data': transferData });
                                                                                                                    }
                                                                                                                    // successfully updated order book of taker
                                                                                                                    else {
                                                                                                                        // update order history
                                                                                                                        var orderHistoryData = {
                                                                                                                            makerId: makerData[i].userid, takerId: takerData.userid, baseCurrency: takerData.baseCurrency,
                                                                                                                            tradingCurrency: takerData.tradingCurrency, purpose: takerData.purpose, volume: makerData[i].volume,
                                                                                                                            price: takerData.price, time: takerData.time, flag: 'false'
                                                                                                                        };

                                                                                                                        orderHistoryData = new orderHistoryModel(orderHistoryData);
                                                                                                                        await orderHistoryData.save(async (error, odHistoryData) => {
                                                                                                                            if (error) {

                                                                                                                                res.json({ 'message': 'Transaction successful, Error with saving order history', 'error': 'true', 'data': 'null' });
                                                                                                                            }
                                                                                                                            // successfully updated order history
                                                                                                                            else {

                                                                                                                                res.json({ 'message': 'Transfer Successful, Successfully updated all the reports', 'error': 'false', 'data': 'null' });
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
                            });
                        }
                    }
                });
            }
        }
    });

});

module.exports = router;                                                                                                                                                                 