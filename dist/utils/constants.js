"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETH_MESSAGE_COMMIT_BLOCK_EXPERITION = 250;
exports.CITA_TX_COMMIT_BLOCK_EXPERITION = 88;
exports.CITA_TX_BLOCK_INTERVAL = 1000;
exports.SETTLE_WINDOW = 5;
exports.ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
var PUPPET_STATUS;
(function (PUPPET_STATUS) {
    PUPPET_STATUS[PUPPET_STATUS["NULL"] = 0] = "NULL";
    PUPPET_STATUS[PUPPET_STATUS["ENABLED"] = 1] = "ENABLED";
    PUPPET_STATUS[PUPPET_STATUS["DISABLED"] = 2] = "DISABLED";
})(PUPPET_STATUS = exports.PUPPET_STATUS || (exports.PUPPET_STATUS = {}));
var CHANNEL_STATUS;
(function (CHANNEL_STATUS) {
    CHANNEL_STATUS[CHANNEL_STATUS["CHANNEL_STATUS_INIT"] = 0] = "CHANNEL_STATUS_INIT";
    CHANNEL_STATUS[CHANNEL_STATUS["CHANNEL_STATUS_OPEN"] = 1] = "CHANNEL_STATUS_OPEN";
    CHANNEL_STATUS[CHANNEL_STATUS["CHANNEL_STATUS_CLOSE"] = 2] = "CHANNEL_STATUS_CLOSE";
    CHANNEL_STATUS[CHANNEL_STATUS["CHANNEL_STATUS_SETTLE"] = 3] = "CHANNEL_STATUS_SETTLE";
    CHANNEL_STATUS[CHANNEL_STATUS["CHANNEL_STATUS_PENDING_CO_SETTLE"] = 4] = "CHANNEL_STATUS_PENDING_CO_SETTLE";
})(CHANNEL_STATUS = exports.CHANNEL_STATUS || (exports.CHANNEL_STATUS = {}));
var SESSION_STATUS;
(function (SESSION_STATUS) {
    SESSION_STATUS[SESSION_STATUS["SESSION_STATUS_INIT"] = 0] = "SESSION_STATUS_INIT";
    SESSION_STATUS[SESSION_STATUS["SESSION_STATUS_OPEN"] = 1] = "SESSION_STATUS_OPEN";
    SESSION_STATUS[SESSION_STATUS["SESSION_STATUS_CLOSE"] = 2] = "SESSION_STATUS_CLOSE";
})(SESSION_STATUS = exports.SESSION_STATUS || (exports.SESSION_STATUS = {}));
//# sourceMappingURL=constants.js.map