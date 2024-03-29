import { Account } from 'web3/node_modules/web3-eth-accounts';
export default class Puppet {
    private account;
    constructor();
    static create(masterAddress: string, pnAddress: string): Puppet;
    static get(masterAddress: string, pnAddress: string): Puppet | null;
    getAccount(): Account;
}
