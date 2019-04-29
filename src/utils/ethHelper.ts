import { web3 } from '../main';
import { TransactionReceipt } from 'web3/node_modules/web3-core';

async function getBlockNumber(): Promise<number> {
  let promise = new Promise<number>((resolve, reject) => {
    web3.eth.getBlockNumber((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
  return await promise;
}

async function getTransactionReceipt(txHash): Promise<TransactionReceipt> {
  let promise = new Promise<TransactionReceipt>((resolve, reject) => {
    web3.eth.getTransactionReceipt(txHash, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
  return await promise;
}

async function getBalance(address): Promise<string> {
  let promise = new Promise<string>((resolve, reject) => {
    web3.eth.getBalance(address, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
  return await promise;
}

export const ethHelper = {
  getBlockNumber,
  getTransactionReceipt,
  getBalance,
};
