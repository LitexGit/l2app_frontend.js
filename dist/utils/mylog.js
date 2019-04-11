"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function () {
    var originalLog = console.log;
    console.log = function () {
        var args = [].slice.call(arguments);
        originalLog.apply(console.log, [getCurrentDateString()].concat(args));
    };
    function getCurrentDateString() {
        return new Date().toISOString() + ' ------';
    }
});
//# sourceMappingURL=mylog.js.map