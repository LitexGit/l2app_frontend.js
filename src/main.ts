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
import { AbiItem, BN } from 'web3/node_modules/web3-utils';
import Puppet from './puppet';
import HttpWatcher from './httpwatcher';
import { SETTLE_WINDOW, MESSAGE_COMMIT_BLOCK_EXPERITION, ADDRESS_ZERO } from './utils/constants';
import { ERC20ABI } from './ERC20';
import { tx as appTX, events as appEvents, methods as ethMethods, appMethods } from './service/cita';
import { events as ethEvents } from './service/eth';


/**
 * INTERNAL EXPORTS
 * these exports are used within this library
 * DON'T export them in L2.ts
 */
export var cita: any; // cita sdk object
export var web3_10: Web3 // eth sdk object;
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
    web3_10 = new Web3(Web3.givenProvider || ethProvider);
    let blockNumber = await web3_10.eth.getBlockNumber();
    console.log("blockNumber is ", blockNumber);
    console.log("Contract is ", Contract);

    console.log("ethPaymentNetwork", ethPaymentNetwork);

    ethPN = new Contract(ethProvider, abi2jsonInterface(ethPaymentNetwork.abi), ethPaymentNetwork.address);
    ethPN.options.from = user;
    ethPN.options.address = ethPaymentNetwork.address;

    console.log('ethPN is ', ethPN);

    ERC20 = new Contract(ethProvider, abi2jsonInterface(ERC20ABI));


    // console.log("CITASDK", CITASDK);

    user = userAddress;
    cp = await ethPN.methods.provider().call();
    l2 = await ethPN.methods.regulator().call();

    console.log("cp / l2 is ", cp, l2);

    console.log("appRpcUrl", appRpcUrl);
    cita = CITASDK(appRpcUrl);
    console.log("cita is ", cita);

    console.log("app abi", appPaymentNetwork.abi);
    appPN = new cita.base.Contract(abi2jsonInterface(appPaymentNetwork.abi), appPaymentNetwork.address);

    let appEthPN = await appPN.methods.paymentNetworkMap(ADDRESS_ZERO).call();
    console.log('appEthPN', appEthPN);


    // get puppet ready
    await initPuppet();

    // init listeners on both chains
    initListeners();

    //TODO: check not handled cita_event

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

  async deposit(amount: string, token: string = ADDRESS_ZERO ) {

    let channelID = await ethPN.methods.getChannelID(user, token).call();
    console.log("channelID is ", channelID);
    // if (channelID) {
      let channel = await ethPN.methods.channels(channelID).call();
      console.log('channel is ', channel);
      if (Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
        // add deposit

        let appChannel = await appPN.methods.channelMap(channelID).call();

        if(Number(appChannel.status) !== CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
          throw new Error("channel status of appchain is not open");
        }

        let data = ethPN.methods.userDeposit(channelID, amount).encodeABI();
        if (token == ADDRESS_ZERO) {
          await sendEthTx(user, ethPN.options.address, amount, data);
        } else {
          await sendEthTx(user, token, 0, ERC20.methods.approve(ethPN.options.address, amount).encodeABI());
          await sendEthTx(user, ethPN.options.address, 0, data);
        }

    } else {
      // open channel
      let data = ethPN.methods.openChannel(
        user,
        puppet.getAccount().address,
        SETTLE_WINDOW,
        token,
        amount
      ).encodeABI();

      if (token == ADDRESS_ZERO){
        await sendEthTx(user, ethPN.options.address, amount, data);
      }else{
        //Approve ERC20

        await sendEthTx(user, token, 0, ERC20.methods.approve(ethPN.options.address, amount).encodeABI());
        await sendEthTx(user, ethPN.options.address, 0, data);

      }

    }
  }


  /**
   * withdraw from channel
   * @param amount amount to withdraw
   * @param token OPTIONAL, token contract address, default: '0x0' for ETH
   * @param receiver OPTIONAL, eth address to receive withdrawed asset, default: user's address
   */
  async withdraw(amount: string, token: string = ADDRESS_ZERO, receiver: string = user) {

    let channelID = await ethPN.methods.getChannelID(user, token).call();

    let channel = await appPN.methods.channelMap(channelID).call();

    if (Number(channel.status) != CHANNEL_STATUS.CHANNEL_STATUS_OPEN){
      throw new Error("channel status is not open");
    }

    if(Number(channel.userBalance) < Number(amount)){
      throw new Error("withdraw amount exceeds the balance");
    }

    let tx = { 
      ...appTX,
      validUntilBlock: await getLCB('cita'),
      from: puppet.getAccount().address,
      privateKey: puppet.getAccount().privateKey
    };


    let res;
    if(Number(channel.userBalance) > Number(amount)){
      console.log("will call userProposeWithdraw");
      res = await appPN.methods.userProposeWithdraw(
        channelID,
        amount,
        user,
        await getLCB('eth')
      ).send(tx);
    }else{
      console.log("will call proposeCooperativeSettle");
      res = await appPN.methods.proposeCooperativeSettle(
        channelID,
        amount,
        await getLCB('eth')
      ).send(tx);
    }

    if(res.hash) {
      let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
      if(receipt.errorMessage) {
        console.error('[CITA] - Withdraw', receipt.errorMessage);
        // callbacks.get('Withdraw')(receipt.errorMessage, { ok: false });
        // TODO process errorMessage and notify CB
      }
    }
    // then wait for cita event 'ConfirmUserWithdraw' and carry on
  }


  /**
   * withdraw asset from channel to user's eth address by force
   * @param token OPTIONAL, token contract address, default: '0x0' for ETH
   */
  async forceWithdraw(token: string = ADDRESS_ZERO) {
    let channelID = await ethPN.methods.getChannelID(user, token).call();

    let channel = await ethPN.methods.channels(channelID).call();
    if(channel.status != CHANNEL_STATUS.CHANNEL_STATUS_OPEN){
      throw new Error("channel status is not open");
    }

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
    await sendEthTx(user, ethPN.options.address, 0, data);

    // .once('receipt', (receipt: any) => {
    //   // TODO cancel timeout
    // }).on('error', (error: any, receipt: any) => {
    //   // TODO format error message
    //   callbacks.get('ForceWithdraw')(error, { ok: false });
    // });

    // then wait for cita event 'ChannelSettled' and notify success
  }


  /**
   * transfer asset offchain to specific address
   * @param to destination address of transaction
   * @param amount amount of transaction
   * @param token OPTIONAL, token contract address, default: '0x0' for ETH
   */
  async transfer(to: string, amount: string, token: string = ADDRESS_ZERO) {

    let channelID = await ethPN.methods.getChannelID(user, token).call();

    // get balance proof from eth contract
    let { balance, nonce }
      = await appPN.methods.balanceProofMap(channelID, user).call();

    console.log('balance is' , balance);

    balance = web3_10.utils.toBN(amount).add(web3_10.utils.toBN(balance)).toString();
    nonce = nonce + 1;

    console.log('balance is' , balance);

    let additionalHash = "0x0";
    let messageHash = web3_10.utils.soliditySha3(
      { t: 'address', v: ethPN.options.address },
      { t: 'bytes32', v: channelID },
      { t: 'uint256', v: balance},
      { t: 'bytes32', v: additionalHash}
      );

    let signature = await signMessage(messageHash);


    return;

    let tx = { 
      ...appTX,
      validUntilBlock: await getLCB('cita'),
      from: puppet.getAccount().address,
      privateKey: puppet.getAccount().privateKey
    };

    let res = await appPN.methods.transfer(
      to,
      channelID,
      balance,
      nonce, 
      additionalHash,
      signature 
    ).send(tx);

    if(res.hash) {
      let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
      if(receipt.errorMessage) {
        console.error( '[CITA] - transfer', receipt.errorMessage );
        // callbacks.get('Transfer')(receipt.errorMessage, { ok: false });
        // TODO process errorMessage and notify CB
      }
    }

    // then wait for cita event 'Transfer' and notify success
  }





  async testCoClose(){
    let channelID = await ethPN.methods.getChannelID(user, ADDRESS_ZERO).call();
    await ethMethods.ethSubmitCooperativeSettle(channelID);
  }


  async testGuardProof() {

    let channelID = await ethPN.methods.getChannelID(user, ADDRESS_ZERO).call();
    await appMethods.appSubmitGuardProof(channelID, user);

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


  async getBalance(token: string = ADDRESS_ZERO) {
    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();
    return channel.userBalance;
  }

  async getChannelInfo(token: string = ADDRESS_ZERO) {

    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();

    return channel;

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

  async getPuppets(user: string){

    let pupet = await appPN.methods.puppets(user, 0).call();
    console.log(pupet);

    let paymentNetwork = await appPN.methods.paymentNetworkMap(user).call();
    console.log(paymentNetwork);

    let channelID = await ethPN.methods.getChannelID(user, ADDRESS_ZERO).call();
    console.log("channelID is ", channelID);

    let channel = await ethPN.methods.channels(channelID).call();
    console.log("eth channel is ", channel);

    let appchannel = await appPN.methods.channelMap(channelID).call();
    console.log("app channel is ", appchannel);

    return;
  }
  
} // end of class L2





async function initPuppet() {

  puppet = Puppet.get(user);

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

  await sendEthTx(user, ethPN.options.address, 0, data);

}

export async function sendEthTx(from: string, to: string, value: number | string | BN, data: string) {
  web3_10.eth.sendTransaction({ from, to, value, data }, function (err: any, result: any) {
    console.log("send Transaction", err, result);
  }); 
}

export async function signMessage(messageHash: string) {

  // var params = [messageHash, user];
  // var method = 'personal_sign';

  // return new Promise((resolve, reject) => {
  //   web3.currentProvider.sendAsync({
  //     method,
  //     params,
  //     user,
  //   }, function (err: any, result: any) {
  //     console.log("sign result, ", err, result);
  //     if (err) {
  //       reject(err);
  //     } else {
  //       resolve(result.result)
  //     }
  //   });
  // })


}


async function initListeners () {

  let ethWatcher = new HttpWatcher(web3_10.eth, 15000, ethPN, ethEvents);
  ethWatcher.start();


  let appWatcher = new HttpWatcher(cita.base, 3000, appPN, appEvents);
  appWatcher.start();

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
  // CHANNEL_STATUS_INIT = 1,
  // CHANNEL_STATUS_PENDINGOPEN,
  CHANNEL_STATUS_OPEN = 1,
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


export type L2_CB = (err: any, res: DEPOSIT_EVENT | WITHDRAW_EVENT | FORCEWITHDRAW_EVENT | TRANSFER_EVENT | PUPPETCHANGED_EVENT) => { };
export type PN = {
  address: string,
  abi: string
};

export default L2;