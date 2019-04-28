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
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("./utils/common");
var constants_1 = require("./utils/constants");
var main_1 = require("./main");
var TX_TYPE;
(function (TX_TYPE) {
    TX_TYPE[TX_TYPE["CHANNEL_OPEN"] = 1] = "CHANNEL_OPEN";
    TX_TYPE[TX_TYPE["CHANNEL_DEPOSIT"] = 2] = "CHANNEL_DEPOSIT";
    TX_TYPE[TX_TYPE["CHANNEL_WITHDRAW"] = 3] = "CHANNEL_WITHDRAW";
    TX_TYPE[TX_TYPE["CHANNEL_CO_SETTLE"] = 4] = "CHANNEL_CO_SETTLE";
    TX_TYPE[TX_TYPE["CHANNEL_FORCE_WITHDRAW"] = 5] = "CHANNEL_FORCE_WITHDRAW";
    TX_TYPE[TX_TYPE["TOKEN_APPROVE"] = 6] = "TOKEN_APPROVE";
})(TX_TYPE = exports.TX_TYPE || (exports.TX_TYPE = {}));
var EthPendingTxStore = (function () {
    function EthPendingTxStore() {
        this.key = 'ETHPendingStore_' + main_1.web3_10.utils.sha3(main_1.user + main_1.appPN.options.address);
    }
    EthPendingTxStore.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var txListStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, localStorage.getItem(this.key)];
                    case 1:
                        txListStr = _a.sent();
                        if (!!txListStr) {
                            this.txList = JSON.parse(localStorage.getItem(this.key));
                        }
                        else {
                            this.txList = new Array();
                        }
                        return [2];
                }
            });
        });
    };
    EthPendingTxStore.prototype.save = function () {
        localStorage.setItem(this.key, JSON.stringify(this.txList));
    };
    EthPendingTxStore.prototype.setTokenAllowance = function (token, allowance) {
        if (token === constants_1.ADDRESS_ZERO) {
            return;
        }
        var key = 'Allowance_' + main_1.web3_10.utils.sha3(main_1.user + '_' + token);
        localStorage.setItem(key, allowance);
    };
    EthPendingTxStore.prototype.getTokenAllowance = function (token) {
        if (token === constants_1.ADDRESS_ZERO) {
            return 0;
        }
        var key = 'Allowance_' + main_1.web3_10.utils.sha3(main_1.user + '_' + token);
        var allowance = localStorage.getItem(key);
        if (!allowance) {
            return 0;
        }
        return Number(allowance);
    };
    EthPendingTxStore.prototype.addTx = function (info) {
        if (!this.txList.map(function (item) { return item.txHash; }).includes(info.txHash)) {
            this.txList.push(info);
        }
        this.save();
    };
    EthPendingTxStore.prototype.removeTx = function (txHash) {
        var _this = this;
        this.txList.forEach(function (item, index) {
            if (item.txHash === txHash)
                _this.txList.splice(index, 1);
        });
        this.save();
    };
    EthPendingTxStore.prototype.getApproveEventFromLogs = function (logs) {
        return __awaiter(this, void 0, void 0, function () {
            var inputs, event, user, contractAddress, amount;
            return __generator(this, function (_a) {
                console.log('ERC20.options', main_1.ERC20.options);
                inputs = main_1.ERC20.options.jsonInterface.filter(function (item) { return item.name === 'Approval' && item.type === 'event'; })[0].inputs;
                console.log('inputs', inputs);
                console.log('logs[0]', logs[0]);
                event = main_1.web3_10.eth.abi.decodeLog(inputs, logs[0].data, logs[0].topics.slice(1));
                console.log(event);
                user = event.owner, contractAddress = event.spender, amount = event.value;
                return [2, { user: user, contractAddress: contractAddress, amount: amount }];
            });
        });
    };
    EthPendingTxStore.prototype.startWatch = function (web3) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, tx, txHash, type, token, _b, txStatus, logs, _c, user_1, amount, approveEvent, err_1, err_2;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!true) return [3, 14];
                        _i = 0, _a = this.txList;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 12];
                        tx = _a[_i];
                        txHash = tx.txHash, type = tx.type, token = tx.token;
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 10, , 11]);
                        return [4, web3.eth.getTransactionReceipt(txHash)];
                    case 3:
                        _b = _d.sent(), txStatus = _b.status, logs = _b.logs;
                        common_1.logger.info('txHash status', txHash, txStatus);
                        if (!(txStatus === true || txStatus === false)) return [3, 9];
                        console.log('tx is', tx);
                        if (!(type === TX_TYPE.TOKEN_APPROVE)) return [3, 8];
                        if (!txStatus) return [3, 8];
                        _d.label = 4;
                    case 4:
                        _d.trys.push([4, 6, , 7]);
                        return [4, this.getApproveEventFromLogs(logs)];
                    case 5:
                        _c = _d.sent(), user_1 = _c.user, amount = _c.amount;
                        approveEvent = {
                            user: user_1,
                            amount: amount,
                            token: tx.token,
                            txhash: txHash,
                            type: !!tx.channelID ? 1 : 0,
                        };
                        main_1.callbacks.get('TokenApproval') &&
                            main_1.callbacks.get('TokenApproval')(null, approveEvent);
                        return [3, 7];
                    case 6:
                        err_1 = _d.sent();
                        common_1.logger.error('emit TokenApproval event fail', err_1);
                        return [3, 7];
                    case 7:
                        this.setTokenAllowance(token, '1');
                        _d.label = 8;
                    case 8:
                        if (type === TX_TYPE.CHANNEL_OPEN ||
                            type === TX_TYPE.CHANNEL_DEPOSIT) {
                            this.setTokenAllowance(token, '0');
                        }
                        this.removeTx(txHash);
                        _d.label = 9;
                    case 9: return [3, 11];
                    case 10:
                        err_2 = _d.sent();
                        common_1.logger.info('unknow transaction', txHash);
                        return [3, 11];
                    case 11:
                        _i++;
                        return [3, 1];
                    case 12:
                        if (this.enabled === false) {
                            return [2];
                        }
                        console.log('ethPendingTxStore watching');
                        return [4, common_1.delay(3000)];
                    case 13:
                        _d.sent();
                        return [3, 0];
                    case 14: return [2];
                }
            });
        });
    };
    EthPendingTxStore.prototype.getPendingTxByChannelID = function (channelID) {
        common_1.logger.info('getPendingTxByChannelID', channelID, this.txList);
        var relatedTxs = this.txList
            .filter(function (item) { return item.channelID === channelID; })
            .sort(function (a, b) { return a.time - b.time; });
        common_1.logger.info('relatedTxs', relatedTxs);
        if (relatedTxs.length >= 1) {
            return relatedTxs[0];
        }
        return false;
    };
    EthPendingTxStore.prototype.getPendingTxByUser = function (user, token) {
        var relatedTxs = this.txList
            .filter(function (item) { return item.user === user && item.token === token; })
            .sort(function (a, b) { return a.time - b.time; });
        if (relatedTxs.length >= 1) {
            return relatedTxs[0];
        }
        return false;
    };
    EthPendingTxStore.prototype.getChannelStatus = function (channelID, appStatus, user, token) {
        return __awaiter(this, void 0, void 0, function () {
            var channelStatus, _a, tx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        channelStatus = appStatus;
                        _a = appStatus;
                        switch (_a) {
                            case constants_1.CHANNEL_STATUS.CHANNEL_STATUS_INIT: return [3, 1];
                            case constants_1.CHANNEL_STATUS.CHANNEL_STATUS_OPEN: return [3, 3];
                            case constants_1.CHANNEL_STATUS.CHANNEL_STATUS_APP_CO_SETTLE: return [3, 5];
                            case constants_1.CHANNEL_STATUS.CHANNEL_STATUS_CLOSE: return [3, 6];
                            case constants_1.CHANNEL_STATUS.CHANNEL_STATUS_SETTLE: return [3, 6];
                        }
                        return [3, 7];
                    case 1: return [4, this.getInitSubStatus(user, token)];
                    case 2:
                        channelStatus = _b.sent();
                        return [3, 7];
                    case 3: return [4, this.getOpenSubStatus(channelID, user, token)];
                    case 4:
                        channelStatus = _b.sent();
                        return [3, 7];
                    case 5:
                        tx = this.getPendingTxByChannelID(channelID);
                        if (tx && tx.type === TX_TYPE.CHANNEL_CO_SETTLE) {
                            channelStatus = constants_1.CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_CO_SETTLE;
                        }
                        return [3, 7];
                    case 6: return [3, 7];
                    case 7:
                        common_1.logger.info('Channel status is ', appStatus);
                        return [2, channelStatus];
                }
            });
        });
    };
    EthPendingTxStore.prototype.getInitSubStatus = function (user, token) {
        return __awaiter(this, void 0, void 0, function () {
            var channelStatus, tx, allowance;
            return __generator(this, function (_a) {
                channelStatus = constants_1.CHANNEL_STATUS.CHANNEL_STATUS_INIT;
                tx = this.getPendingTxByUser(user, token);
                console.log('tx is', tx);
                if (!tx) {
                    if (token !== constants_1.ADDRESS_ZERO) {
                        allowance = this.getTokenAllowance(token);
                        console.log('allowance is', allowance);
                        if (allowance > 0) {
                            return [2, constants_1.CHANNEL_STATUS.CHANNEL_STATUS_ERC20_APPROVED];
                        }
                    }
                    return [2, channelStatus];
                }
                if (tx.type === TX_TYPE.CHANNEL_OPEN) {
                    channelStatus = constants_1.CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_OPEN;
                }
                if (tx.type === TX_TYPE.TOKEN_APPROVE) {
                    channelStatus = constants_1.CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ERC20_APPROVAL;
                }
                return [2, channelStatus];
            });
        });
    };
    EthPendingTxStore.prototype.getOpenSubStatus = function (channelID, user, token) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, allowance, _a, isConfirmed, lastCommitBlock;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tx = this.getPendingTxByChannelID(channelID);
                        console.log('tx is', tx);
                        if (!tx) return [3, 1];
                        if (tx.type === TX_TYPE.CHANNEL_DEPOSIT) {
                            return [2, constants_1.CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_DEPOSIT];
                        }
                        if (tx.type === TX_TYPE.CHANNEL_WITHDRAW) {
                            return [2, constants_1.CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_WITHDRAW];
                        }
                        if (tx.type === TX_TYPE.TOKEN_APPROVE) {
                            return [2, constants_1.CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ERC20_APPROVAL];
                        }
                        return [3, 3];
                    case 1:
                        if (token !== constants_1.ADDRESS_ZERO) {
                            allowance = this.getTokenAllowance(token);
                            console.log('allowance is', allowance);
                            if (allowance > 0) {
                                return [2, constants_1.CHANNEL_STATUS.CHANNEL_STATUS_ERC20_APPROVED];
                            }
                        }
                        return [4, main_1.appPN.methods.cooperativeSettleProofMap(channelID).call()];
                    case 2:
                        _a = _b.sent(), isConfirmed = _a.isConfirmed, lastCommitBlock = _a.lastCommitBlock;
                        if (!isConfirmed && Number(lastCommitBlock) > 0) {
                            return [2, constants_1.CHANNEL_STATUS.CHANNEL_STATUS_PENDING_APP_CO_SETTLE];
                        }
                        _b.label = 3;
                    case 3: return [2, constants_1.CHANNEL_STATUS.CHANNEL_STATUS_OPEN];
                }
            });
        });
    };
    EthPendingTxStore.prototype.stopWatch = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.enabled = false;
                return [2];
            });
        });
    };
    return EthPendingTxStore;
}());
exports.default = EthPendingTxStore;
//# sourceMappingURL=ethPendingTxStore.js.map