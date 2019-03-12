/**
 * L2 Library for Web Apps
 * =======================
 * [L2] is an efficient Layer2 solution for Dapp developers
 *
 * How to use this library
 * -----------------------
 * - **init**
 * get a singleton and init
 * let l2 = L2.newInstance();
 * l2.init(*params*)
 * - **deposit & withdraw**
 * deposit or withdraw when needed
 * - **send & receive**
 * use sendMessage(*MSG*) & on(*EVENT*)to communicate with server
 *
 * [L2]: https://l2.app
 */

import { Contract } from 'web3/node_modules/web3-eth-contract';
import { provider } from 'web3-providers';

import CITASDK from '@cryptape/cita-sdk';
// const { default: CITASDK } = require("@cryptape/cita-sdk");

const Web3 = require('web3');
// import Web3 from 'web3';
import { AbiItem, BN } from 'web3/node_modules/web3-utils';
import Puppet from './puppet';
import { SETTLE_WINDOW, MESSAGE_COMMIT_BLOCK_EXPERITION } from './utils/constants';
import { tx as appTX, events as appEvents } from './service/cita';
import { events as ethEvents } from './service/eth';


/**
 * INTERNAL EXPORTS
 * these exports are used within this library
 * DON'T export them in L2.ts
 */
export var cita: any; // cita sdk object
export var web3: Web3 // eth sdk object;
export var ethPN: Contract; // eth payment contract
export var appPN: Contract; // cita payment contract
export var callbacks: Map<L2_EVENT, L2_CB>; // callbacks for L2.on
export var user: string; // user's eth address
export var l2: string; // L2's eth address
export var cp: string; // CP's eth address
export var puppet: Puppet; // puppet object



/**
 * L2 Class
 * designed in singleton mode
 */
export class L2 {

  // singleton object
  private static _instance: L2;

  private constructor() {}

  // get singleton
  public static getInstance(): L2 {
    if (this._instance === undefined) {
      this._instance = new L2();
    }

    return this._instance;
  }

  /**
   * init L2 singleton
   * @param userAddress // user's ethereum address
   * @param ethProvider // web3 provider for ethereum
   * @param ethPaymentNetwork // payment network contract info on ethereum
   * @param appRpcUrl // cita rpc url
   * @param appPaymentNetwork // payment network contract info on cita
   */
  async init(
    userAddress: string,
    ethProvider: provider,
    ethPaymentNetwork: PN,
    appRpcUrl: string,
    appPaymentNetwork: PN
  ) {

    console.log("start init");
    web3 = new Web3(Web3.givenProvider || ethProvider);
    let blockNumber = await web3.eth.getBlockNumber();
    console.log("blockNumber is ", blockNumber);
    console.log("Contract is ", Contract);

    console.log("ethPaymentNetwork", ethPaymentNetwork);

    ethPN = new Contract(ethProvider, abi2jsonInterface(ethPaymentNetwork.abi), ethPaymentNetwork.address);
    ethPN.options.from = user;
    ethPN.options.address = ethPaymentNetwork.address;

    console.log('ethPN is ', ethPN);

    // console.log("CITASDK", CITASDK);

    user = userAddress;
    cp = await ethPN.methods.provider().call();
    l2 = await ethPN.methods.regulator().call();

    console.log("cp / l2 is ", cp, l2);

    console.log("appRpcUrl", appRpcUrl);
    cita = CITASDK(appRpcUrl);
    console.log("cita is ", cita);

    // appPN = new cita.base.Contract(abi2jsonInterface(appPaymentNetwork.abi), appPaymentNetwork.address);
    // get puppet ready
    await initPuppet();

    // init listeners on both chains
    // initListeners();
  }

  /**
   * ---------- Payment APIs ----------
   */

  /**
   * deposit to channel
   * if there is no channel, open one
   * @param amount amount to deposit, or initial balance for new channel
   * @param token OPTIONAL, token contract address, default: '0x0' for ETH
   */

