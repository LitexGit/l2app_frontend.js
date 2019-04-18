import L2 from '../src/index';
import {
  mock_sendEthTx,
  mock_prepareSignatureForTransfer,
} from './mock_metamask';
import * as common from '../src/utils/common';
import { cp, appSession, appPN, cita, web3_10 } from '../src/main';

const Web3 = require('web3');

import { config } from './config';
import { resolve } from 'url';
import { SESSION_MESSAGE_EVENT } from '../src/utils/constants';
import * as rlp from 'rlp';


let {
  ethPNAddress,
  appPNAddress,
  appSessionAddress,
  appRpcUrl,
  token,
} = config;

const ethRpcUrl = 'http://39.96.8.192:8545';
// const  ethRpcUrl = "http://127.0.0.1:7545";
const ethProvider = new Web3.providers.HttpProvider(ethRpcUrl);

let userAddress = '0x56d77fcb5e4Fd52193805EbaDeF7a9D75325bdC0';
let privateKey =
  '118538D2E2B08396D49AB77565F3038510B033A74C7D920C1C9C7E457276A3FB';
let providerAddress = '0xa08105d7650Fe007978a291CcFECbB321fC21ffe';
let providerPrivateKey =
  '6A22D7D5D87EFC4A1375203B7E54FBCF35FAA84975891C5E3D12BE86C579A6E5';

