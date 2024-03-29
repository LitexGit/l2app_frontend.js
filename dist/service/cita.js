"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("../main");
var common_1 = require("../utils/common");
var constants_1 = require("../utils/constants");
var ethPendingTxStore_1 = require("../ethPendingTxStore");
var web3_utils_1 = require("web3/node_modules/web3-utils");
var ethHelper_1 = require("../utils/ethHelper");
exports.events = {
    ConfirmUserWithdraw: {
        filter: function () {
            return { user: main_1.user };
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, channelID, user, confirmer, amount, lastCommitBlock, isAllConfirmed, providerSignature, regulatorSignature, transactionHash, txData;
            return __generator(this, function (_b) {
                common_1.logger.info('--------------------Handle CITA ConfirmUserWithdraw--------------------');
                _a = event.returnValues, channelID = _a.channelID, user = _a.user, confirmer = _a.confirmer, amount = _a.amount, lastCommitBlock = _a.lastCommitBlock, isAllConfirmed = _a.isAllConfirmed, providerSignature = _a.providerSignature, regulatorSignature = _a.regulatorSignature, transactionHash = event.transactionHash;
                common_1.logger.info(' channelID: [%s], user: [%s], confirmer: [%s], amount: [%s], lastCommitBlock: [%s], isAllConfirmed: [%s], providerSignature: [%s], regulatorSignature: [%s]', channelID, user, confirmer, amount, lastCommitBlock, isAllConfirmed, providerSignature, regulatorSignature);
                if (isAllConfirmed === false) {
                    return [2];
                }
                common_1.logger.info('Receive ConfirmUserWithdraw event, will try to submit eth withdraw tx %s', transactionHash);
                txData = main_1.ethPN.methods
                    .userWithdraw(channelID, amount, lastCommitBlock, providerSignature, regulatorSignature, user)
                    .encodeABI();
                common_1.sendEthTx(main_1.web3, user, main_1.ethPN.options.address, 0, txData);
                return [2];
            });
        }); },
    },
    ConfirmCooperativeSettle: {
        filter: function () {
            return { user: main_1.user };
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, channelID, user, confirmer, balance, lastCommitBlock, isAllConfirmed, providerSignature, regulatorSignature, transactionHash;
            return __generator(this, function (_b) {
                common_1.logger.info('--------------------Handle CITA ConfirmCooperativeSettle--------------------');
                _a = event.returnValues, channelID = _a.channelID, user = _a.user, confirmer = _a.confirmer, balance = _a.balance, lastCommitBlock = _a.lastCommitBlock, isAllConfirmed = _a.isAllConfirmed, providerSignature = _a.providerSignature, regulatorSignature = _a.regulatorSignature, transactionHash = event.transactionHash;
                common_1.logger.info(' channelID: [%s], user: [%s], confirmer: [%s], balance: [%s], lastCommitBlock: [%s], isAllConfirmed: [%s], providerSignature: [%s], regulatorSignature: [%s] ', channelID, user, confirmer, balance, lastCommitBlock, isAllConfirmed, providerSignature, regulatorSignature);
                if (isAllConfirmed === false) {
                    return [2];
                }
                main_1.cancelListener.add({
                    channelID: channelID,
                    balance: balance,
                    lastCommitBlock: Number(lastCommitBlock),
                });
                return [2];
            });
        }); },
    },
    Transfer: {
        filter: function () {
            return {};
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, from, to, channelID, balance, transferAmount, additionalHash, amount, time, channelInfo, _b, token, userBalance, transferEvent;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        common_1.logger.info('--------------------Handle CITA Transfer--------------------');
                        _a = event.returnValues, from = _a.from, to = _a.to, channelID = _a.channelID, balance = _a.balance, transferAmount = _a.transferAmount, additionalHash = _a.additionalHash;
                        if (to.toLowerCase() !== main_1.user.toLowerCase() &&
                            from.toLowerCase() !== main_1.user.toLowerCase()) {
                            return [2];
                        }
                        common_1.logger.info(' from: [%s], to: [%s], channelID: [%s], balance: [%s], transferAmount: [%s], additionalHash: [%s] ', from, to, channelID, balance, transferAmount, additionalHash);
                        if (!main_1.callbacks.get('Transfer')) return [3, 6];
                        amount = transferAmount;
                        time = 0;
                        _c.label = 1;
                    case 1:
                        if (!(time < constants_1.CITA_SYNC_EVENT_TIMEOUT)) return [3, 4];
                        return [4, main_1.appPN.methods
                                .balanceProofMap(channelID, to)
                                .call()];
                    case 2:
                        channelInfo = _c.sent();
                        if (web3_utils_1.toBN(channelInfo.balance).gte(web3_utils_1.toBN(balance))) {
                            return [3, 4];
                        }
                        return [4, common_1.delay(1000)];
                    case 3:
                        _c.sent();
                        time++;
                        return [3, 1];
                    case 4: return [4, main_1.appPN.methods
                            .channelMap(channelID)
                            .call()];
                    case 5:
                        _b = _c.sent(), token = _b.token, userBalance = _b.userBalance;
                        transferEvent = {
                            from: from,
                            to: to,
                            token: token,
                            amount: amount,
                            additionalHash: additionalHash,
                            totalTransferredAmount: balance,
                            balance: userBalance,
                        };
                        main_1.callbacks.get('Transfer')(null, transferEvent);
                        _c.label = 6;
                    case 6:
                        if (to.toLowerCase() === main_1.user.toLowerCase()) {
                            exports.appMethods.appSubmitGuardProof(channelID, to);
                        }
                        return [2];
                }
            });
        }); },
    },
    OnchainAddPuppet: {
        filter: function () {
            return { user: main_1.user };
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, user, puppet, puppetChangeEvent;
            return __generator(this, function (_b) {
                common_1.logger.info('--------------------Handle CITA OnchainAddPuppet--------------------');
                _a = event.returnValues, user = _a.user, puppet = _a.puppet;
                common_1.logger.info('user: [%s], puppet: [%s]', user, puppet);
                puppetChangeEvent = { user: user, puppet: puppet, type: 1 };
                main_1.callbacks.get('PuppetChanged') &&
                    main_1.callbacks.get('PuppetChanged')(null, puppetChangeEvent);
                return [2];
            });
        }); },
    },
    OnchainDisablePuppet: {
        filter: function () {
            return { user: main_1.user };
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, user, puppet, puppetChangeEvent;
            return __generator(this, function (_b) {
                common_1.logger.info('--------------------Handle CITA OnchainDisablePuppet--------------------');
                _a = event.returnValues, user = _a.user, puppet = _a.puppet;
                common_1.logger.info('user: [%s], puppet: [%s]', user, puppet);
                puppetChangeEvent = { user: user, puppet: puppet, type: 2 };
                main_1.callbacks.get('PuppetChanged') &&
                    main_1.callbacks.get('PuppetChanged')(null, puppetChangeEvent);
                return [2];
            });
        }); },
    },
    OnchainOpenChannel: {
        filter: function () {
            return { user: main_1.user };
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, user, token, amount, channelID, transactionHash, time, channelInfo, txhash, depositEvent;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        common_1.logger.info('--------------------Handle CITA OnchainOpenChannel--------------------');
                        _a = event.returnValues, user = _a.user, token = _a.token, amount = _a.amount, channelID = _a.channelID, transactionHash = event.transactionHash;
                        common_1.logger.info(' user: [%s], token: [%s], amount: [%s], channelID: [%s] ', user, token, amount, channelID);
                        if (web3_utils_1.toBN(amount).eq(web3_utils_1.toBN(0))) {
                            common_1.logger.info('channel opened by provider, not emit event');
                            return [2];
                        }
                        if (!main_1.callbacks.get('Deposit')) return [3, 7];
                        time = 0;
                        channelInfo = void 0;
                        _b.label = 1;
                    case 1:
                        if (!(time < constants_1.CITA_SYNC_EVENT_TIMEOUT)) return [3, 4];
                        return [4, main_1.appPN.methods.channelMap(channelID).call()];
                    case 2:
                        channelInfo = _b.sent();
                        if (web3_utils_1.toBN(channelInfo.userDeposit).gte(web3_utils_1.toBN(amount))) {
                            return [3, 4];
                        }
                        return [4, common_1.delay(1000)];
                    case 3:
                        _b.sent();
                        time++;
                        return [3, 1];
                    case 4: return [4, common_1.extractEthTxHashFromAppTx(transactionHash)];
                    case 5:
                        txhash = _b.sent();
                        main_1.ethPendingTxStore.setTokenAllowance(token, '0');
                        return [4, main_1.ethPendingTxStore.removeTx(txhash)];
                    case 6:
                        _b.sent();
                        depositEvent = {
                            user: user,
                            type: 1,
                            token: token,
                            amount: amount,
                            totalDeposit: amount,
                            txhash: txhash,
                            balance: channelInfo.userBalance,
                        };
                        main_1.callbacks.get('Deposit')(null, depositEvent);
                        _b.label = 7;
                    case 7: return [2];
                }
            });
        }); },
    },
    OnchainUserDeposit: {
        filter: function () {
            return { user: main_1.user };
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, channelID, user, deposit, totalDeposit, transactionHash, time, channelInfo, _b, token, userBalance, txhash, depositEvent;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        common_1.logger.info('--------------------Handle CITA OnchainUserDeposit--------------------');
                        _a = event.returnValues, channelID = _a.channelID, user = _a.user, deposit = _a.deposit, totalDeposit = _a.totalDeposit, transactionHash = event.transactionHash;
                        common_1.logger.info(' channelID: [%s], user: [%s], deposit: [%s], totalDeposit: [%s] ', channelID, user, deposit, totalDeposit);
                        if (!main_1.callbacks.get('Deposit')) return [3, 8];
                        time = 0;
                        _c.label = 1;
                    case 1:
                        if (!(time < constants_1.CITA_SYNC_EVENT_TIMEOUT)) return [3, 4];
                        return [4, main_1.appPN.methods.channelMap(channelID).call()];
                    case 2:
                        channelInfo = _c.sent();
                        if (web3_utils_1.toBN(channelInfo.userDeposit).gte(totalDeposit)) {
                            return [3, 4];
                        }
                        return [4, common_1.delay(1000)];
                    case 3:
                        _c.sent();
                        time++;
                        return [3, 1];
                    case 4: return [4, main_1.appPN.methods
                            .channelMap(channelID)
                            .call()];
                    case 5:
                        _b = _c.sent(), token = _b.token, userBalance = _b.userBalance;
                        return [4, common_1.extractEthTxHashFromAppTx(transactionHash)];
                    case 6:
                        txhash = _c.sent();
                        main_1.ethPendingTxStore.setTokenAllowance(token, '0');
                        return [4, main_1.ethPendingTxStore.removeTx(txhash)];
                    case 7:
                        _c.sent();
                        depositEvent = {
                            user: user,
                            type: 2,
                            token: token,
                            amount: deposit,
                            totalDeposit: totalDeposit,
                            txhash: txhash,
                            balance: userBalance,
                        };
                        main_1.callbacks.get('Deposit')(null, depositEvent);
                        _c.label = 8;
                    case 8: return [2];
                }
            });
        }); },
    },
    OnchainUserWithdraw: {
        filter: function () {
            return { user: main_1.user };
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, channelID, user, amount, totalWithdraw, lastCommitBlock, transactionHash, time, channelInfo, _b, token, userBalance, txhash, withdrawEvent;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        common_1.logger.info('--------------------Handle CITA OnchainUserWithdraw--------------------');
                        _a = event.returnValues, channelID = _a.channelID, user = _a.user, amount = _a.amount, totalWithdraw = _a.withdraw, lastCommitBlock = _a.lastCommitBlock, transactionHash = event.transactionHash;
                        common_1.logger.info(' channelID: [%s], user: [%s], amount: [%s], totalWithdraw: [%s], lastCommitBlock: [%s], ', channelID, user, amount, totalWithdraw, lastCommitBlock);
                        if (!main_1.callbacks.get('Withdraw')) return [3, 8];
                        time = 0;
                        _c.label = 1;
                    case 1:
                        if (!(time < constants_1.CITA_SYNC_EVENT_TIMEOUT)) return [3, 4];
                        return [4, main_1.appPN.methods.channelMap(channelID).call()];
                    case 2:
                        channelInfo = _c.sent();
                        if (web3_utils_1.toBN(channelInfo.userWithdraw).gte(web3_utils_1.toBN(totalWithdraw))) {
                            return [3, 4];
                        }
                        return [4, common_1.delay(1000)];
                    case 3:
                        _c.sent();
                        time++;
                        return [3, 1];
                    case 4: return [4, main_1.appPN.methods
                            .channelMap(channelID)
                            .call()];
                    case 5:
                        _b = _c.sent(), token = _b.token, userBalance = _b.userBalance;
                        return [4, common_1.extractEthTxHashFromAppTx(transactionHash)];
                    case 6:
                        txhash = _c.sent();
                        return [4, main_1.ethPendingTxStore.removeTx(txhash)];
                    case 7:
                        _c.sent();
                        withdrawEvent = {
                            user: user,
                            type: 1,
                            token: token,
                            amount: amount,
                            totalWithdraw: totalWithdraw,
                            txhash: txhash,
                            balance: userBalance,
                        };
                        main_1.callbacks.get('Withdraw')(null, withdrawEvent);
                        _c.label = 8;
                    case 8: return [2];
                }
            });
        }); },
    },
    OnchainCooperativeSettleChannel: {
        filter: function () {
            return { user: main_1.user };
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, channelID, user, token, balance, lastCommitBlock, transactionHash, txhash, withdrawEvent, time, channelInfo;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        common_1.logger.info('--------------------Handle CITA OnchainCooperativeSettleChannel--------------------');
                        _a = event.returnValues, channelID = _a.channelID, user = _a.user, token = _a.token, balance = _a.balance, lastCommitBlock = _a.lastCommitBlock, transactionHash = event.transactionHash;
                        common_1.logger.info(' channelID: [%s], user: [%s], token: [%s], balance: [%s], lastCommitBlock: [%s] ', channelID, user, token, balance, lastCommitBlock);
                        return [4, common_1.extractEthTxHashFromAppTx(transactionHash)];
                    case 1:
                        txhash = _b.sent();
                        return [4, main_1.ethPendingTxStore.removeTx(txhash)];
                    case 2:
                        _b.sent();
                        return [4, main_1.cancelListener.remove(channelID)];
                    case 3:
                        _b.sent();
                        withdrawEvent = {
                            user: user,
                            type: 2,
                            token: token,
                            amount: balance,
                            totalWithdraw: '',
                            txhash: txhash,
                            balance: '0',
                        };
                        if (!main_1.callbacks.get('Withdraw')) return [3, 8];
                        time = 0;
                        _b.label = 4;
                    case 4:
                        if (!(time < constants_1.CITA_SYNC_EVENT_TIMEOUT)) return [3, 7];
                        return [4, main_1.appPN.methods.channelMap(channelID).call()];
                    case 5:
                        channelInfo = _b.sent();
                        if (Number(channelInfo.status) ===
                            constants_1.CHANNEL_STATUS.CHANNEL_STATUS_SETTLE) {
                            return [3, 7];
                        }
                        return [4, common_1.delay(1000)];
                    case 6:
                        _b.sent();
                        time++;
                        return [3, 4];
                    case 7:
                        main_1.callbacks.get('Withdraw')(null, withdrawEvent);
                        _b.label = 8;
                    case 8: return [2];
                }
            });
        }); },
    },
    OnchainSettleChannel: {
        filter: function () {
            return { user: main_1.user };
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, channelID, user, token, transferTouserAmount, transferToProviderAmount, transactionHash, closer, txhash, forceWithdrawEvent;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        common_1.logger.info('--------------------Handle CITA OnchainSettleChannel--------------------');
                        _a = event.returnValues, channelID = _a.channelID, user = _a.user, token = _a.token, transferTouserAmount = _a.userSettleAmount, transferToProviderAmount = _a.providerSettleAmount, transactionHash = event.transactionHash;
                        common_1.logger.info(' channelID: [%s], user: [%s], token: [%s], transferTouserAmount: [%s], transferToProviderAmount: [%s], ', channelID, user, token, transferTouserAmount, transferToProviderAmount);
                        return [4, main_1.appPN.methods.closingChannelMap(channelID).call()];
                    case 1:
                        closer = (_b.sent()).closer;
                        return [4, common_1.extractEthTxHashFromAppTx(transactionHash)];
                    case 2:
                        txhash = _b.sent();
                        return [4, main_1.ethPendingTxStore.removeTx(txhash)];
                    case 3:
                        _b.sent();
                        forceWithdrawEvent = {
                            closer: closer,
                            token: token,
                            userSettleAmount: transferTouserAmount,
                            providerSettleAmount: transferToProviderAmount,
                            txhash: txhash,
                            balance: '0',
                        };
                        main_1.callbacks.get('ForceWithdraw') &&
                            main_1.callbacks.get('ForceWithdraw')(null, forceWithdrawEvent);
                        return [2];
                }
            });
        }); },
    },
};
exports.ethMethods = {
    ethSubmitUserWithdraw: function (channelID, duration) {
        if (duration === void 0) { duration = 0; }
        return __awaiter(_this, void 0, void 0, function () {
            var _a, isConfirmed, withdraw, providerSignature, regulatorSignature, lastCommitBlock, receiver, currentBlockNumber, txData;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, common_1.delay(duration)];
                    case 1:
                        _b.sent();
                        return [4, Promise.all([
                                main_1.appPN.methods.userWithdrawProofMap(channelID).call(),
                            ])];
                    case 2:
                        _a = (_b.sent())[0], isConfirmed = _a.isConfirmed, withdraw = _a.amount, providerSignature = _a.providerSignature, regulatorSignature = _a.regulatorSignature, lastCommitBlock = _a.lastCommitBlock, receiver = _a.receiver;
                        common_1.logger.info('userWithdrawProofMap: isConfirmed: [%s], withdraw: [%s], providerSignature: [%s], regulatorSignature: [%s], lastCommitBlock: [%s], receiver: [%s]', isConfirmed, withdraw, providerSignature, regulatorSignature, lastCommitBlock, receiver);
                        if (!isConfirmed) {
                            common_1.logger.info('userWithdrawProofMap not confirmed');
                            return [2];
                        }
                        return [4, ethHelper_1.ethHelper.getBlockNumber()];
                    case 3:
                        currentBlockNumber = _b.sent();
                        if (web3_utils_1.toBN(currentBlockNumber).gt(web3_utils_1.toBN(lastCommitBlock))) {
                            common_1.logger.info('unlock user withdraw now');
                            common_1.sendAppTx(main_1.appPN.methods.unlockUserWithdrawProof(channelID), 'appPN.methods.unlockUserWithdrawProof');
                        }
                        else {
                            common_1.logger.info('submit user withdraw now');
                            txData = main_1.ethPN.methods
                                .userWithdraw(channelID, withdraw, lastCommitBlock, providerSignature, regulatorSignature, receiver)
                                .encodeABI();
                            common_1.sendEthTx(main_1.web3, main_1.user, main_1.ethPN.options.address, 0, txData);
                        }
                        return [2];
                }
            });
        });
    },
    ethSubmitCooperativeSettle: function (channelID) { return __awaiter(_this, void 0, void 0, function () {
        var _a, isConfirmed, settleBalance, lastCommitBlock, providerSignature, regulatorSignature, currentBlockNumber, txData, res, token;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, main_1.appPN.methods.cooperativeSettleProofMap(channelID).call()];
                case 1:
                    _a = _b.sent(), isConfirmed = _a.isConfirmed, settleBalance = _a.balance, lastCommitBlock = _a.lastCommitBlock, providerSignature = _a.providerSignature, regulatorSignature = _a.regulatorSignature;
                    common_1.logger.info('cooperativeSettleProof: channelID: [%s], isConfirmed: [%s], balance: [%s], lastCommitBlock: [%s], providerSignature: [%s], regulatorSignature: [%s]', channelID, isConfirmed, settleBalance, lastCommitBlock, providerSignature, regulatorSignature);
                    if (!isConfirmed) {
                        common_1.logger.info('cooperativeSettleProof not confirmed');
                        return [2, null];
                    }
                    return [4, ethHelper_1.ethHelper.getBlockNumber()];
                case 2:
                    currentBlockNumber = _b.sent();
                    if (!web3_utils_1.toBN(currentBlockNumber).gt(web3_utils_1.toBN(lastCommitBlock))) return [3, 4];
                    return [4, common_1.sendAppTx(main_1.appPN.methods.unlockCooperativeSettle(channelID), 'appPN.methods.unlockCooperativeSettle')];
                case 3: return [2, _b.sent()];
                case 4:
                    txData = main_1.ethPN.methods
                        .cooperativeSettle(channelID, settleBalance, lastCommitBlock, providerSignature, regulatorSignature)
                        .encodeABI();
                    return [4, common_1.sendEthTx(main_1.web3, main_1.user, main_1.ethPN.options.address, 0, txData)];
                case 5:
                    res = _b.sent();
                    return [4, main_1.appPN.methods.channelMap(channelID).call()];
                case 6:
                    token = (_b.sent()).token;
                    main_1.ethPendingTxStore.addTx({
                        channelID: channelID,
                        txHash: res,
                        user: main_1.user,
                        token: token,
                        type: ethPendingTxStore_1.TX_TYPE.CHANNEL_CO_SETTLE,
                        amount: settleBalance + '',
                        time: new Date().getTime(),
                    });
                    return [2, res];
            }
        });
    }); },
    ethSettleChannel: function (channelID) { return __awaiter(_this, void 0, void 0, function () {
        var txData;
        return __generator(this, function (_a) {
            txData = main_1.ethPN.methods.settleChannel(channelID).encodeABI();
            common_1.sendEthTx(main_1.web3, main_1.user, main_1.ethPN.options.address, 0, txData);
            return [2];
        });
    }); },
};
exports.appMethods = {
    appSubmitGuardProof: function (channelID, to) { return __awaiter(_this, void 0, void 0, function () {
        var _a, balance, nonce, additionalHash, signature, consignorSignature, messageHash, appTx, res, receipt;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, common_1.delay(2 * constants_1.CITA_TX_BLOCK_INTERVAL)];
                case 1:
                    _b.sent();
                    return [4, main_1.appPN.methods.balanceProofMap(channelID, to).call()];
                case 2:
                    _a = _b.sent(), balance = _a.balance, nonce = _a.nonce, additionalHash = _a.additionalHash, signature = _a.signature, consignorSignature = _a.consignorSignature;
                    common_1.logger.info('balanceProof:  balance: [%s], nonce: [%s], additionalHash: [%s], signature: [%s], consignorSignature: [%s]', balance, nonce, additionalHash, signature, consignorSignature);
                    if (consignorSignature != null) {
                        common_1.logger.info('balance proof already signed now');
                        return [2];
                    }
                    if (balance === '0') {
                        common_1.logger.info('no balance proof now');
                        return [2];
                    }
                    messageHash = web3_utils_1.soliditySha3({ t: 'address', v: main_1.ethPN.options.address }, { t: 'bytes32', v: channelID }, { t: 'uint256', v: balance }, { t: 'uint256', v: nonce }, { t: 'bytes32', v: additionalHash }, { t: 'bytes', v: signature });
                    consignorSignature = common_1.myEcsignToHex(messageHash, main_1.puppet.getAccount().privateKey);
                    return [4, common_1.getAppTxOption()];
                case 3:
                    appTx = _b.sent();
                    common_1.logger.info('guardBalanceProof params: channelID: [%s], balance: [%s], nonce: [%s], additionalHash: [%s], signature: [%s], consignorSignature: [%s]', channelID, balance, nonce, additionalHash, signature, consignorSignature);
                    return [4, main_1.appPN.methods
                            .guardBalanceProof(channelID, balance, nonce, additionalHash, signature, consignorSignature)
                            .send(appTx)];
                case 4:
                    res = _b.sent();
                    if (!res.hash) return [3, 6];
                    return [4, main_1.cita.listeners.listenToTransactionReceipt(res.hash)];
                case 5:
                    receipt = _b.sent();
                    if (receipt.errorMessage) {
                        common_1.logger.error('[CITA] - guardBalanceProof', receipt.errorMessage);
                    }
                    else {
                        common_1.logger.info('submit cita tx success');
                    }
                    _b.label = 6;
                case 6: return [2];
            }
        });
    }); },
};
//# sourceMappingURL=cita.js.map