  async deposit(amount: string, token: string = '0x0') {

    let channelID = await ethPN.methods.getChannelID(user, token).call();
    if (channelID) {
      let channel = await ethPN.methods.channels(channelID).call();
      if (channel.status === CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
        // add deposit
        ethPN.methods.userDeposit(channelID, amount).send()
          .once('receipt', (receipt: any) => {
            callbacks.get('Deposit')(null, {
              ok: true,
              totalDeposit: receipt.events.returnValues.totalDeposit
            });
          })
          .on('error', (err: any, receipt: any) => {
            callbacks.get('Deposit')(err, { ok: false });
            // TODO need to destruct err object ?
          });
      }
    } else {
      // open channel
      ethPN.methods.openChannel(
        user,
        puppet.getAccount().address,
        SETTLE_WINDOW,
        token,
        amount
      ).send()
        .once('receipt', (receipt: any) => {
          callbacks.get('Deposit')(null, {
            ok: true,
            totalDeposit: amount
          });
        })
        .on('error', (err: any, receipt: any) => {
          callbacks.get('Deposit')(err, { ok: false });
          // TODO need to destruct err object ?
        });
    }
  }


  /**
   * withdraw from channel
   * @param amount amount to withdraw
   * @param token OPTIONAL, token contract address, default: '0x0' for ETH
   * @param receiver OPTIONAL, eth address to receive withdrawed asset, default: user's address
   */
  async withdraw(amount: string, token: string = '0x0', receiver: string = user) {

    let channelID = await ethPN.methods.getChannelID(user, token).call();

    let tx = { 
      ...appTX,
      validUntilBlock: getLCB('cita'),
      from: puppet.getAccount().address
    };

    let res = await appPN.methods.userProposeWithdraw(
      channelID,
      amount,
      getLCB('eth')
    ).send(tx);

    if(res.hash) {
      let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
      if(receipt.errorMessage) {
        console.error('[CITA] - Withdraw', receipt.errorMessage);
        callbacks.get('Withdraw')(receipt.errorMessage, { ok: false });
        // TODO process errorMessage and notify CB
      }
    }

    // then wait for cita event 'ConfirmUserWithdraw' and carry on
  }


  /**
   * withdraw asset from channel to user's eth address by force
   * @param token OPTIONAL, token contract address, default: '0x0' for ETH
   */
  async forceWithdraw(token: string = '0x0') {

    let channelID = await ethPN.methods.getChannelID(user, token).call();

    let [{ balance, nonce, additionalHash, signature: partnerSignature },
      { amount: inAmount, nonce: inNonce, regulatorSignature, providerSignature }]
      = await Promise.all([
        appPN.methods.balanceProofMap(channelID, user).call(),
        appPN.methods.rebalanceProofMap(channelID).call()
      ]);

    await ethPN.methods.closeChannel(
      channelID,
      balance, nonce, additionalHash, partnerSignature,
      inAmount, inNonce, regulatorSignature, providerSignature
    ).once('receipt', (receipt: any) => {
      // TODO cancel timeout
    }).on('error', (error: any, receipt: any) => {
      // TODO format error message
      callbacks.get('ForceWithdraw')(error, { ok: false });
    });

    // then wait for cita event 'ChannelSettled' and notify success
  }


  /**
   * transfer asset offchain to specific address
   * @param to destination address of transaction
   * @param amount amount of transaction
   * @param token OPTIONAL, token contract address, default: '0x0' for ETH
   */
  async transfer(to: string, amount: string, token: string = '0x0') {

    let channelID = await ethPN.methods.getChannelID(user, token).call();

    let tx = { 
      ...appTX,
      validUntilBlock: getLCB('cita'),
      from: puppet.getAccount().address
    };

    // get balance proof from eth contract
    let { balance, nonce, additionalHash }
      = await appPN.methods.balanceProofMap(channelID, user).call();

    // TODO nonce + 1 
      

    balance = new BN(amount).add(balance);

    // additionalHash 设置为"0x0"
    // signature 签名 hash = soliditySha3(ethPaymentContractAddress, channelID, balance, nonce, additionalHash)
    // 请求Metamask签名

    let res = await appPN.methods.transfer(
      to,
      channelID,
      balance,
      nonce, 
      additionalHash
    ).send(tx);

    if(res.hash) {
      let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
      if(receipt.errorMessage) {
        console.error( '[CITA] - transfer', receipt.errorMessage );
        callbacks.get('Transfer')(receipt.errorMessage, { ok: false });
        // TODO process errorMessage and notify CB
      }
    }

    // then wait for cita event 'Transfer' and notify success
  }


  /**
   * ---------- Session APIs ----------
   */

  // TODO



  /**
   * ---------- Query APIs ----------
   */


  async getCurrentSession() {
    // TODO
  }


  async getBalance(token: string = '0x0') {
    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();
    return channel.userBalance;
  }

