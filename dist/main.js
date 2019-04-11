"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var web3_eth_contract_1 = require("web3/node_modules/web3-eth-contract");
var cita_sdk_1 = require("@cryptape/cita-sdk");
var Web3 = require('web3');
var puppet_1 = require("./puppet");
var httpwatcher_1 = require("./httpwatcher");
var constants_1 = require("./utils/constants");
var cita_1 = require("./service/cita");
var session_1 = require("./service/session");
var common_1 = require("./utils/common");
var session_2 = require("./session");
var L2 = (function () {
    function L2() {
    }
    L2.getInstance = function () {
        if (this._instance === undefined) {
            this._instance = new L2();
            exports.callbacks = new Map();
        }
        return this._instance;
    };
    L2.prototype.init = function (userAddress, outerWeb3, ethPaymentNetworkAddress, appRpcUrl, appPaymentNetworkAddress, appSessionAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var ethPNInfo, appPNInfo, appSessionInfo, provider, ERC20Abi;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ethPNInfo = {
                            abi: common_1.abi2jsonInterface(JSON.stringify(require('./config/onchainPayment.json'))),
                            address: ethPaymentNetworkAddress,
                        };
                        appPNInfo = {
                            abi: common_1.abi2jsonInterface(JSON.stringify(require('./config/offchainPayment.json'))),
                            address: appPaymentNetworkAddress,
                        };
                        appSessionInfo = {
                            abi: common_1.abi2jsonInterface(JSON.stringify(require('./config/sessionPayment.json'))),
                            address: appSessionAddress,
                        };
                        console.log('start L2.init: userAddress: [%s], ethPaymentNetworkAddress: [%s], appRpcUrl: [%s], appPaymentNetworkAddress: [%s], appSessionAddress: [%s]', userAddress, ethPaymentNetworkAddress, appRpcUrl, appPaymentNetworkAddress, appSessionAddress);
                        exports.web3_outer = outerWeb3;
                        provider = outerWeb3.currentProvider;
                        exports.web3_10 = new Web3(provider);
                        console.log("outer web3 version:", outerWeb3.version, "inner web3 version:", exports.web3_10.version);
                        exports.ethPN = new web3_eth_contract_1.Contract(provider, ethPNInfo.abi, ethPNInfo.address);
                        exports.ethPN.options.from = exports.user;
                        exports.ethPN.options.address = ethPNInfo.address;
                        ERC20Abi = common_1.abi2jsonInterface(JSON.stringify(require('./config/ERC20.json')));
                        exports.ERC20 = new web3_eth_contract_1.Contract(provider, ERC20Abi);
                        exports.user = userAddress;
                        return [4, exports.ethPN.methods.provider().call()];
                    case 1:
                        exports.cp = _a.sent();
                        return [4, exports.ethPN.methods.regulator().call()];
                    case 2:
                        exports.l2 = _a.sent();
                        console.log('cp / l2 is ', exports.cp, exports.l2);
                        exports.cita = cita_sdk_1.default(appRpcUrl);
                        exports.appPN = new exports.cita.base.Contract(appPNInfo.abi, appPNInfo.address);
                        exports.appPN.options.address = appPNInfo.address;
                        exports.appSession = new exports.cita.base.Contract(appSessionInfo.abi, appSessionInfo.address);
                        return [4, this.initPuppet()];
                    case 3:
                        _a.sent();
                        this.initListeners();
                        this.initMissingEvent();
                        this.initialized = true;
                        console.log('finish L2.init');
                        return [2, true];
                }
            });
        });
    };
    L2.prototype.deposit = function (amount, token) {
        if (token === void 0) { token = constants_1.ADDRESS_ZERO; }
        return __awaiter(this, void 0, void 0, function () {
            var channelID, channel, ethPNAddress, appChannel, data, approveData, from, data, approveData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.checkInitialized();
                        console.log('start deposit with params: amount: [%s], token: [%s]', amount + '', token);
                        if (!exports.web3_10.utils.isAddress(token)) {
                            throw new Error("token: [" + token + "] is not a valid address");
                        }
                        return [4, exports.ethPN.methods.getChannelID(exports.user, token).call()];
                    case 1:
                        channelID = _a.sent();
                        return [4, exports.ethPN.methods.channels(channelID).call()];
                    case 2:
                        channel = _a.sent();
                        amount = exports.web3_10.utils.toBN(amount).toString();
                        ethPNAddress = exports.ethPN.options.address;
                        if (!(Number(channel.status) === constants_1.CHANNEL_STATUS.CHANNEL_STATUS_OPEN)) return [3, 9];
                        return [4, exports.appPN.methods.channelMap(channelID).call()];
                    case 3:
                        appChannel = _a.sent();
                        if (Number(appChannel.status) !== constants_1.CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
                            console.log('appChannel', appChannel);
                            throw new Error('channel status of appchain is not open');
                        }
                        data = exports.ethPN.methods.userDeposit(channelID, amount).encodeABI();
                        if (!(token === constants_1.ADDRESS_ZERO)) return [3, 5];
                        return [4, common_1.sendEthTx(exports.web3_outer, exports.user, ethPNAddress, amount, data)];
                    case 4: return [2, _a.sent()];
                    case 5:
                        approveData = exports.ERC20.methods
                            .approve(ethPNAddress, amount)
                            .encodeABI();
                        return [4, common_1.sendEthTx(exports.web3_outer, exports.user, token, 0, approveData)];
                    case 6:
                        _a.sent();
                        return [4, common_1.sendEthTx(exports.web3_outer, exports.user, ethPNAddress, 0, data)];
                    case 7: return [2, _a.sent()];
                    case 8: return [3, 16];
                    case 9:
                        if (!(Number(channel.status) === constants_1.CHANNEL_STATUS.CHANNEL_STATUS_INIT)) return [3, 15];
                        from = exports.puppet.getAccount().address;
                        data = exports.ethPN.methods
                            .openChannel(exports.user, from, constants_1.SETTLE_WINDOW, token, amount)
                            .encodeABI();
                        if (!(token === constants_1.ADDRESS_ZERO)) return [3, 11];
                        return [4, common_1.sendEthTx(exports.web3_outer, exports.user, ethPNAddress, amount, data)];
                    case 10: return [2, _a.sent()];
                    case 11:
                        approveData = exports.ERC20.methods
                            .approve(ethPNAddress, amount)
                            .encodeABI();
                        return [4, common_1.sendEthTx(exports.web3_outer, exports.user, token, 0, approveData)];
                    case 12:
                        _a.sent();
                        return [4, common_1.sendEthTx(exports.web3_outer, exports.user, ethPNAddress, 0, data)];
                    case 13: return [2, _a.sent()];
                    case 14: return [3, 16];
                    case 15: throw new Error('can not deposit now, channel status is ' + channel.status);
                    case 16: return [2];
                }
            });
        });
    };
    L2.prototype.withdraw = function (amount, token, receiver) {
        if (token === void 0) { token = constants_1.ADDRESS_ZERO; }
        if (receiver === void 0) { receiver = exports.user; }
        return __awaiter(this, void 0, void 0, function () {
            var channelID, channel, _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        this.checkInitialized();
                        console.log('start withdraw with params:  amount: [%s], token: [%s]', amount + '', token);
                        if (!exports.web3_10.utils.isAddress(token)) {
                            throw new Error("token: [" + token + "] is not a valid address");
                        }
                        amount = exports.web3_10.utils.toBN(amount).toString();
                        return [4, exports.ethPN.methods.getChannelID(exports.user, token).call()];
                    case 1:
                        channelID = _j.sent();
                        return [4, exports.appPN.methods.channelMap(channelID).call()];
                    case 2:
                        channel = _j.sent();
                        if (exports.web3_10.utils.toBN(channel.userBalance).lt(exports.web3_10.utils.toBN(amount))) {
                            throw new Error('withdraw amount exceeds the balance');
                        }
                        if (!exports.web3_10.utils.toBN(channel.userBalance).gt(exports.web3_10.utils.toBN(amount))) return [3, 5];
                        if (Number(channel.status) !== constants_1.CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
                            throw new Error('channel status is not open');
                        }
                        console.log('call userProposeWithdraw');
                        _a = common_1.sendAppTx;
                        _c = (_b = exports.appPN.methods).userProposeWithdraw;
                        _d = [channelID,
                            amount,
                            exports.user];
                        return [4, common_1.getLCB(exports.web3_10.eth, 'eth')];
                    case 3: return [4, _a.apply(void 0, [_c.apply(_b, _d.concat([_j.sent()]))])];
                    case 4: return [2, _j.sent()];
                    case 5:
                        if (!(Number(channel.status) ===
                            constants_1.CHANNEL_STATUS.CHANNEL_STATUS_PENDING_CO_SETTLE)) return [3, 7];
                        console.log('call ethSubmitCooperativeSettle');
                        return [4, cita_1.ethMethods.ethSubmitCooperativeSettle(channelID)];
                    case 6: return [2, _j.sent()];
                    case 7:
                        console.log('call proposeCooperativeSettle', amount);
                        _e = common_1.sendAppTx;
                        _g = (_f = exports.appPN.methods).proposeCooperativeSettle;
                        _h = [channelID,
                            amount];
                        return [4, common_1.getLCB(exports.web3_10.eth, 'eth')];
                    case 8: return [4, _e.apply(void 0, [_g.apply(_f, _h.concat([_j.sent()]))])];
                    case 9: return [2, _j.sent()];
                }
            });
        });
    };
    L2.prototype.forceWithdraw = function (token) {
        if (token === void 0) { token = constants_1.ADDRESS_ZERO; }
        return __awaiter(this, void 0, void 0, function () {
            var channelID, channel, _a, _b, balance, nonce, additionalHash, partnerSignature, _c, inAmount, inNonce, regulatorSignature, providerSignature, data;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.checkInitialized();
                        console.log('start forceWithdraw with params: token: [%s]', token);
                        if (!exports.web3_10.utils.isAddress(token)) {
                            throw new Error("token: [" + token + "] is not a valid address");
                        }
                        return [4, exports.ethPN.methods.getChannelID(exports.user, token).call()];
                    case 1:
                        channelID = _d.sent();
                        return [4, exports.ethPN.methods.channels(channelID).call()];
                    case 2:
                        channel = _d.sent();
                        if (Number(channel.status) !== constants_1.CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
                            throw new Error('eth channel status is not open, can not force withdraw');
                        }
                        return [4, Promise.all([
                                exports.appPN.methods.balanceProofMap(channelID, exports.user).call(),
                                exports.appPN.methods.rebalanceProofMap(channelID).call(),
                            ])];
                    case 3:
                        _a = _d.sent(), _b = _a[0], balance = _b.balance, nonce = _b.nonce, additionalHash = _b.additionalHash, partnerSignature = _b.signature, _c = _a[1], inAmount = _c.amount, inNonce = _c.nonce, regulatorSignature = _c.regulatorSignature, providerSignature = _c.providerSignature;
                        partnerSignature = partnerSignature || '0x0';
                        regulatorSignature = regulatorSignature || '0x0';
                        providerSignature = providerSignature || '0x0';
                        console.log('force-close params: channelID: [%s], balance: [%s], nonce: [%s], additionalHash: [%s], partnerSignature: [%s], inAmount: [%s], inNonce: [%s], regulatorSignature: [%s], providerSignature: [%s] ', channelID, balance, nonce, additionalHash, partnerSignature, inAmount, inNonce, regulatorSignature, providerSignature);
                        data = exports.ethPN.methods
                            .closeChannel(channelID, balance, nonce, additionalHash, partnerSignature, inAmount, inNonce, regulatorSignature, providerSignature)
                            .encodeABI();
                        return [4, common_1.sendEthTx(exports.web3_outer, exports.user, exports.ethPN.options.address, 0, data)];
                    case 4: return [2, _d.sent()];
                }
            });
        });
    };
    L2.prototype.transfer = function (to, amount, token) {
        if (token === void 0) { token = constants_1.ADDRESS_ZERO; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, isAddress, toBN, channelID, channel, _b, balance, nonce, additionalHash, signature;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.checkInitialized();
                        console.log('start transfer with params: to: [%s], amount: [%s], token: [%s]', to, amount + '', token);
                        _a = exports.web3_10.utils, isAddress = _a.isAddress, toBN = _a.toBN;
                        if (!isAddress(token)) {
                            throw new Error("token: [" + token + "] is not a valid address");
                        }
                        return [4, exports.ethPN.methods.getChannelID(exports.user, token).call()];
                    case 1:
                        channelID = _c.sent();
                        return [4, exports.appPN.methods.channelMap(channelID).call()];
                    case 2:
                        channel = _c.sent();
                        if (Number(channel.status) !== constants_1.CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
                            throw new Error('app channel status is not open, can not transfer now');
                        }
                        if (toBN(channel.userBalance).lt(exports.web3_10.utils.toBN(amount))) {
                            throw new Error("user's balance is less than transfer amount");
                        }
                        return [4, exports.appPN.methods
                                .balanceProofMap(channelID, exports.cp)
                                .call()];
                    case 3:
                        _b = _c.sent(), balance = _b.balance, nonce = _b.nonce;
                        balance = toBN(amount)
                            .add(toBN(balance))
                            .toString();
                        nonce = toBN(nonce)
                            .add(toBN(1))
                            .toString();
                        additionalHash = '0x0';
                        return [4, common_1.prepareSignatureForTransfer(exports.web3_outer, exports.ethPN.options.address, channelID, balance, nonce, additionalHash, exports.user)];
                    case 4:
                        signature = _c.sent();
                        console.log('start Submit Transfer');
                        return [4, common_1.sendAppTx(exports.appPN.methods.transfer(to, channelID, balance, nonce, additionalHash, signature))];
                    case 5: return [2, _c.sent()];
                }
            });
        });
    };
    L2.prototype.startSession = function (sessionID) {
        return __awaiter(this, void 0, void 0, function () {
            var repeatTimes, session, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.checkInitialized();
                        repeatTimes = 10;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < repeatTimes)) return [3, 5];
                        return [4, session_2.default.getSessionById(sessionID)];
                    case 2:
                        session = _a.sent();
                        if (session) {
                            return [3, 5];
                        }
                        return [4, common_1.delay(1000)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3, 1];
                    case 5:
                        if (!session) {
                            throw new Error('session not found');
                        }
                        return [2, session];
                }
            });
        });
    };
    L2.prototype.getSessionBySessionID = function (sessionID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, session_2.default.getSessionById(sessionID)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    L2.prototype.getMessagesBySessionID = function (sessionID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, session_2.default.getMessagesBySessionID(sessionID)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    L2.prototype.getPlayersBySessionID = function (sessionID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, session_2.default.getPlayersBySessionID(sessionID)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    L2.prototype.getBalance = function (token) {
        if (token === void 0) { token = constants_1.ADDRESS_ZERO; }
        return __awaiter(this, void 0, void 0, function () {
            var channelID, channel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.checkInitialized();
                        return [4, exports.ethPN.methods.getChannelID(exports.user, token).call()];
                    case 1:
                        channelID = _a.sent();
                        return [4, exports.appPN.methods.channelMap(channelID).call()];
                    case 2:
                        channel = _a.sent();
                        return [2, channel.userBalance];
                }
            });
        });
    };
    L2.prototype.getChannelInfo = function (token) {
        if (token === void 0) { token = constants_1.ADDRESS_ZERO; }
        return __awaiter(this, void 0, void 0, function () {
            var channelID, ethChannel, channel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.checkInitialized();
                        return [4, exports.ethPN.methods.getChannelID(exports.user, token).call()];
                    case 1:
                        channelID = _a.sent();
                        return [4, exports.ethPN.methods.channels(channelID).call()];
                    case 2:
                        ethChannel = _a.sent();
                        console.log('ChannelID is ', channelID, ethChannel);
                        return [4, exports.appPN.methods.channelMap(channelID).call()];
                    case 3:
                        channel = _a.sent();
                        return [2, __assign({ channelID: channelID }, channel)];
                }
            });
        });
    };
    L2.prototype.getAllTXs = function (token) {
        if (token === void 0) { token = constants_1.ADDRESS_ZERO; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, inTXs, outTXs, cmpNonce, lastBalance, getTX;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.checkInitialized();
                        return [4, Promise.all([
                                exports.appPN.getPastEvents('Transfer', {
                                    filter: { to: exports.user },
                                    fromBlock: 0,
                                    toBlock: 'latest',
                                }),
                                exports.appPN.getPastEvents('Transfer', {
                                    filter: { from: exports.user },
                                    fromBlock: 0,
                                    toBlock: 'latest',
                                }),
                            ])];
                    case 1:
                        _a = _b.sent(), inTXs = _a[0], outTXs = _a[1];
                        cmpNonce = function (key) {
                            return function (a, b) {
                                return a[key] - b[key];
                            };
                        };
                        lastBalance = exports.web3_10.utils.toBN(0);
                        getTX = function (tx) {
                            var _a = tx.returnValues, channelID = _a.channelID, balance = _a.balance, rest = __rest(_a, ["channelID", "balance"]);
                            balance = new exports.web3_10.utils.toBN(balance);
                            var amount = balance.sub(lastBalance).toString();
                            lastBalance = balance;
                            return __assign({ id: tx.transactionHash, amount: amount }, rest);
                        };
                        inTXs = inTXs.sort(cmpNonce('nonce')).map(function (tx) { return getTX(tx); });
                        outTXs = outTXs.sort(cmpNonce('nonce')).map(function (tx) { return getTX(tx); });
                        return [2, { in: inTXs, out: outTXs }];
                }
            });
        });
    };
    L2.prototype.getAllPuppets = function () {
        return __awaiter(this, void 0, void 0, function () {
            var puppetList, n, _a, address, enabled, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.checkInitialized();
                        puppetList = [];
                        n = 0;
                        _b.label = 1;
                    case 1:
                        if (!true) return [3, 6];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4, exports.appPN.methods
                                .puppets(exports.user, n++)
                                .call()];
                    case 3:
                        _a = _b.sent(), address = _a.p, enabled = _a.enabled;
                        puppetList.push({ address: address, enabled: enabled });
                        return [3, 5];
                    case 4:
                        err_1 = _b.sent();
                        return [3, 6];
                    case 5: return [3, 1];
                    case 6:
                        console.log(puppetList);
                        return [2, puppetList];
                }
            });
        });
    };
    L2.prototype.disablePuppet = function (puppet) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.checkInitialized();
                        data = exports.ethPN.methods.disablePuppet(puppet).encodeABI();
                        return [4, common_1.sendEthTx(exports.web3_outer, exports.user, exports.ethPN.options.address, 0, data)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    L2.prototype.on = function (event, callback) {
        exports.callbacks.set(event, callback);
    };
    L2.prototype.checkInitialized = function () {
        if (!this.initialized) {
            throw new Error('L2 is not initialized');
        }
    };
    L2.prototype.initPuppet = function () {
        return __awaiter(this, void 0, void 0, function () {
            var puppetStatus, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        exports.puppet = puppet_1.default.get(exports.user);
                        if (!exports.puppet) return [3, 2];
                        console.log('puppet is ', exports.puppet);
                        return [4, exports.ethPN.methods
                                .puppetMap(exports.user, exports.puppet.getAccount().address)
                                .call()];
                    case 1:
                        puppetStatus = _a.sent();
                        console.log('puppetStatus', puppetStatus);
                        if (Number(puppetStatus) === constants_1.PUPPET_STATUS.ENABLED) {
                            console.log('puppet is active');
                            return [2];
                        }
                        _a.label = 2;
                    case 2:
                        exports.puppet = puppet_1.default.create(exports.user);
                        data = exports.ethPN.methods.addPuppet(exports.puppet.getAccount().address).encodeABI();
                        return [4, common_1.sendEthTx(exports.web3_outer, exports.user, exports.ethPN.options.address, 0, data)];
                    case 3:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    L2.prototype.initListeners = function () {
        return __awaiter(this, void 0, void 0, function () {
            var appWatchList;
            return __generator(this, function (_a) {
                this.ethWatcher && this.ethWatcher.stop();
                this.appWatcher && this.appWatcher.stop();
                appWatchList = [
                    { contract: exports.appPN, listener: cita_1.events },
                    { contract: exports.appSession, listener: session_1.events },
                ];
                this.appWatcher = new httpwatcher_1.default(exports.cita.base, 1000, appWatchList);
                this.appWatcher.start();
                return [2];
            });
        });
    };
    L2.prototype.initMissingEvent = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allChannelOpenedEvent, _i, allChannelOpenedEvent_1, event_1, returnValues, channelID, channel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('start initMissingEvent');
                        return [4, exports.ethPN.getPastEvents('ChannelOpened', {
                                filter: { user: exports.user },
                                fromBlock: 0,
                                toBlock: 'latest',
                            })];
                    case 1:
                        allChannelOpenedEvent = _a.sent();
                        console.log('getAllChannelOpenedEvent length', allChannelOpenedEvent.length);
                        _i = 0, allChannelOpenedEvent_1 = allChannelOpenedEvent;
                        _a.label = 2;
                    case 2:
                        if (!(_i < allChannelOpenedEvent_1.length)) return [3, 6];
                        event_1 = allChannelOpenedEvent_1[_i];
                        returnValues = event_1.returnValues;
                        channelID = returnValues.channelID;
                        return [4, exports.ethPN.methods.channels(channelID).call()];
                    case 3:
                        channel = _a.sent();
                        if (!(Number(channel.status) === constants_1.CHANNEL_STATUS.CHANNEL_STATUS_OPEN)) return [3, 5];
                        return [4, cita_1.appMethods.appSubmitGuardProof(channelID, exports.user)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3, 2];
                    case 6: return [2];
                }
            });
        });
    };
    return L2;
}());
exports.L2 = L2;
exports.default = L2;
//# sourceMappingURL=main.js.map