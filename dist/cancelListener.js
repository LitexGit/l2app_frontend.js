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
var main_1 = require("./main");
var constants_1 = require("./utils/constants");
var CancelListener = (function () {
    function CancelListener() {
        this.key = 'CancelListenerStore_' + main_1.web3_10.utils.sha3(main_1.user + main_1.appPN.options.address);
    }
    CancelListener.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var txListStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, localStorage.getItem(this.key)];
                    case 1:
                        txListStr = _a.sent();
                        if (!!txListStr) {
                            this.settleList = JSON.parse(localStorage.getItem(this.key));
                        }
                        else {
                            this.settleList = new Array();
                        }
                        return [2];
                }
            });
        });
    };
    CancelListener.prototype.save = function () {
        localStorage.setItem(this.key, JSON.stringify(this.settleList));
    };
    CancelListener.prototype.add = function (info) {
        if (!this.settleList.map(function (item) { return item.channelID; }).includes(info.channelID)) {
            this.settleList.push(info);
        }
        this.save();
    };
    CancelListener.prototype.contains = function (channelID) {
        if (this.settleList.map(function (item) { return item.channelID; }).includes(channelID)) {
            return true;
        }
        return false;
    };
    CancelListener.prototype.remove = function (channelID) {
        var _this = this;
        this.settleList.forEach(function (item, index) {
            if (item.channelID === channelID)
                _this.settleList.splice(index, 1);
        });
        this.save();
    };
    CancelListener.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentBlockNumber, _i, _a, settle, channelID, lastCommitBlock, _b, user_1, token, status_1, withdrawUnlockedEvent, err_1, err_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!true) return [3, 13];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 11, , 12]);
                        return [4, main_1.appOperator.methods
                                .ethBlockNumber()
                                .call()];
                    case 2:
                        currentBlockNumber = _c.sent();
                        _i = 0, _a = this.settleList;
                        _c.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3, 9];
                        settle = _a[_i];
                        channelID = settle.channelID, lastCommitBlock = settle.lastCommitBlock;
                        common_1.logger.info('cancel listner', currentBlockNumber, lastCommitBlock);
                        if (!(currentBlockNumber > lastCommitBlock)) return [3, 8];
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 7, , 8]);
                        return [4, main_1.appPN.methods.channelMap(channelID).call()];
                    case 5:
                        _b = _c.sent(), user_1 = _b.user, token = _b.token, status_1 = _b.status;
                        if (status_1 === constants_1.CHANNEL_STATUS.CHANNEL_STATUS_SETTLE) {
                            this.remove(channelID);
                            return [3, 8];
                        }
                        return [4, common_1.sendAppTx(main_1.appPN.methods.unlockCooperativeSettle(channelID))];
                    case 6:
                        _c.sent();
                        this.remove(channelID);
                        withdrawUnlockedEvent = {
                            user: user_1,
                            type: 2,
                            token: token,
                        };
                        main_1.callbacks.get('WithdrawUnlocked') &&
                            main_1.callbacks.get('WithdrawUnlocked')(null, withdrawUnlockedEvent);
                        return [3, 8];
                    case 7:
                        err_1 = _c.sent();
                        common_1.logger.error('unlockCooperativeSettle failed', channelID);
                        return [3, 8];
                    case 8:
                        _i++;
                        return [3, 3];
                    case 9:
                        if (this.enabled === false) {
                            return [2];
                        }
                        return [4, common_1.delay(3000)];
                    case 10:
                        _c.sent();
                        return [3, 12];
                    case 11:
                        err_2 = _c.sent();
                        common_1.logger.error('cancelListener error', err_2);
                        return [3, 12];
                    case 12: return [3, 0];
                    case 13: return [2];
                }
            });
        });
    };
    CancelListener.prototype.stop = function () {
        this.enabled = false;
    };
    return CancelListener;
}());
exports.default = CancelListener;
//# sourceMappingURL=cancelListener.js.map