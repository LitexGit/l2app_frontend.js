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
var session_1 = require("../session");
var main_1 = require("../main");
var constants_1 = require("../utils/constants");
exports.events = {
    SendMessage: {
        filter: function () {
            return { from: main_1.cp };
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, from, to, sessionID, type, content, channelID, balance, nonce, amount, transactionHash, session, token;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('--------------------Handle CITA SendMessage--------------------');
                        _a = event.returnValues, from = _a.from, to = _a.to, sessionID = _a.sessionID, type = _a.mType, content = _a.content, channelID = _a.channelID, balance = _a.balance, nonce = _a.nonce, amount = _a.amount, transactionHash = event.transactionHash;
                        console.log(' from: [%s], to: [%s], sessionID: [%s], type: [%s], content: [%s], channelID: [%s], balance: [%s], nonce: [%s], amount: [%s] ', from, to, sessionID, type, content, channelID, balance, nonce, amount);
                        return [4, session_1.default.getSessionById(sessionID, false)];
                    case 1:
                        session = _b.sent();
                        if (!session) {
                            return [2];
                        }
                        return [4, main_1.appPN.methods.channelMap(channelID).call()];
                    case 2:
                        token = (_b.sent()).token;
                        session.callbacks.get('message') &&
                            session.callbacks.get('message')(null, {
                                from: from,
                                to: to,
                                sessionID: sessionID,
                                type: type,
                                content: content,
                                amount: amount,
                                token: token,
                            });
                        main_1.callbacks.get('SessionMessage') &&
                            main_1.callbacks.get('SessionMessage')(null, {
                                session: session,
                                from: from,
                                to: to,
                                type: type,
                                content: content,
                                amount: amount,
                                token: token,
                            });
                        return [2];
                }
            });
        }); },
    },
    CloseSession: {
        filter: function () {
            return {};
        },
        handler: function (event) { return __awaiter(_this, void 0, void 0, function () {
            var sessionID, session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('--------------------Handle CITA CloseSession--------------------');
                        sessionID = event.returnValues.sessionID;
                        console.log('sessionID', sessionID);
                        return [4, session_1.default.getSessionById(sessionID, false)];
                    case 1:
                        session = _a.sent();
                        if (!session) {
                            return [2];
                        }
                        session.status = constants_1.SESSION_STATUS.SESSION_STATUS_CLOSE;
                        session.callbacks.get('close') &&
                            session.callbacks.get('close')(null, {});
                        main_1.callbacks.get('SessionClose') &&
                            main_1.callbacks.get('SessionClose')(null, { session: session });
                        return [2];
                }
            });
        }); },
    },
};
//# sourceMappingURL=session.js.map