  async getAllTXs(token: string = '0x0') {

    let [inTXs, outTXs] = await Promise.all([
      appPN.getPastEvents('Transfer', { filter: { to: user } }),
      appPN.getPastEvents('Transfer', { filter: { from: user } })
    ]);

    const cmpNonce = (key: string) => {
      return (a: any, b: any) => { return a[key] - b[key] }
    }

    let lastBalance = new BN(0);
    const getTX = (tx: any) => {
      let { channelID, balance, ...rest } = tx.returnValues;
      balance = new BN(balance);
      let amount = balance.sub(lastBalance).toString();
      lastBalance = balance;

      return {
        id: tx.transactionHash,
        amount,
        ...rest,
      }
    }

    inTXs = inTXs.sort(cmpNonce('nonce')).map(tx => getTX(tx));
    outTXs = outTXs.sort(cmpNonce('nonce')).map(tx => getTX(tx));
    
    return { in: inTXs, out: outTXs };
  }


  async getAllPNs() {
    // TODO need pn collections in appchain payment contract
  }


  /**
   * ---------- Event API ----------
   */

  on(event: L2_EVENT, callback: L2_CB) {
    callbacks.set(event, callback);
  }
} // end of class L2





async function initPuppet() {

  puppet = Puppet.get(user);

  if (puppet) {

    console.log("puppet is ", puppet);
    let puppetStatus = await ethPN.methods.puppetMap(user, puppet.getAccount().address).call();
    if (puppetStatus === PUPPET_STATUS.ENABLED) {
      // puppet is active, done
      return;
    }
  }

  /* if no puppet or puppet is disabled,
   * create a new one and add it to payment contract
   */
  puppet = Puppet.create(user);
  console.log("puppet is ", puppet.getAccount().address, user);
  let data = ethPN.methods.addPuppet(puppet.getAccount().address).encodeABI();

  web3.eth.sendTransaction({
    from: user,
    to: ethPN.options.address,
    value: 0,
    data: data
  }, function(err: any, result: any){
    console.log("send Transaction", err, result);
  });




  // let result = await ethPN.methods.addPuppet(puppet.getAccount().address).send({ from: user });
  // console.log("send Result is ", result);
    // .once('receipt', (receipt: any) => {
    //   console.log('Puppet update success: ', receipt);
    //   Promise.resolve();
    // })
    // .on('error', (err: any, receipt: any) => {
    //   Promise.reject(`Puppet update error: ${JSON.stringify(err)}`)
    // });
}


async function initListeners () {

  // events on appchain
  Object.keys(appEvents).forEach((event) => {
    let { filter, handler } = appEvents[event];
    appPN.events[event]({ filter }, handler);
  });

  // events on ethereum
  Object.keys(ethEvents).forEach((event) => {
    let { filter, handler } = ethEvents[event];
    ethPN.events[event]({ filter }, handler);
  });
}
  
function abi2jsonInterface(abi: string): AbiItem[] | undefined {
  try {
    let abiArray: AbiItem[] = JSON.parse(abi);
    if (!Array.isArray(abiArray)) return undefined;
    return abiArray;
  } catch(e) {
    return undefined;
  }
}

async function getLCB(chain: string) {
  let current = chain === 'eth' ? await web3.eth.getBlockNumber() : await cita.base.getBlockNumber();
  return current + MESSAGE_COMMIT_BLOCK_EXPERITION;
}


enum PUPPET_STATUS {
  NULL,
  ENABLED,
  DISABLED
};

enum CHANNEL_STATUS {
  CHANNEL_STATUS_INIT = 1,
  CHANNEL_STATUS_PENDINGOPEN,
  CHANNEL_STATUS_OPEN,
  CHANNEL_STATUS_PENDING_UPDATE_PUPPET,
  CHANNEL_STATUS_PENDING_SETTLE,
  CHANNEL_STATUS_CLOSE,
  CHANNEL_STATUS_PARTNER_UPDATE_PROOF,
  CHANNEL_STATUS_REGULATOR_UPDATE_PROOF
};




/**
 * EXTERNAL EXPORTS
 * all properties need outside, will be exposed in L2.ts
 */
export type L2_EVENT = 'Deposit' | 'Withdraw' | 'ForceWithdraw' | 'Transfer' | 'DisablePuppet';
export type L2_CB = (err: any, res: any) => { };
export type PN = {
  address: string,
  abi: string
};

export default L2;