"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var simple_crypto_js_1 = require("simple-crypto-js");
var main_1 = require("./main");
var web3_utils_1 = require("web3/node_modules/web3-utils");
var Puppet = (function () {
    function Puppet() {
    }
    Puppet.create = function (masterAddress) {
        var puppet = new Puppet();
        var key = main_1.cita.base.accounts.create().privateKey;
        puppet.account = main_1.cita.base.accounts.privateKeyToAccount(key);
        main_1.cita.base.accounts.wallet.add(puppet.account);
        key = new simple_crypto_js_1.default(getPassword(masterAddress)).encrypt(key);
        localStorage.setItem(web3_utils_1.sha3(masterAddress), key);
        return puppet;
    };
    Puppet.get = function (masterAddress) {
        var key = localStorage.getItem(web3_utils_1.sha3(masterAddress));
        if (!key) {
            return null;
        }
        key = new simple_crypto_js_1.default(getPassword(masterAddress)).decrypt(key).toString();
        var puppet = new Puppet();
        puppet.account = main_1.cita.base.accounts.privateKeyToAccount(key);
        return puppet;
    };
    Puppet.prototype.getAccount = function () {
        return this.account;
    };
    return Puppet;
}());
exports.default = Puppet;
function getPassword(address) {
    return address.slice(-8);
}
//# sourceMappingURL=puppet.js.map