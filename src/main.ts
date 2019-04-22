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
import CITASDK from '@cryptape/cita-sdk';

const Web3 = require('web3');
// import * as Web3 from 'web3';
import Puppet from './puppet';
import HttpWatcher from './httpwatcher';
import {
  SETTLE_WINDOW,
  ADDRESS_ZERO,
  L2_CB,
  L2_EVENT,
  CHANNEL_STATUS,
  PUPPET_STATUS,
  ContractInfo,
  CITA_SYNC_EVENT_TIMEOUT,
} from './utils/constants';
import { events as appEvents, ethMethods, appMethods } from './service/cita';
import { events as ethEvents } from './service/eth';
import { events as sessionEvents } from './service/session';
import {
  sendEthTx,
  abi2jsonInterface,
  getLCB,
  delay,
  prepareSignatureForTransfer,
  sendAppTx,
} from './utils/common';
import L2Session from './session';

/**
 * INTERNAL EXPORTS
 * these exports are used within this library
 * DON'T export them in L2.ts
 */
export let cita: any; // cita sdk object
export let web3_10: any; // eth sdk object;
export let web3_outer: any; // eth sdk object;
export let ethPN: Contract; // eth payment contract
export let ERC20: Contract; // ERC20 contract
export let appPN: Contract; // cita payment contract
export let appSession: Contract; // cita payment contract
export let callbacks: Map<L2_EVENT, L2_CB>; // callbacks for L2.on
export let user: string; // user's eth address
export let l2: string; // L2's eth address
export let cp: string; // CP's eth address
export let puppet: Puppet; // puppet object

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

  private constructor() {}

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
   *
   * @param {string} userAddress               user's ethereum address
   * @param {any}    outerWeb3                 web3 for ethereum from caller
   * @param {string} ethPaymentNetworkAddress  payment network contract info on ethereum
   * @param {string} appRpcUrl                 cita rpc url
   * @param {string} appPaymentNetworkAddress  payment network contract info on cita
   * @param {string} appSessionAddress         session contract address on cita
   *
   */
  async init(
    userAddress: string,
    outerWeb3: any,
    ethPaymentNetworkAddress: string,
    appRpcUrl: string,
    appPaymentNetworkAddress: string,
    appSessionAddress: string
  ) {
    let ethPNInfo: ContractInfo = {
      abi: abi2jsonInterface(
        JSON.stringify(require('./config/onchainPayment.json'))
      ),
      address: ethPaymentNetworkAddress,
    };
    let appPNInfo: ContractInfo = {
      abi: abi2jsonInterface(
        JSON.stringify(require('./config/offchainPayment.json'))
      ),
      address: appPaymentNetworkAddress,
    };

    let appSessionInfo: ContractInfo = {
      abi: abi2jsonInterface(
        JSON.stringify(require('./config/sessionPayment.json'))
      ),
      address: appSessionAddress,
    };

    console.log(
      'start L2.init: userAddress: [%s], ethPaymentNetworkAddress: [%s], appRpcUrl: [%s], appPaymentNetworkAddress: [%s], appSessionAddress: [%s]',
      userAddress,
      ethPaymentNetworkAddress,
      appRpcUrl,
      appPaymentNetworkAddress,
      appSessionAddress
    );

    web3_outer = outerWeb3;
    let provider = outerWeb3.currentProvider;
    web3_10 = new Web3(provider);

    console.log(
      `outer web3 version:`,
      outerWeb3.version,
      `inner web3 version:`,
      web3_10.version
    );

    ethPN = new Contract(provider, ethPNInfo.abi, ethPNInfo.address);
    ethPN.options.from = user;
    ethPN.options.address = ethPNInfo.address;

    let ERC20Abi = abi2jsonInterface(
      JSON.stringify(require('./config/ERC20.json'))
    );
    ERC20 = new Contract(provider, ERC20Abi);

    user = userAddress;
    cp = await ethPN.methods.provider().call();
    l2 = await ethPN.methods.regulator().call();

    console.log('cp / l2 is ', cp, l2);

    cita = CITASDK(appRpcUrl);
    appPN = new cita.base.Contract(appPNInfo.abi, appPNInfo.address);
    appPN.options.address = appPNInfo.address;

    appSession = new cita.base.Contract(
      appSessionInfo.abi,
      appSessionInfo.address
    );

    await this.initPuppet();
    this.initListeners();
    this.initMissingEvent();
    this.initialized = true;

    console.log('finish L2.init');
    return true;
  }

  /** * ---------- Payment APIs ---------- */

  /**
   * Deposit to channel. If there is no channel, open one
   *
   * @param {string | number}  amount  amount to deposit, or initial balance for new channel
   * @param {string}  token   OPTIONAL, token contract address, default: '0x0000000000000000000000000000000000000000' for ETH
   *
   * @returns {Promise<string>} transaction hash of the deposit tx
   */
  async deposit(
    amount: string | number,
    token: string = ADDRESS_ZERO
  ): Promise<string> {
    this.checkInitialized();

    console.log(
      'start deposit with params: amount: [%s], token: [%s]',
      amount + '',
      token
    );
    if (!web3_10.utils.isAddress(token)) {
      throw new Error(`token: [${token}] is not a valid address`);
    }
    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await ethPN.methods.channels(channelID).call();

    amount = web3_10.utils.toBN(amount).toString();
    let ethPNAddress = ethPN.options.address;
    if (Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
      // add deposit
      let appChannel = await appPN.methods.channelMap(channelID).call();
      if (Number(appChannel.status) !== CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
        console.log('appChannel', appChannel);
        throw new Error('channel status of appchain is not open');
      }

      let data = ethPN.methods.userDeposit(channelID, amount).encodeABI();
      if (token === ADDRESS_ZERO) {
        return await sendEthTx(web3_outer, user, ethPNAddress, amount, data);
      } else {
        let approveData = ERC20.methods
          .approve(ethPNAddress, amount)
          .encodeABI();
        await sendEthTx(web3_outer, user, token, 0, approveData);
        return await sendEthTx(web3_outer, user, ethPNAddress, 0, data);
      }
    } else if (Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_INIT) {
      // open channel
      let from = puppet.getAccount().address;
      let data = ethPN.methods
        .openChannel(user, from, SETTLE_WINDOW, token, amount)
        .encodeABI();

      if (token === ADDRESS_ZERO) {
        return await sendEthTx(web3_outer, user, ethPNAddress, amount, data);
      } else {
        // Approve ERC20
        let approveData = ERC20.methods
          .approve(ethPNAddress, amount)
          .encodeABI();
        await sendEthTx(web3_outer, user, token, 0, approveData);
        return await sendEthTx(web3_outer, user, ethPNAddress, 0, data);
      }
    } else {
      throw new Error(
        'can not deposit now, channel status is ' + channel.status
      );
    }
  }

  /**
   * Withdraw from channel. If the withdraw amount == balance, then cooperative settle the channel.
   *
   * @param {string|number} amount      amount to withdraw
   * @param {string} token       OPTIONAL, token contract address, default: '0x0000000000000000000000000000000000000000' for ETH
   * @param {string} receiver    OPTIONAL, eth address to receive withdrawed asset, default: user's address
   *
   * @returns {Promise<string>}
   */
  async withdraw(
    amount: string | number,
    token: string = ADDRESS_ZERO,
    receiver: string = user
  ): Promise<string> {
    this.checkInitialized();

    console.log(
      'start withdraw with params:  amount: [%s], token: [%s]',
      amount + '',
      token
    );

    if (!web3_10.utils.isAddress(token)) {
      throw new Error(`token: [${token}] is not a valid address`);
    }

    amount = web3_10.utils.toBN(amount).toString();
    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();
    // withdraw amount must less than user balance
    if (
      web3_10.utils.toBN(channel.userBalance).lt(web3_10.utils.toBN(amount))
    ) {
      throw new Error('withdraw amount exceeds the balance');
    }

    // if withdraw balance < user's balance, then go walk with userwithdraw process.
    // if withdraw balance == user's balance, then go walk with cooperative settle process.
    if (
      web3_10.utils.toBN(channel.userBalance).gt(web3_10.utils.toBN(amount))
    ) {
      if (Number(channel.status) !== CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
        throw new Error('channel status is not open');
      }
      console.log('call userProposeWithdraw');
      return await sendAppTx(
        appPN.methods.userProposeWithdraw(
          channelID,
          amount,
          user,
          await getLCB(web3_10.eth, 'eth')
        )
      );
    } else {
      if (
        Number(channel.status) ===
        CHANNEL_STATUS.CHANNEL_STATUS_PENDING_CO_SETTLE
      ) {
        console.log('call ethSubmitCooperativeSettle');
        return await ethMethods.ethSubmitCooperativeSettle(channelID);
      }
      console.log('call proposeCooperativeSettle', amount);
      let res = await sendAppTx(
        appPN.methods.proposeCooperativeSettle(
          channelID,
          amount,
          await getLCB(web3_10.eth, 'eth')
        )
      );

      let repeatTime = 0;
      while (repeatTime < CITA_SYNC_EVENT_TIMEOUT) {
        await delay(1000);

        let { status } = await appPN.methods.channelMap(channelID).call();
        if (
          Number(status) === CHANNEL_STATUS.CHANNEL_STATUS_PENDING_CO_SETTLE
        ) {
          console.log('break loop', repeatTime);
          res = await ethMethods.ethSubmitCooperativeSettle(channelID);
          break;
        }
        repeatTime++;
      }

      return res;
    }
  }

  /**
   * Withdraw asset from channel to user's eth address by force
   *
   * @param {string} token      OPTIONAL, token contract address, default: '0x0000000000000000000000000000000000000000' for ETH
   *
   * @returns {Promise<string>} transaction hash of the force withdraw on ETH
   */
  async forceWithdraw(token: string = ADDRESS_ZERO): Promise<string> {
    this.checkInitialized();

    console.log('start forceWithdraw with params: token: [%s]', token);

    if (!web3_10.utils.isAddress(token)) {
      throw new Error(`token: [${token}] is not a valid address`);
    }

    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await ethPN.methods.channels(channelID).call();
    if (Number(channel.status) !== CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
      throw new Error('eth channel status is not open, can not force withdraw');
    }

    let [
      { balance, nonce, additionalHash, signature: partnerSignature },
      {
        amount: inAmount,
        nonce: inNonce,
        regulatorSignature,
        providerSignature,
      },
    ] = await Promise.all([
      appPN.methods.balanceProofMap(channelID, user).call(),
      appPN.methods.rebalanceProofMap(channelID).call(),
    ]);

    partnerSignature = partnerSignature || '0x0';
    regulatorSignature = regulatorSignature || '0x0';
    providerSignature = providerSignature || '0x0';

    console.log(
      'force-close params: channelID: [%s], balance: [%s], nonce: [%s], additionalHash: [%s], partnerSignature: [%s], inAmount: [%s], inNonce: [%s], regulatorSignature: [%s], providerSignature: [%s] ',
      channelID,
      balance,
      nonce,
      additionalHash,
      partnerSignature,
      inAmount,
      inNonce,
      regulatorSignature,
      providerSignature
    );

    let data = ethPN.methods
      .closeChannel(
        channelID,
        balance,
        nonce,
        additionalHash,
        partnerSignature,
        inAmount,
        inNonce,
        regulatorSignature,
        providerSignature
      )
      .encodeABI();
    return await sendEthTx(web3_outer, user, ethPN.options.address, 0, data);
  }

  /**
   * transfer asset offchain to specific address
   *
   * @param {string} to destination address of transaction
   * @param {string|number} amount amount of transaction
   * @param {string} token OPTIONAL, token contract address, default: '0x0000000000000000000000000000000000000000' for ETH
   *
   * @returns {Promise<string>}
   */
  async transfer(
    to: string,
    amount: string | number,
    token: string = ADDRESS_ZERO
  ): Promise<string> {
    this.checkInitialized();

    console.log(
      'start transfer with params: to: [%s], amount: [%s], token: [%s]',
      to,
      amount + '',
      token
    );

    let { isAddress, toBN } = web3_10.utils;

    if (!isAddress(token)) {
      throw new Error(`token: [${token}] is not a valid address`);
    }

    let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();
    if (Number(channel.status) !== CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
      throw new Error('app channel status is not open, can not transfer now');
    }

    // check user's balance is enough
    if (toBN(channel.userBalance).lt(web3_10.utils.toBN(amount))) {
      throw new Error("user's balance is less than transfer amount");
    }

    // get balance proof from eth contract
    let { balance, nonce } = await appPN.methods
      .balanceProofMap(channelID, cp)
      .call();
    balance = toBN(amount)
      .add(toBN(balance))
      .toString();
    nonce = toBN(nonce)
      .add(toBN(1))
      .toString();
    let additionalHash = '0x0';

    let signature = await prepareSignatureForTransfer(
      web3_outer,
      ethPN.options.address,
      channelID,
      balance,
      nonce,
      additionalHash,
      user
    );

    console.log('start Submit Transfer');
    return await sendAppTx(
      appPN.methods.transfer(
        to,
        channelID,
        balance,
        nonce,
        additionalHash,
        signature
      )
    );
  }

  /** * ---------- Session APIs ---------- */

  /**
   * fetch a session instance by sessionID
   *
   * @param sessionID
   *
   * @returns session
   */
  async startSession(sessionID: string): Promise<L2Session> {
    this.checkInitialized();
    let repeatTimes = 10;
    let session: L2Session;
    for (let i = 0; i < repeatTimes; i++) {
      session = await L2Session.getSessionById(sessionID);
      if (session) {
        break;
      }
      await delay(1000);
    }

    if (!session) {
      throw new Error('session not found');
    }
    return session;
  }

  /** * ---------- Query APIs ---------- */

  async getSessionBySessionID(sessionID: string): Promise<L2Session> {
    return await L2Session.getSessionById(sessionID);
  }

  async getMessagesBySessionID(sessionID: string) {
    return await L2Session.getMessagesBySessionID(sessionID);
  }

  async getPlayersBySessionID(sessionID: string) {
    return await L2Session.getPlayersBySessionID(sessionID);
  }

  /**
   * get offchain token balance of user
   *
   * @param {string} token token address, default: '0x0000000000000000000000000000000000000000' for ETH
   *
   * @returns {Promise<string>} user's balance
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
    let ethChannel = await ethPN.methods.channels(channelID).call();

    console.log('ChannelID is ', channelID, ethChannel);
    let channel = await appPN.methods.channelMap(channelID).call();

    return { channelID, ...channel };
  }

  /**
   * get offchain tx transactions for token
   *
   * @param {string} token token address, default: '0x0000000000000000000000000000000000000000' for ETH
   *
   * @returns {Promise<any>} transaction list for token
   */
  async getAllTXs(token: string = ADDRESS_ZERO): Promise<any> {
    this.checkInitialized();

    let [inTXs, outTXs] = await Promise.all([
      appPN.getPastEvents('Transfer', {
        filter: { to: user },
        fromBlock: 0,
        toBlock: 'latest',
      }),
      appPN.getPastEvents('Transfer', {
        filter: { from: user },
        fromBlock: 0,
        toBlock: 'latest',
      }),
    ]);

    const cmpNonce = (key: string) => {
      return (a: any, b: any) => {
        return a[key] - b[key];
      };
    };

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
      };
    };

    inTXs = inTXs.sort(cmpNonce('nonce')).map(tx => getTX(tx));
    outTXs = outTXs.sort(cmpNonce('nonce')).map(tx => getTX(tx));

    return { in: inTXs, out: outTXs };
  }

  /**
   * get all registered puppet of user
   *
   * @returns {Promise<Array<any>>}
   */
  async getAllPuppets(): Promise<Array<any>> {
    this.checkInitialized();

    let puppetList = [];
    let n = 0;
    while (true) {
      try {
        let { p: address, enabled } = await appPN.methods
          .puppets(user, n++)
          .call();
        puppetList.push({ address, enabled });
      } catch (err) {
        break;
      }
    }
    console.log(puppetList);
    return puppetList;
  }

  /**
   * disable user's puppet on chain
   *
   * @param {string} puppet address of user's puppet
   *
   * @returns {Promise<string>} hash of disablePuppet transaction
   */
  async disablePuppet(puppet: string): Promise<string> {
    this.checkInitialized();
    let data = ethPN.methods.disablePuppet(puppet).encodeABI();
    return await sendEthTx(web3_outer, user, ethPN.options.address, 0, data);
  }

  /**
   * query on chain token/ETH balance
   *
   * @param token token address, ETH default: ADDRESS_ZERO
   */
  async getOnchainBalance(token: string = ADDRESS_ZERO) {
    if (token === ADDRESS_ZERO) {
      return await web3_10.eth.getBalance(user);
    } else {
      let contract = new web3_10.eth.Contract(
        require('./config/ERC20.json'),
        token
      );
      // ERC20.options.address = token;
      return await contract.methods.balanceOf(user).call();
    }
  }

  /** ---------- Event API ---------- */

  /**
   *
   * @param {L2_EVENT} event event name to watch
   * @param {L2_CB} callback callback to be executed when the event fired
   *
   */
  on(event: L2_EVENT, callback: L2_CB) {
    // this.checkInitialized();
    callbacks.set(event, callback);
  }

  /**  ---------- Private methods---------- */

  /**
   * check L2 is initialized, if not throw error
   */
  private checkInitialized() {
    if (!this.initialized) {
      throw new Error('L2 is not initialized');
    }
  }

  /**
   * init Puppet when L2 initializing
   */
  async initPuppet() {
    puppet = Puppet.get(user, ethPN.options.address);

    // get puppet from LocalStorage, check if it is valid on eth payment contract
    if (puppet) {
      console.log('puppet is ', puppet);
      let puppetStatus = await appPN.methods
        .isPuppet(user, puppet.getAccount().address)
        .call();
      console.log('puppetStatus', puppetStatus);
      if (puppetStatus) {
        // puppet is active, done
        console.log('puppet is active');
        return;
      }
    } else {
      puppet = Puppet.create(user, ethPN.options.address);
    }

    /*
     * if a new user never register puppet, will register puppet when open channel
     */
    try {
      let firstPuppetAddress = await appPN.methods.puppets(user, 0).call();
      console.log('firstPuppetAddress is exist', firstPuppetAddress);
    } catch (err) {
      console.error('find first puppet error', err);
      return;
    }

    /**
     * if a user register puppet, and local puppet is not registered, will register local puppet here
     */
    let data = ethPN.methods.addPuppet(puppet.getAccount().address).encodeABI();
    await sendEthTx(web3_outer, user, ethPN.options.address, 0, data);
  }

  /**
   * init listeners for payment contract of eth and appchain
   */
  private async initListeners() {
    // before start new watcher, stop the old watcher
    this.ethWatcher && this.ethWatcher.stop();

    // let ethWatchList = [{ contract: ethPN, listener: ethEvents }];
    // this.ethWatcher = new HttpWatcher(web3_10.eth, 5000, ethWatchList);
    // this.ethWatcher.start();

    // before start new watcher, stop the old watcher
    this.appWatcher && this.appWatcher.stop();

    let appWatchList = [
      { contract: appPN, listener: appEvents },
      { contract: appSession, listener: sessionEvents },
    ];
    this.appWatcher = new HttpWatcher(cita.base, 1000, appWatchList);
    this.appWatcher.start();
  }

  /**
   * handle the missing events when user is offline.
   */
  private async initMissingEvent() {
    console.log('start initMissingEvent');

    // get all open channel of user

    let allChannelOpenedEvent = await ethPN.getPastEvents('ChannelOpened', {
      filter: { user },
      fromBlock: 0,
      toBlock: 'latest',
    });

    console.log(
      'getAllChannelOpenedEvent length',
      allChannelOpenedEvent.length
    );

    for (let event of allChannelOpenedEvent) {
      let returnValues: any = event.returnValues;
      let { channelID } = returnValues;
      let channel = await ethPN.methods.channels(channelID).call();

      if (Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
        await appMethods.appSubmitGuardProof(channelID, user);
      }
    }

    // TODO handle missing confirmCooperativeSettle event & confirmUserWithdraw event
    // init missing transfer event

    // init missing cooperativeSettle event

    // init missing userWithdraw event
  }
} // end of class L2

export default L2;
