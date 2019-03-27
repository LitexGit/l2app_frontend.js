/**
 * model class of payment network
 */
import SimpleCrypto from 'simple-crypto-js';
import { cita } from './main';
import { sha3 } from 'web3/node_modules/web3-utils';
import { Account } from 'web3/node_modules/web3-eth-accounts';

export default class Puppet {
  private account: Account;

  private constructor() {}

  static create(masterAddress: string): Puppet {
    let puppet = new Puppet();

    let key = cita.base.accounts.create().privateKey;
    puppet.account = cita.base.accounts.privateKeyToAccount(key);

    cita.base.accounts.wallet.add(puppet.account);

    key = new SimpleCrypto(getPassword(masterAddress)).encrypt(key);
    localStorage.setItem(sha3(masterAddress), key);

    return puppet;
  }

  static get(masterAddress: string): Puppet | null {
    let key = localStorage.getItem(sha3(masterAddress));

    if (!key) {
      return null;
    }

    key = new SimpleCrypto(getPassword(masterAddress)).decrypt(key).toString();

    let puppet = new Puppet();
    puppet.account = cita.base.accounts.privateKeyToAccount(key);

    return puppet;
  }

  getAccount() {
    return this.account;
  }
}

function getPassword(address: string) {
  // use the last 8 characters of master address as password
  return address.slice(-8);
}