let sessionID: string;

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
  let balance = await l2.getBalance(token);
  if (balance === '0') {
    return;
  } else {
    Promise.all([
      await l2.withdraw(balance, token),
      await new Promise((resolve, reject) => {
        l2.on('Withdraw', (err, res) => {
          console.log('Received Withdraw', res);

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

async function createSession() {
  let str = new Date().getTime() + userAddress + 'hello world';
  sessionID = web3_10.utils.sha3(str);
  let game = providerAddress;
  let user = userAddress;
  let data = 'my lord';

  let tx = await common.getAppTxOption();
  tx.from = providerAddress;
  tx.privateKey = providerPrivateKey;
  let res = await appSession.methods
    .initSession(
      sessionID,
      cp,
      game,
      [user, cp],
      appPN.options.address,
      web3_10.utils.utf8ToHex(data)
    )
    .send(tx);

  if (res.hash) {
    let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
    if (receipt.errorMessage) {
      throw new Error(receipt.errorMessage);
    } else {
      console.log('submit initSession success');
      return res.hash;
    }
  } else {
    console.log(res);
    throw new Error('submit initSession failed');
  }
}

async function providerSendMessage(type, content) {
  let tx = await common.getAppTxOption();
  tx.from = providerAddress;
  tx.privateKey = providerPrivateKey;

  let from = providerAddress;
  let to = userAddress;

  let { toHex, soliditySha3 } = web3_10.utils;

  console.log(
    'providerSendMessage params:',
    from,
    to,
    sessionID,
    type,
    content
  );
  let messageHash = soliditySha3(
    { t: 'address', v: from },
    { t: 'address', v: to },
    { t: 'bytes32', v: sessionID },
    { t: 'uint8', v: type },
    { t: 'bytes', v: content }
  );
  let signature = await common.myEcsignToHex(
    web3_10,
    messageHash,
    providerPrivateKey
  );

  let channelID =
    '0x0000000000000000000000000000000000000000000000000000000000000000';
  let balance = '0';
  let nonce = '0';
  let amount = '0';
  let additionalHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000';
  let paymentSignature = '0x0';

  let paymentData = [
    channelID,
    toHex(balance),
    toHex(nonce),
    toHex(amount),
    additionalHash,
    paymentSignature,
  ];
  console.log('paymentData: ', paymentData);
  // rlpencode is encoded data
  let rlpencode = '0x' + rlp.encode(paymentData).toString('hex');

  let res = await appSession.methods
    .sendMessage(
      providerAddress,
      userAddress,
      sessionID,
      type,
      content,
      signature,
      rlpencode
    )
    .send(tx);

  if (res.hash) {
    let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
    if (receipt.errorMessage) {
      throw new Error(receipt.errorMessage);
    } else {
      console.log('submit sendMessage success');
      return res.hash;
    }
  } else {
    console.log(res);
    throw new Error('submit sendMessage failed');
  }
}

async function closeSession() {
  let tx = await common.getAppTxOption();
  tx.from = providerAddress;
  tx.privateKey = providerPrivateKey;
  let res = await appSession.methods.closeSession(sessionID).send(tx);

  if (res.hash) {
    let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
    if (receipt.errorMessage) {
      throw new Error(receipt.errorMessage);
    } else {
      console.log('submit closeSession success');
      return res.hash;
    }
  } else {
    console.log(res);
    throw new Error('submit closeSession failed');
  }
}

describe('L2 unit tests', () => {
  let l2: L2;
  beforeAll(async () => {
    console.log('test: [%s]', 'hello world');
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

    let depositAmount = 2e17 + '';

    // open a channel
    Promise.all([
      await l2.deposit(depositAmount, token),
      await new Promise((resolve, reject) => {
        l2.on('Deposit', async (err: any, res: any) => {
          expect(res.amount).toBe(depositAmount);

          console.log('Received Deposit', res);
          resolve(res);
        });
      }),
      await createSession(),
    ]);

    return;
  });

  afterAll(async () => {
    Promise.all([await closeChannelIfExist(l2), await closeSession()]);
    // end session
    return;
  });

  beforeEach(async () => {
    console.log(
      '-----------------------------start next test------------------------------------------'
    );
    await common.delay(1000);
  });

  // it('deposit should success', async () => {
  //   let beforeBalance = await l2.getBalance(token);
  //   // console.log('beforeBalance', beforeBalance);

  //   let depositAmount = 1e14 + '';
  //   let depositPromise = new Promise((resolve, reject) => {
  //     l2.on('Deposit', async (err: any, res: any) => {
  //       console.log('Received Deposit', res);
  //       expect(res.amount).toBe(depositAmount);
  //       let afterBalance = await l2.getBalance(token);
  //       console.log('beforeBalance, aterBalance', beforeBalance, afterBalance);
  //       expect(Number(afterBalance) - Number(beforeBalance)).toBe(
  //         Number(depositAmount)
  //       );
  //       resolve(afterBalance);
  //     });
  //   });
  //   Promise.all([await l2.deposit(depositAmount, token), await depositPromise]);
  // });

  // it('transfer should success', async () => {
  //   let beforeBalance = await l2.getBalance(token);
  //   console.log('beforeBalance is', beforeBalance);

  //   // for (let i = 0; i < 2; i++) {
  //     await l2.transfer(cp, Number(beforeBalance) / 2 + '', token);
  //     await common.delay(1000);
  //   // }

  //   // await common.delay(2000);
  //   let afterBalance = await l2.getBalance(token);
  //   console.log('afterBalance is', afterBalance);

  //   expect(Number(afterBalance)).toBe(Number(beforeBalance) / 2);
  // });

  // it('send session message success', async () => {
  //   let session = await l2.startSession(sessionID);
  //   let content = web3_10.utils.toHex('hello world');
  //   await session.sendMessage(providerAddress, 1, content);
  //   await common.delay(10000);
  //   let messages = await l2.getMessagesBySessionID(sessionID);
  //   expect(messages.length).toBeGreaterThan(0);
  //   expect(messages[messages.length - 1].content).toBe(content);
  // });

  // it('send session message with asset success', async () => {
  //   let balance = await l2.getBalance(token);
  //   let session = await l2.startSession(sessionID);
  //   let content = web3_10.utils.toHex('hello world 2');
  //   let transferBalance = Number(balance) / 2 + '';
  //   for (let i = 0; i < 2; i++) {
  //     await session.sendMessage(
  //       providerAddress,
  //       1,
  //       content,
  //       transferBalance,
  //       token
  //     );
  //     await common.delay(1000);
  //   }
  //   await common.delay(1000);
  //   let messages = await l2.getMessagesBySessionID(sessionID);
  //   expect(messages.length).toBeGreaterThan(0);
  //   expect(messages[messages.length - 1].content).toBe(content);
  //   expect(messages[messages.length - 1].amount).toBe(transferBalance);
  // });

  it('listen session message event', async () => {
    let type = 4;
    let content = web3_10.utils.sha3('hello world');

    let receiveMessagePromise = new Promise<SESSION_MESSAGE_EVENT>(
      (resolve, reject) => {
        l2.on('SessionMessage', (err, res: SESSION_MESSAGE_EVENT) => {
          console.log('receive SessionMessage event', res);
          resolve(res);
        });
      }
    );
    let [_, message] = await Promise.all([
      providerSendMessage(type, content),
      receiveMessagePromise,
    ]);
    let { type: type1, content: content1 } = message;
    expect(type).toBe(type1);
    expect(content).toBe(content1);
  });

  // it('withdraw should success', async () => {
  //   let balance = await l2.getBalance(token);

  //   let withdrawAmount = Number(balance) / 2 + '';
  //   if (balance === '0') {
  //     expect(false).toBe(true);
  //   } else {
  //     let getResultPromise = new Promise((resolve, reject) => {
  //       l2.on('Withdraw', async (err, res) => {
  //         console.log('Received Withdraw', res);
  //         if (err) {
  //           expect(false).toBe(true);
  //           reject(err);
  //         } else {
  //           let afterBalance = await l2.getBalance(token);
  //           expect(afterBalance).toBe(withdrawAmount);
  //           resolve(res);
  //         }
  //       });
  //     });
  //     Promise.all([await l2.withdraw(withdrawAmount, token), await getResultPromise]);
  //   }
  // });

  it('cooperativeSettle should success', async () => {
    let balance = await l2.getBalance(token);
    if (balance === '0') {
      expect(false).toBe(true);
    } else {
      Promise.all([
        await l2.withdraw(balance, token),
        await new Promise((resolve, reject) => {
          l2.on('Withdraw', async (err, res) => {
            console.log('Received Withdraw', res);
            // expect(res.amount).toBe(balance);
            if (err) {
              expect(false).toBe(true);
            } else {
              let afterBalance = await l2.getBalance(token);
              expect(afterBalance).toBe('0');
              resolve(res);
            }
          });
        }),
      ]);
    }
  });

  // it('forcewithdraw should success', async () => {
  //   let depositAmount = 1e14 + '';
  //   // open a channel
  //   Promise.all([
  //     await l2.deposit(depositAmount, token),
  //     await new Promise((resolve, reject) => {
  //       l2.on('Deposit', async (err: any, res: any) => {
  //         expect(res.amount).toBe(depositAmount);

  //         console.log('Received Deposit', res);
  //         resolve(res);
  //       });
  //     }),
  //   ]);
  //   await common.delay(3000);
  //   let watchForceWithdraw = new Promise((resolve, reject) => {
  //     l2.on('ForceWithdraw', async (err, res) => {
  //       expect(true).toBe(true);
  //       console.log('Received ForceWithdraw', res);
  //       resolve(res);
  //     });
  //   });
  //   await Promise.all([watchForceWithdraw, l2.forceWithdraw(token)]);
  // });
});
