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
var constants_1 = require("./utils/constants");
var main_1 = require("./main");
var common_1 = require("./utils/common");
var rlp = require("rlp");
var L2Session = (function () {
    function L2Session(_sessionID) {
        this.sessionID = _sessionID;
    }
    L2Session.getSessionById = function (_sessionID, fromChain) {
        if (fromChain === void 0) { fromChain = true; }
        return __awaiter(this, void 0, void 0, function () {
            var session, sessionExist;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        session = L2Session.sessionList.get(_sessionID);
                        if (!!session) return [3, 3];
                        return [4, L2Session.isExists(_sessionID)];
                    case 1:
                        sessionExist = _a.sent();
                        if (!sessionExist) {
                            return [2, null];
                        }
                        session = new L2Session(_sessionID);
                        return [4, session.initialize()];
                    case 2:
                        _a.sent();
                        L2Session.sessionList.set(_sessionID, session);
                        _a.label = 3;
                    case 3: return [2, session];
                }
            });
        });
    };
    L2Session.isExists = function (_sessionID) {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, main_1.appSession.methods.sessions(_sessionID).call()];
                    case 1:
                        session = _a.sent();
                        if (Number(session.status) === constants_1.SESSION_STATUS.SESSION_STATUS_INIT) {
                            return [2, false];
                        }
                        return [2, true];
                }
            });
        });
    };
    L2Session.getMessagesBySessionID = function (_sessionID) {
        return __awaiter(this, void 0, void 0, function () {
            var messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, main_1.appSession.methods.exportSession(_sessionID).call()];
                    case 1:
                        messages = _a.sent();
                        return [2, messages];
                }
            });
        });
    };
    L2Session.getPlayersBySessionID = function (_sessionID) {
        return __awaiter(this, void 0, void 0, function () {
            var players;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, main_1.appSession.methods.exportPlayer(_sessionID).call()];
                    case 1:
                        players = _a.sent();
                        return [2, players];
                }
            });
        });
    };
    L2Session.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, status, provider, game, paymentContract, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, main_1.appSession.methods.sessions(this.sessionID).call()];
                    case 1:
                        _a = _b.sent(), status = _a.status, provider = _a.provider, game = _a.game, paymentContract = _a.paymentContract, data = _a.data;
                        this.status = Number(status);
                        this.game = game;
                        this.data = data;
                        this.provider = provider;
                        this.callbacks = this.callbacks || new Map();
                        return [2];
                }
            });
        });
    };
    L2Session.prototype.sendMessage = function (to, type, content, amount, token) {
        if (amount === void 0) { amount = '0'; }
        if (token === void 0) { token = constants_1.ADDRESS_ZERO; }
        return __awaiter(this, void 0, void 0, function () {
            var status, from, messageHash, signature, paymentData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('sendMessage start execute with params: to: [%s], type: [%s], content: [%s], amount: [%s], token: [%s]', to, type, content, amount + '', token);
                        return [4, main_1.appSession.methods.sessions(this.sessionID).call()];
                    case 1:
                        status = (_a.sent()).status;
                        if (Number(status) !== constants_1.SESSION_STATUS.SESSION_STATUS_OPEN) {
                            throw new Error('session is not open');
                        }
                        from = main_1.user;
                        messageHash = main_1.web3_10.utils.soliditySha3({ t: 'address', v: from }, { t: 'address', v: to }, { t: 'bytes32', v: this.sessionID }, { t: 'uint8', v: type }, { t: 'bytes', v: content });
                        signature = common_1.myEcsignToHex(main_1.web3_10, messageHash, main_1.puppet.getAccount().privateKey);
                        return [4, this.buildTransferData(from, main_1.web3_10.utils.toBN(amount).toString(), token, messageHash)];
                    case 2:
                        paymentData = _a.sent();
                        return [4, common_1.sendAppTx(main_1.appSession.methods.sendMessage(from, to, this.sessionID, type, content, signature, paymentData))];
                    case 3: return [2, _a.sent()];
                }
            });
        });
    };
    L2Session.prototype.onMessage = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.callbacks.set('message', callback);
                return [2];
            });
        });
    };
    L2Session.prototype.onSessionClose = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.callbacks.set('close', callback);
                return [2];
            });
        });
    };
    L2Session.prototype.buildTransferData = function (from, amount, token, messageHash) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, bytesToHex, toHex, soliditySha3, toBN, channelID, balance, nonce, additionalHash, paymentSignature, channel, balanceProof, paymentData, rlpencode;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = main_1.web3_10.utils, bytesToHex = _a.bytesToHex, toHex = _a.toHex, soliditySha3 = _a.soliditySha3, toBN = _a.toBN;
                        channelID = '0x0000000000000000000000000000000000000000000000000000000000000000';
                        balance = '0';
                        nonce = '0';
                        additionalHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
                        paymentSignature = '0x0';
                        if (!(Number(amount) > 0)) return [3, 5];
                        return [4, main_1.ethPN.methods.getChannelID(from, token).call()];
                    case 1:
                        channelID = _b.sent();
                        return [4, main_1.appPN.methods.channelMap(channelID).call()];
                    case 2:
                        channel = _b.sent();
                        if (Number(channel.status) !== constants_1.CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
                            throw new Error('app channel status is not open, can not transfer now');
                        }
                        if (toBN(channel.userBalance).lt(toBN(amount))) {
                            throw new Error("user's balance is less than transfer amount");
                        }
                        return [4, main_1.appPN.methods
                                .balanceProofMap(channelID, main_1.cp)
                                .call()];
                    case 3:
                        balanceProof = _b.sent();
                        balance = toBN(amount)
                            .add(toBN(balanceProof.balance))
                            .toString();
                        nonce = toBN(balanceProof.nonce)
                            .add(toBN(1))
                            .toString();
                        additionalHash = soliditySha3({ t: 'bytes32', v: messageHash }, { t: 'uint256', v: amount });
                        return [4, common_1.prepareSignatureForTransfer(main_1.web3_outer, main_1.ethPN.options.address, channelID, balance, nonce, additionalHash, main_1.user)];
                    case 4:
                        paymentSignature = _b.sent();
                        _b.label = 5;
                    case 5:
                        paymentData = [
                            channelID,
                            toHex(balance),
                            toHex(nonce),
                            toHex(amount),
                            additionalHash,
                            paymentSignature,
                        ];
                        console.log('paymentData: ', paymentData);
                        rlpencode = '0x' + rlp.encode(paymentData).toString('hex');
                        console.log('rlpencode is', rlpencode);
                        return [2, rlpencode];
                }
            });
        });
    };
    L2Session.sessionList = new Map();
    return L2Session;
}());
exports.default = L2Session;
//# sourceMappingURL=session.js.map