import L2 from './index';
import {
  mock_sendEthTx,
  mock_prepareSignatureForTransfer,
} from '../testcase/mock_metamask';
import * as common from './utils/common';
import { cp } from './main';

const Web3 = require('web3');

const ethPNAddress = '0x276B5d0202967D1aa26C86e135A94B3A0852bFdb';
const appPNAddress = '0x8C4391F387B6d20d4F38b7e5449D755fC0B7DB0E';
const appSessionAddress = '0x418bDb873b3e8B200662571a643F65f7D90B468e';
let appRpcUrl = 'ws://wallet.milewan.com:4337';
let token = '0x0000000000000000000000000000000000000000';

const ethRpcUrl = 'http://54.250.21.165:8545';
// const  ethRpcUrl = "http://127.0.0.1:7545";
const ethProvider = new Web3.providers.HttpProvider(ethRpcUrl);

let userAddress = '0x56d77fcb5e4Fd52193805EbaDeF7a9D75325bdC0';
let privateKey =
  '118538D2E2B08396D49AB77565F3038510B033A74C7D920C1C9C7E457276A3FB';
jest.setTimeout(600000);
Object.defineProperty(common, 'sendEthTx', {
  value: jest.fn(
    async (
      web3: any,
      from: string,
      to: string,
      value: number | string,
      data: string
    ): Promise<string> => {
      console.log('mock sendEthTx');
      let res = await mock_sendEthTx(web3, from, to, value, data, privateKey);
      return res;
    }
  ),
});
Object.defineProperty(common, 'prepareSignatureForTransfer', {
  value: jest.fn(
    async (
      web3_outer: any,
      ethPNAddress: string,
      channelID: string,
      balance: string,
      nonce: string,
      additionalHash: string,
      user: string
    ): Promise<string> => {
      console.log('mock prepareSignatureForTransfer', new Date().getTime());
      let res = await mock_prepareSignatureForTransfer(
        web3_outer,
        ethPNAddress,
        channelID,
        balance,
        nonce,
        additionalHash,
        user,
        privateKey
      );
      console.log('mock prepareSignatureForTransfer end', new Date().getTime());
      return res;
    }
  ),
});

async function closeChannelIfExist(l2: L2) {
  let balance = await l2.getBalance();
  if (balance === '0') {
    return;
  } else {
    Promise.all([
      await l2.withdraw(balance),
      await new Promise((resolve, reject) => {
        l2.on('Withdraw', (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }),
    ]);
    return;
  }
}

describe('L2 unit Tests', () => {
  let l2: L2;
  beforeAll(async () => {
    let outerWeb3 = new Web3(ethProvider);
    let accounts = await outerWeb3.eth.getAccounts();
    console.log('accounts', accounts);
    l2 = L2.getInstance();
    Promise.all([
      await l2.init(
        userAddress,
        outerWeb3,
        ethPNAddress,
        appRpcUrl,
        appPNAddress,
        appSessionAddress
      ),
      await new Promise((resolve, reject) => {
        l2.on('PuppetChanged', (err, res) => {
          console.log('Received PuppetChanged', res);
          resolve(res);
        });
      }),
    ]);

    await closeChannelIfExist(l2);

    let depositAmount = 1e14 + '';

    Promise.all([
      await l2.deposit(depositAmount),
      await new Promise((resolve, reject) => {
        l2.on('Deposit', async (err: any, res: any) => {
          resolve(res);
        });
      }),
    ]);

    return;
  });

  afterAll(async () => {
    await closeChannelIfExist(l2);
    return;
  });

  it('deposit should success', async () => {
    let beforeBalance = await l2.getBalance();
    console.log('beforeBalance', beforeBalance);

    let depositAmount = 1e14 + '';
    let depositPromise = new Promise((resolve, reject) => {
      l2.on('Deposit', async (err: any, res: any) => {
        let afterBalance = await l2.getBalance();
        console.log('beforeBalance', beforeBalance);
        console.log('afterBalance', afterBalance);
        expect(Number(afterBalance) - Number(beforeBalance)).toBe(
          Number(depositAmount)
        );
        resolve(afterBalance);
      });
    });
    Promise.all([await l2.deposit(depositAmount), await depositPromise]);
  });

  it('transfer should success', async () => {
    let beforeBalance = await l2.getBalance();
    await l2.transfer(cp, Number(beforeBalance) / 2 + '');
    let afterBalance = await l2.getBalance();
    expect(Number(afterBalance)).toBe(Number(beforeBalance) / 2);

    // await l2.transfer(cp, Number(afterBalance) / 2 + '');
    // // await common.delay(1000);
    // let afterBalance2 = await l2.getBalance();
    // expect(Number(afterBalance2)).toBe(Number(afterBalance) / 2);
  });

  it('withdraw should success', async () => {
    let balance = await l2.getBalance();
    if (balance === '0') {
      expect(false).toBe(true);
    } else {
      Promise.all([
        await l2.withdraw(balance),
        await new Promise((resolve, reject) => {
          l2.on('Withdraw', async (err, res) => {
            if (err) {
              expect(false).toBe(true);
            } else {
              let afterBalance = await l2.getBalance();
              expect(afterBalance).toBe('0');
              resolve(res);
            }
          });
        }),
      ]);
    }
  });
});
