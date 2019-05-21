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
var ethereumjs_util_2 = require("ethereumjs-util");
var web3_utils_1 = require("web3/node_modules/web3-utils");
var web3_eth_abi_1 = require("web3/node_modules/web3-eth-abi");
function myEcsign(messageHash, privateKey) {
    var signatureHexString = myEcsignToHex(messageHash, privateKey);
    var signatureBytes = web3_utils_1.hexToBytes(signatureHexString);
    return signatureBytes;
}
exports.myEcsign = myEcsign;
function myEcsignToHex(messageHash, privateKey) {
    var privateKeyBuffer = new Buffer(privateKey.replace('0x', ''), 'hex');
    var messageHashBuffer = new Buffer(messageHash.replace('0x', ''), 'hex');
    var signatureObj = ethereumjs_util_1.ecsign(messageHashBuffer, privateKeyBuffer);
    var signatureHexString = ethereumjs_util_1.toRpcSig(signatureObj.v, signatureObj.r, signatureObj.s);
    return signatureHexString;
}
exports.myEcsignToHex = myEcsignToHex;
function getEthGasPrice(web3) {
    return __awaiter(this, void 0, void 0, function () {
        var toBigNumber;
        return __generator(this, function (_a) {
            toBigNumber = web3.toBigNumber;
            return [2, new Promise(function (resolve, reject) {
                    web3.eth.getGasPrice(function (error, result) {
                        if (error) {
                            reject(error);
                        }
                        else {
                            var biggerPrice = result.mul(toBigNumber(11)).div(toBigNumber(10));
                            resolve(biggerPrice.toString(10));
                        }
                    });
                })];
        });
    });
}
exports.getEthGasPrice = getEthGasPrice;
function sendEthTx(web3, from, to, value, data) {
    return __awaiter(this, void 0, void 0, function () {
        var gasPrice;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getEthGasPrice(web3)];
                case 1:
                    gasPrice = _a.sent();
                    return [2, new Promise(function (resolve, reject) {
                            web3.eth.sendTransaction({ from: from, to: to, value: value, data: data, gasPrice: gasPrice }, function (err, result) {
                                exports.logger.info('send Transaction', err, result);
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve(result);
                                }
                            });
                        })];
            }
        });
    });
}
exports.sendEthTx = sendEthTx;
function signMessage(web3, from, typedData) {
    return __awaiter(this, void 0, void 0, function () {
        var typedDataHash_1, signFunc, sig, recoveredAddress, params_1, method_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!web3.currentProvider.isMetaMask) return [3, 2];
                    typedDataHash_1 = ethereumjs_util_2.bufferToHex(TypedData_1.signHash(typedData));
                    console.log('typedDataHash, from', typedDataHash_1, from);
                    signFunc = new Promise(function (resolve, reject) {
                        web3.eth.sign(from, typedDataHash_1, function (err, result) {
                            if (err) {
                                reject(err);
                            }
                            resolve(result);
                        });
                    });
                    return [4, signFunc];
                case 1:
                    sig = (_a.sent());
                    recoveredAddress = TypedData_1.recoverTypedData(typedData, sig);
                    if (recoveredAddress.toLowerCase() !== from.toLowerCase()) {
                        throw new Error("Invalid sig " + sig + " of hash " + typedDataHash_1 + " of data " + JSON.stringify(typedData) + " recovered " + recoveredAddress + " instead of " + from + ".");
                    }
                    return [2, sig];
                case 2:
                    params_1 = [from, JSON.stringify(typedData)];
                    method_1 = 'eth_signTypedData_v3';
                    return [2, new Promise(function (resolve, reject) {
                            web3.currentProvider.sendAsync({
                                method: method_1,
                                params: params_1,
                                from: from,
                            }, function (err, result) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    exports.logger.info('sign Result', err, result);
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
            }
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
function prepareSignatureForTransfer(web3, ethPNAddress, channelID, balance, nonce, additionalHash, user) {
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
                            chainId: main_1.ethChainId,
                            verifyingContract: ethPNAddress,
                        },
                        message: {
                            channelID: channelID,
                            balance: balance,
                            nonce: nonce,
                            additionalHash: additionalHash,
                        },
                    };
                    exports.logger.info('typedData ', typedData);
                    signature = '';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, signMessage(web3, user, typedData)];
                case 2:
                    signature = _a.sent();
                    return [3, 4];
                case 3:
                    err_1 = _a.sent();
                    exports.logger.info('user reject the sign action');
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
    var abiCoder = new web3_eth_abi_1.AbiCoder();
    var eventSignature = abiCoder.encodeEventSignature(eventDefinition);
    for (var _a = 0, _b = receipt.logs; _a < _b.length; _a++) {
        var log = _b[_a];
        if (log.topics[0] === eventSignature) {
            return abiCoder.decodeLog(eventDefinition.inputs, log.data, log.topics.slice(1));
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
function sendAppTx(action, name) {
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
                        exports.logger.error("CTIATX " + name + " confirm error " + receipt.errorMessage, res.hash, action.arguments, tx);
                        throw new Error("CTIATX " + name + " confirm error " + receipt.errorMessage);
                    }
                    else {
                        exports.logger.info("CTIATX " + name + " success", res.hash);
                        return [2, res.hash];
                    }
                    return [3, 5];
                case 4:
                    exports.logger.error("CITATX " + name + " submit failed", res.hash, action.arguments, tx);
                    throw new Error("CITATX " + name + " submit failed");
                case 5: return [2];
            }
        });
    });
}
exports.sendAppTx = sendAppTx;
function getERC20Allowance(owner, spender, token) {
    return __awaiter(this, void 0, void 0, function () {
        var allowance;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    main_1.ERC20.options.address = token;
                    return [4, main_1.ERC20.methods.allowance(owner, spender).call()];
                case 1:
                    allowance = _a.sent();
                    return [2, allowance];
            }
        });
    });
}
exports.getERC20Allowance = getERC20Allowance;
function extractEthTxHashFromAppTx(appTxHash) {
    return __awaiter(this, void 0, void 0, function () {
        var receipt, executionABIs, abiCoder, _i, _a, log, transactionId, txHash;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, main_1.cita.listeners.listenToTransactionReceipt(appTxHash)];
                case 1:
                    receipt = _b.sent();
                    executionABIs = main_1.appOperator.options.jsonInterface.filter(function (item) { return item.name === 'Execution'; });
                    abiCoder = new web3_eth_abi_1.AbiCoder();
                    _i = 0, _a = receipt.logs;
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3, 5];
                    log = _a[_i];
                    if (!(log.topics[0] === abiCoder.encodeEventSignature(executionABIs[0]))) return [3, 4];
                    transactionId = log.topics[1];
                    return [4, main_1.appOperator.methods
                            .transactions(transactionId)
                            .call()];
                case 3:
                    txHash = (_b.sent()).txHash;
                    return [2, txHash];
                case 4:
                    _i++;
                    return [3, 2];
                case 5: return [2];
            }
        });
    });
}
exports.extractEthTxHashFromAppTx = extractEthTxHashFromAppTx;
exports.logger = {
    info: main_1.debug ? console.log : function () { },
    error: main_1.debug ? console.error : function () { },
};
function setLogger() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            exports.logger = {
                info: main_1.debug ? console.log : function () { },
                error: main_1.debug ? console.error : function () { },
            };
            return [2];
        });
    });
}
exports.setLogger = setLogger;
//# sourceMappingURL=common.js.map