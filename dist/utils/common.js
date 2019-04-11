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
Object.defineProperty(exports, "__esModule", { value: true });
var ethereumjs_util_1 = require("ethereumjs-util");
var constants_1 = require("./constants");
var TypedData_1 = require("../config/TypedData");
var main_1 = require("../main");
function myEcsign(web3, messageHash, privateKey) {
    var signatureHexString = myEcsignToHex(web3, messageHash, privateKey);
    var signatureBytes = web3.utils.hexToBytes(signatureHexString);
    return signatureBytes;
}
exports.myEcsign = myEcsign;
function myEcsignToHex(web3, messageHash, privateKey) {
    var privateKeyBuffer = new Buffer(privateKey.replace('0x', ''), 'hex');
    var messageHashBuffer = new Buffer(messageHash.replace('0x', ''), 'hex');
    var signatureObj = ethereumjs_util_1.ecsign(messageHashBuffer, privateKeyBuffer);
    var signatureHexString = ethereumjs_util_1.toRpcSig(signatureObj.v, signatureObj.r, signatureObj.s);
    return signatureHexString;
}
exports.myEcsignToHex = myEcsignToHex;
function sendEthTx(web3, from, to, value, data) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) {
                    web3.eth.sendTransaction({ from: from, to: to, value: value, data: data, gasPrice: 1e10 }, function (err, result) {
                        console.log('send Transaction', err, result);
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(result);
                        }
                    });
                })];
        });
    });
}
exports.sendEthTx = sendEthTx;
function signMessage(web3, from, typedData) {
    return __awaiter(this, void 0, void 0, function () {
        var params, method;
        var _this = this;
        return __generator(this, function (_a) {
            params = [from, JSON.stringify(typedData)];
            console.dir(params);
            method = 'eth_signTypedData_v3';
            return [2, new Promise(function (resolve, reject) {
                    web3.currentProvider.sendAsync({
                        method: method,
                        params: params,
                        from: from,
                    }, function (err, result) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            console.log('sign Result', err, result);
                            if (err) {
                                reject(err);
                            }
                            else if (result.error) {
                                reject(result.error);
                            }
                            else {
                                resolve(result.result);
                            }
                            return [2];
                        });
                    }); });
                })];
        });
    });
}
exports.signMessage = signMessage;
function abi2jsonInterface(abi) {
    try {
        var abiArray = JSON.parse(abi);
        if (!Array.isArray(abiArray))
            return undefined;
        return abiArray;
    }
    catch (e) {
        return undefined;
    }
}
exports.abi2jsonInterface = abi2jsonInterface;
function getLCB(base, chain) {
    return __awaiter(this, void 0, void 0, function () {
        var current;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, base.getBlockNumber()];
                case 1:
                    current = _a.sent();
                    if (chain === 'eth') {
                        return [2, current + constants_1.ETH_MESSAGE_COMMIT_BLOCK_EXPERITION];
                    }
                    else {
                        return [2, current + constants_1.CITA_TX_COMMIT_BLOCK_EXPERITION];
                    }
                    return [2];
            }
        });
    });
}
exports.getLCB = getLCB;
function delay(duration) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, new Promise(function (resolve) { return setTimeout(resolve, duration); })];
        });
    });
}
exports.delay = delay;
function prepareSignatureForTransfer(web3_outer, ethPNAddress, channelID, balance, nonce, additionalHash, user) {
    return __awaiter(this, void 0, void 0, function () {
        var typedData, signature, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    typedData = {
                        types: TypedData_1.EIP712_TYPES,
                        primaryType: 'Transfer',
                        domain: {
                            name: 'litexlayer2',
                            version: '1',
                            chainId: 4,
                            verifyingContract: ethPNAddress,
                        },
                        message: {
                            channelID: channelID,
                            balance: balance,
                            nonce: nonce,
                            additionalHash: additionalHash,
                        },
                    };
                    console.log('typedData ', typedData);
                    signature = '';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, signMessage(web3_outer, user, typedData)];
                case 2:
                    signature = _a.sent();
                    return [3, 4];
                case 3:
                    err_1 = _a.sent();
                    console.log('user reject the sign action');
                    throw err_1;
                case 4: return [2, signature];
            }
        });
    });
}
exports.prepareSignatureForTransfer = prepareSignatureForTransfer;
function extractEventFromReceipt(web3, receipt, contract, name) {
    var abiItems = contract.options.jsonInterface;
    var eventDefinition = null;
    for (var _i = 0, abiItems_1 = abiItems; _i < abiItems_1.length; _i++) {
        var abiItem = abiItems_1[_i];
        if (abiItem.type === 'event' && abiItem.name === name) {
            eventDefinition = abiItem;
            break;
        }
    }
    if (eventDefinition === null) {
        return null;
    }
    var eventSignature = web3.eth.abi.encodeEventSignature(eventDefinition);
    for (var _a = 0, _b = receipt.logs; _a < _b.length; _a++) {
        var log = _b[_a];
        if (log.topics[0] === eventSignature) {
            return web3.eth.abi.decodeLog(eventDefinition.inputs, log.data, log.topics.slice(1));
        }
    }
    return null;
}
exports.extractEventFromReceipt = extractEventFromReceipt;
function getAppTxOption() {
    return __awaiter(this, void 0, void 0, function () {
        var tx, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    tx = {
                        nonce: 999999,
                        quota: 1000000,
                        chainId: 1,
                        version: 1,
                        validUntilBlock: 999999,
                        value: '0x0',
                    };
                    _a = [{}, tx];
                    _b = {};
                    return [4, getLCB(main_1.cita.base, 'cita')];
                case 1: return [2, __assign.apply(void 0, _a.concat([(_b.validUntilBlock = _c.sent(), _b.from = main_1.puppet.getAccount().address, _b.privateKey = main_1.puppet.getAccount().privateKey, _b)]))];
            }
        });
    });
}
exports.getAppTxOption = getAppTxOption;
function sendAppTx(action) {
    return __awaiter(this, void 0, void 0, function () {
        var tx, res, receipt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getAppTxOption()];
                case 1:
                    tx = _a.sent();
                    return [4, action.send(tx)];
                case 2:
                    res = _a.sent();
                    if (!res.hash) return [3, 4];
                    return [4, main_1.cita.listeners.listenToTransactionReceipt(res.hash)];
                case 3:
                    receipt = _a.sent();
                    if (receipt.errorMessage) {
                        throw new Error(receipt.errorMessage);
                    }
                    else {
                        console.log('submit sendMessage success');
                        return [2, res.hash];
                    }
                    return [3, 5];
                case 4: throw new Error('submit sendMessage failed');
                case 5: return [2];
            }
        });
    });
}
exports.sendAppTx = sendAppTx;
//# sourceMappingURL=common.js.map