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

const Web3 = require('web3');
// import Web3 from 'web3';
import Puppet from './puppet';
import HttpWatcher from './httpwatcher';
import { SETTLE_WINDOW, MESSAGE_COMMIT_BLOCK_EXPERITION, ADDRESS_ZERO } from './utils/constants';
import { ERC20ABI } from './ERC20';
import { getAppTxOption, events as appEvents, ethMethods as ethMethods, appMethods } from './service/cita';
import { events as ethEvents } from './service/eth';
import { EIP712_TYPES } from './config/TypedData';
import { sendEthTx, signMessage, abi2jsonInterface } from './utils/common';


/**
 * INTERNAL EXPORTS
 * these exports are used within this library
 * DON'T export them in L2.ts
 */
export var cita: any; // cita sdk object
export var web3_10: any// eth sdk object;
export var ethPN: Contract; // eth payment contract
export var ERC20: Contract; // eth payment contract
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

  private initialized: boolean;
  private ethWatcher: HttpWatcher;
  private appWatcher: HttpWatcher;

  private constructor() { }

  // get singleton
  public static getInstance(): L2 {
    if (this._instance === undefined) {
      this._instance = new L2();
      callbacks = new Map<L2_EVENT, L2_CB>();
    }

    return this._instance;
  }

  /**
   * init L2 singleton
   * @param userAddress // user's ethereum address
   * @param ethProvider // web3 provider for ethereum
   * @param ethPaymentNetworkAddress // payment network contract info on ethereum
   * @param appRpcUrl // cita rpc url
   * @param appPaymentNetworkAddress // payment network contract info on cita
   */
  async init(
    userAddress: string,
    ethProvider: provider,
    ethPaymentNetworkAddress: string,
    appRpcUrl: string,
    appPaymentNetworkAddress: string 
  ) {

    let ethPaymentNetwork: PN = {
      abi: JSON.stringify(require('./config/onchainPayment.json')),
      address: ethPaymentNetworkAddress
    };
    let appPaymentNetwork: PN = {
      abi: JSON.stringify(require('./config/offchainPayment.json')),
      address: appPaymentNetworkAddress
    };

    console.log("start init");
    web3_10 = new Web3(Web3.givenProvider || ethProvider);
    let blockNumber = await web3_10.eth.getBlockNumber();
    console.log("blockNumber is ", blockNumber);
    console.log("Contract is ", Contract);
    console.log("ethPaymentNetwork", ethPaymentNetwork);

    ethPN = new Contract(ethProvider, abi2jsonInterface(ethPaymentNetwork.abi), ethPaymentNetwork.address);
    ethPN.options.from = user;
    ethPN.options.address = ethPaymentNetwork.address;

    // console.log('ethPN is ', ethPN);

    ERC20 = new Contract(ethProvider, abi2jsonInterface(ERC20ABI));


    // console.log("CITASDK", CITASDK);

    user = userAddress;
    cp = await ethPN.methods.provider().call();
    l2 = await ethPN.methods.regulator().call();

    console.log("cp / l2 is ", cp, l2);

    console.log("appRpcUrl", appRpcUrl);
    cita = CITASDK(appRpcUrl);
    console.log("cita is ", cita);

    // console.log("app abi", appPaymentNetwork.abi);
    appPN = new cita.base.Contract(abi2jsonInterface(appPaymentNetwork.abi), appPaymentNetwork.address);

    let appEthPN = await appPN.methods.paymentNetworkMap(ADDRESS_ZERO).call();
    // console.log('appEthPN', appEthPN);

    // get puppet ready
    await this.initPuppet();

    // init listeners on both chains
    this.initListeners();

    this.initialized = true;

    //TODO: check not handled cita_event

  }

  /**
   * ---------- Payment APIs ----------
   */

  /**
   * deposit to channel
   * if there is no channel, open one
   * @param amount amount to deposit, or initial balance for new channel
   * @param token OPTIONAL, token contract address, default: '0x0000000000000000000000000000000000000000' for ETH
   */

  async deposit(amount: string, token: string = ADDRESS_ZERO): Promise<string> {

    this.checkInitialized();

    let channelID = await ethPN.methods.getChannelID(user, token).call();
    console.log("channelID is ", channelID);
    let channel = await ethPN.methods.channels(channelID).call();
    console.log('channel is ', channel);
    if (Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
      // add deposit

      let appChannel = await appPN.methods.channelMap(channelID).call();

      if (Number(appChannel.status) !== CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
        throw new Error("channel status of appchain is not open");
      }

      let data = ethPN.methods.userDeposit(channelID, amount).encodeABI();
      if (token == ADDRESS_ZERO) {
        return await sendEthTx(web3_10, user, ethPN.options.address, amount, data);
      } else {
        await sendEthTx(web3_10, user, token, 0, ERC20.methods.approve(ethPN.options.address, amount).encodeABI());
        return await sendEthTx(web3_10, user, ethPN.options.address, 0, data);
      }

    } else if (Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_INIT) {
      // open channel
      let data = ethPN.methods.openChannel(
        user,
        puppet.getAccount().address,
        SETTLE_WINDOW,
        token,
        amount
      ).encodeABI();

      if (token == ADDRESS_ZERO) {
        return await sendEthTx(web3_10, user, ethPN.options.address, amount, data);
      } else {
        //Approve ERC20
        await sendEthTx(web3_10, user, token, 0, ERC20.methods.approve(ethPN.options.address, amount).encodeABI());
        return await sendEthTx(web3_10, user, ethPN.options.address, 0, data);

      }

    } else {
      throw new Error('can not deposit now, channel status is ' + channel.status);
    }
  }


  /**
   * withdraw from channel
   * @param amount amount to withdraw
   * @param token OPTIONAL, token contract address, default: '0x0000000000000000000000000000000000000000' for ETH
   * @param receiver OPTIONAL, eth address to receive withdrawed asset, default: user's address
   */
  async withdraw(amount: string, token: string = ADDRESS_ZERO, receiver: string = user): Promise<string> {

    this.checkInitialized();

    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();

    if (Number(channel.status) != CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
      throw new Error("channel status is not open, can not withdraw now");
    }

    if (Number(channel.userBalance) < Number(amount)) {
      throw new Error("withdraw amount exceeds the balance");
    }

    let tx = await getAppTxOption();

    let res;
    if (Number(channel.userBalance) > Number(amount)) {
      console.log("will call userProposeWithdraw");
      res = await appPN.methods.userProposeWithdraw(
        channelID,
        amount,
        user,
        await getLCB('eth')
      ).send(tx);
    } else {
      console.log("will call proposeCooperativeSettle");
      res = await appPN.methods.proposeCooperativeSettle(
        channelID,
        amount,
        await getLCB('eth')
      ).send(tx);
    }

    if (res.hash) {
      let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
      if (receipt.errorMessage) {
        throw new Error(receipt.errorMessage);
      }else{
        return res.hash
      }
    }else{
      throw new Error('submit tx error');
    }
  }


  /**
   * withdraw asset from channel to user's eth address by force
   * @param token OPTIONAL, token contract address, default: '0x0000000000000000000000000000000000000000' for ETH
   * @returns Promise<string> transaction hash of the force withdraw on ETH
   */
  async forceWithdraw(token: string = ADDRESS_ZERO): Promise<string> {
    this.checkInitialized();

    let channelID = await ethPN.methods.getChannelID(user, token).call();

    let channel = await ethPN.methods.channels(channelID).call();
    // if(channel.status != CHANNEL_STATUS.CHANNEL_STATUS_OPEN){
    //   throw new Error("channel status is not open, can not force withdraw");
    // }

    let [{ balance, nonce, additionalHash, signature: partnerSignature },
      { amount: inAmount, nonce: inNonce, regulatorSignature, providerSignature }]
      = await Promise.all([
        appPN.methods.balanceProofMap(channelID, user).call(),
        appPN.methods.rebalanceProofMap(channelID).call()
      ]);

    partnerSignature = partnerSignature || '0x0';
    regulatorSignature = regulatorSignature || '0x0';
    providerSignature = providerSignature || '0x0';


    console.log('force-close params', {
      channelID,
      balance, nonce, additionalHash, partnerSignature,
      inAmount, inNonce, regulatorSignature, providerSignature
    });

    let data = ethPN.methods.closeChannel(
      channelID,
      balance, nonce, additionalHash, partnerSignature,
      inAmount, inNonce, regulatorSignature, providerSignature
    ).encodeABI();
    return await sendEthTx(web3_10, user, ethPN.options.address, 0, data);

  }


  /**
   * transfer asset offchain to specific address
   * @param to destination address of transaction
   * @param amount amount of transaction
   * @param token OPTIONAL, token contract address, default: '0x0000000000000000000000000000000000000000' for ETH
   */
  async transfer(to: string, amount: string, token: string = ADDRESS_ZERO): Promise<string> {

    this.checkInitialized();

    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await ethPN.methods.channels(channelID).call();
    //check channel status
    if (channel.status != CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
      throw new Error("channel status is not open, can not transfer now");
    }

    // get balance proof from eth contract
    let { balance, nonce } = await appPN.methods.balanceProofMap(channelID, cp).call();

    console.log('balance is', balance);

    balance = web3_10.utils.toBN(amount).add(web3_10.utils.toBN(balance)).toString();
    nonce = web3_10.utils.toBN(nonce).add(web3_10.utils.toBN(1)).toString();

    console.log('balance is', balance);

    let additionalHash = "0x0";

    let typedData = {
      types: EIP712_TYPES,
      primaryType: 'Transfer',
      domain: {
        name: 'litexlayer2',
        version: '1',
        chainId: 4,
        verifyingContract: ethPN.options.address,
      },
      message: {
        channelID: channelID,
        balance,
        nonce,
        additionalHash
      },
    }

    console.log("typedData ", typedData);

    let signature = await signMessage(user, typedData);
    let tx = await getAppTxOption();
    let res = await appPN.methods.transfer(
      to,
      channelID,
      balance,
      nonce,
      additionalHash,
      signature
    ).send(tx);

    if (res.hash) {
      let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
      if (receipt.errorMessage) {
        throw new Error(receipt.errorMessage);
      } else {
        console.log("submit transfer success");
        return res.hash;
      }
    }else{
      throw new Error('submit tx failed')
    }
  }


  async testCoClose() {
    let channelID = await ethPN.methods.getChannelID(user, ADDRESS_ZERO).call();
    await ethMethods.ethSubmitCooperativeSettle(channelID);
  }

  async testGuardProof() {

    // let channelID = await ethPN.methods.getChannelID(user, ADDRESS_ZERO).call();
    // await appMethods.appSubmitGuardProof(channelID, user);

    appPN.getPastEvents('Transfer', {
      filter: { to: user },
      fromBlock: 0,
      // toBlock: 'latest',
    }, console.log);


  }

  /**
   * ---------- Session APIs ----------
   */

  // TODO



  /**
   * ---------- Query APIs ----------
   */


  async getCurrentSession() {
    this.checkInitialized();
    // TODO
  }


  /**
   * get offchain token balance of user
   * @param token token address, default: '0x0000000000000000000000000000000000000000' for ETH
   * @returns Promise<string> user's balance
   */
  async getBalance(token: string = ADDRESS_ZERO): Promise<string> {
    this.checkInitialized();
    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();
    return channel.userBalance;
  }

  async getChannelInfo(token: string = ADDRESS_ZERO) {

    this.checkInitialized();
    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();

    return channel;

  }

  /**
   * get offchain tx transactions for token
   * 
   * @param token token address, default: '0x0000000000000000000000000000000000000000' for ETH
   * @returns Promise<any> transaction list for token
   */
  async getAllTXs(token: string = ADDRESS_ZERO): Promise<any> {
    this.checkInitialized();

    let [inTXs, outTXs] = await Promise.all([
      appPN.getPastEvents("Transfer", { filter: { to: user }, fromBlock: 0, toBlock: 'latest' }),
      appPN.getPastEvents("Transfer", { filter: { from: user }, fromBlock: 0, toBlock: 'latest' })
    ]);

    const cmpNonce = (key: string) => {
      return (a: any, b: any) => { return a[key] - b[key] }
    }

    let lastBalance = web3_10.utils.toBN(0);
    const getTX = (tx: any) => {
      let { channelID, balance, ...rest } = tx.returnValues;
      balance = new web3_10.utils.toBN(balance);
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


  /**
   * ---------- Event API ----------
   */

  on(event: L2_EVENT, callback: L2_CB) {
    // this.checkInitialized();
    callbacks.set(event, callback);
  }



  /**
   * ---------- Private methods----------
  */

  /**
   * check L2 is initialized
   */
  private checkInitialized() {
    if (!this.initialized) {
      throw new Error("L2 is not initialized");
    }
  }


  /**
   * init Puppet when L2 initializing
   */
  private async initPuppet() {

    puppet = Puppet.get(user);

    // get puppet from LocalStorage, check if it is valid on eth payment contract
    if (puppet) {

      console.log("puppet is ", puppet);
      let puppetStatus = await ethPN.methods.puppetMap(user, puppet.getAccount().address).call();
      console.log("puppetStatus", puppetStatus);
      if (Number(puppetStatus) === PUPPET_STATUS.ENABLED) {
        // puppet is active, done
        console.log("puppet is active");
        return;
      }
    }

    /* if no puppet or puppet is disabled,
     * create a new one and add it to payment contract
     */
    puppet = Puppet.create(user);
    console.log("puppet is ", puppet.getAccount().address, user);
    let data = ethPN.methods.addPuppet(puppet.getAccount().address).encodeABI();

    await sendEthTx(web3_10, user, ethPN.options.address, 0, data);

  }



  /**
   * init listeners for payment contract of eth and appchain 
   */
  private async initListeners() {

    //before start new watcher, stop the old watcher
    this.ethWatcher && this.ethWatcher.stop();
    this.ethWatcher = new HttpWatcher(web3_10.eth, 5000, ethPN, ethEvents);
    this.ethWatcher.start();

    //before start new watcher, stop the old watcher
    this.appWatcher && this.appWatcher.stop();
    this.appWatcher = new HttpWatcher(cita.base, 1000, appPN, appEvents);
    this.appWatcher.start();

  }




} // end of class L2

/**
 * get the valid the block number for tx or msg
 * @param chain eth or cita 
 * @returns the last commit block for valid data
 */
export async function getLCB(chain: string) {
  let current = chain === 'eth' ? await web3_10.eth.getBlockNumber() : await cita.base.getBlockNumber();
  if (chain === 'eth') {
    return current + MESSAGE_COMMIT_BLOCK_EXPERITION;
  } else {
    return current + 88;
  }
}


enum PUPPET_STATUS {
  NULL,
  ENABLED,
  DISABLED
};

enum CHANNEL_STATUS {
  CHANNEL_STATUS_INIT = 0,
  // CHANNEL_STATUS_PENDINGOPEN,
  CHANNEL_STATUS_OPEN,
  // CHANNEL_STATUS_PENDING_UPDATE_PUPPET,
  // CHANNEL_STATUS_PENDING_SETTLE,
  CHANNEL_STATUS_CLOSE,
  CHANNEL_STATUS_SETTLE,
  CHANNEL_STATUS_PENDING_CO_SETTLE
};



/**
 * EXTERNAL EXPORTS
 * all properties need outside, will be exposed in L2.ts
 */
export type L2_EVENT = 'Deposit' | 'Withdraw' | 'ForceWithdraw' | 'Transfer' | 'PuppetChanged';

export type DEPOSIT_EVENT = {
  user: string,
  type: number,
  token: string,
  amount: string,
  totalDeposit: string,
  txhash: string
}

export type WITHDRAW_EVENT = {
  user: string,
  type: number,
  token: string,
  amount: string,
  totalWithdraw: string,
  txhash: string
}

export type FORCEWITHDRAW_EVENT = {
  closer: string,
  token: string,
  userSettleAmount: string,
  providerSettleAmount: string,
  txhash: string
}

export type TRANSFER_EVENT = {
  from: string,
  to: string,
  token: string,
  amount: string,
  additionalHash: string,
  totalTransferredAmount: string,
}

export type PUPPETCHANGED_EVENT = {
  user: string,
  puppet: string
  type: number
}


export type L2_CB = (err: any, res: DEPOSIT_EVENT | WITHDRAW_EVENT | FORCEWITHDRAW_EVENT | TRANSFER_EVENT | PUPPETCHANGED_EVENT) => void;
export type PN = {
  address: string,
  abi: string
};

export default L2;