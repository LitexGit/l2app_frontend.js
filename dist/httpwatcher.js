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
var HttpWatcher = (function () {
    function HttpWatcher(base, blockInterval, watchList) {
        this.base = base;
        this.blockInterval = blockInterval;
        this.watchList = watchList;
        this.enabled = true;
    }
    HttpWatcher.prototype.processEvent = function (fromBlockNumber, toBlockNumber, contract, eventName, eventSetting) {
        return __awaiter(this, void 0, void 0, function () {
            var events, _i, events_1, event_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, contract.getPastEvents(eventName, {
                            filter: eventSetting.filter(),
                            fromBlock: fromBlockNumber,
                            toBlock: toBlockNumber,
                        })];
                    case 1:
                        events = _a.sent();
                        _i = 0, events_1 = events;
                        _a.label = 2;
                    case 2:
                        if (!(_i < events_1.length)) return [3, 5];
                        event_1 = events_1[_i];
                        return [4, eventSetting.handler(event_1)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3, 2];
                    case 5: return [2];
                }
            });
        });
    };
    HttpWatcher.prototype.processAllEvent = function (fromBlockNumber, toBlockNumber, watchItem) {
        return __awaiter(this, void 0, void 0, function () {
            var events, _i, events_2, event_2, eventName, returnValues, filter, filterResult, k;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, watchItem.contract.getPastEvents('allEvents', {
                            filter: {},
                            fromBlock: fromBlockNumber,
                            toBlock: toBlockNumber,
                        })];
                    case 1:
                        events = _a.sent();
                        for (_i = 0, events_2 = events; _i < events_2.length; _i++) {
                            event_2 = events_2[_i];
                            eventName = event_2.event, returnValues = event_2.returnValues;
                            if (watchItem.listener[eventName]) {
                                filter = watchItem.listener[eventName].filter();
                                filterResult = true;
                                for (k in filter) {
                                    if (!returnValues[k] ||
                                        returnValues[k].toLowerCase() !== filter[k].toLowerCase()) {
                                        filterResult = false;
                                        break;
                                    }
                                }
                                if (filterResult) {
                                    watchItem.listener[eventName].handler(event_2);
                                }
                            }
                        }
                        return [2];
                }
            });
        });
    };
    HttpWatcher.prototype.start = function (lastBlockNumber) {
        if (lastBlockNumber === void 0) { lastBlockNumber = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var currentBlockNumber, _i, _a, watchItem, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.base.getBlockNumber()];
                    case 1:
                        currentBlockNumber = _b.sent();
                        lastBlockNumber = lastBlockNumber || currentBlockNumber - 1;
                        common_1.logger.info('start syncing process', lastBlockNumber, currentBlockNumber);
                        common_1.logger.info('finish syncing process', currentBlockNumber);
                        _b.label = 2;
                    case 2:
                        if (!true) return [3, 12];
                        return [4, common_1.delay(this.blockInterval)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 10, , 11]);
                        lastBlockNumber = currentBlockNumber + 1;
                        return [4, this.base.getBlockNumber()];
                    case 5:
                        currentBlockNumber = _b.sent();
                        if (lastBlockNumber > currentBlockNumber) {
                            return [3, 2];
                        }
                        _i = 0, _a = this.watchList;
                        _b.label = 6;
                    case 6:
                        if (!(_i < _a.length)) return [3, 9];
                        watchItem = _a[_i];
                        return [4, this.processAllEvent(lastBlockNumber, currentBlockNumber, watchItem)];
                    case 7:
                        _b.sent();
                        if (this.enabled === false) {
                            return [2];
                        }
                        _b.label = 8;
                    case 8:
                        _i++;
                        return [3, 6];
                    case 9: return [3, 11];
                    case 10:
                        err_1 = _b.sent();
                        common_1.logger.error('watch error:', err_1);
                        return [3, 11];
                    case 11: return [3, 2];
                    case 12: return [2];
                }
            });
        });
    };
    HttpWatcher.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.enabled = false;
                return [2];
            });
        });
    };
    return HttpWatcher;
}());
exports.default = HttpWatcher;
//# sourceMappingURL=httpwatcher.js.map