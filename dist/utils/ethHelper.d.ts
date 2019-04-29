import { TransactionReceipt } from 'web3/node_modules/web3-core';
declare function getBlockNumber(): Promise<number>;
declare function getTransactionReceipt(txHash: any): Promise<TransactionReceipt>;
declare function getBalance(address: any): Promise<string>;
export declare const ethHelper: {
    getBlockNumber: typeof getBlockNumber;
    getTransactionReceipt: typeof getTransactionReceipt;
    getBalance: typeof getBalance;
};
export {};
