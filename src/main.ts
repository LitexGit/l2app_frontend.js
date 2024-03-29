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
import { toBN, isAddress } from 'web3/node_modules/web3-utils';
import CITASDK from '@cryptape/cita-sdk';

// import * as Web3 from 'web3';
import Puppet from './puppet';
import HttpWatcher from './httpwatcher';
import {
  SETTLE_WINDOW,
  ADDRESS_ZERO,
  L2_CB,
  L2_EVENT,
  CHANNEL_STATUS,
  ContractInfo,
  CITA_SYNC_EVENT_TIMEOUT,
} from './utils/constants';
import { events as appEvents, ethMethods, appMethods } from './service/cita';
import { events as sessionEvents } from './service/session';
import {
  sendEthTx,
  abi2jsonInterface,
  getLCB,
  delay,
  prepareSignatureForTransfer,
  sendAppTx,
  logger,
  setLogger,
  getERC20Allowance,
} from './utils/common';
import L2Session from './session';
import EthPendingTxStore, { TX_TYPE } from './ethPendingTxStore';
import CancelListener from './cancelListener';
import { ethHelper } from './utils/ethHelper';

/**
 * INTERNAL EXPORTS
 * these exports are used within this library
 * DON'T export them in L2.ts
 */
export let cita: any; // cita sdk object
export let EthProvider: any; // eth provider
export let web3: any; // eth sdk object;
export let ethPN: Contract; // eth payment contract
export let ethChainId: number;
export let ERC20: Contract; // ERC20 contract
export let appPN: Contract; // cita payment contract
export let appSession: Contract; // cita session contract
export let appOperator: Contract; // cita operator contract
export let callbacks: Map<L2_EVENT, L2_CB>; // callbacks for L2.on
export let user: string; // user's eth address
export let l2: string; // L2's eth address
export let cp: string; // CP's eth address
export let puppet: Puppet; // puppet object
export let ethPendingTxStore: EthPendingTxStore;
export let cancelListener: CancelListener;
export let debug: boolean; // debug flag

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

  private constructor() {
    debug = true;
    setLogger();
  }

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

    logger.info(
      'start L2.init: userAddress: [%s], ethPaymentNetworkAddress: [%s], appRpcUrl: [%s], appPaymentNetworkAddress: [%s], appSessionAddress: [%s]',
      userAddress,
      ethPaymentNetworkAddress,
      appRpcUrl,
      appPaymentNetworkAddress,
      appSessionAddress
    );

    user = userAddress;
    web3 = outerWeb3;
    EthProvider = outerWeb3.currentProvider;
    // logger.info(provider.toString());
    // logger.info(JSON.stringify(outerWeb3.version));
    if (typeof web3.version === 'string' && web3.version.startsWith('1.0')) {
      ethChainId = await web3.eth.net.getId();
    } else {
      web3.version.getNetwork((err, result) => {
        ethChainId = result;
      });
    }

    logger.info(`outer web3 version:`, outerWeb3.version);

    ethPN = new Contract(EthProvider, ethPNInfo.abi, ethPNInfo.address);
    ethPN.options.from = user;
    ethPN.options.address = ethPNInfo.address;

    let ERC20Abi = abi2jsonInterface(
      JSON.stringify(require('./config/ERC20.json'))
    );
    ERC20 = new Contract(EthProvider, ERC20Abi);
    ERC20.options.jsonInterface = ERC20Abi;
    ERC20.options.from = user;

    cita = CITASDK(appRpcUrl);
    appPN = new cita.base.Contract(appPNInfo.abi, appPNInfo.address);
    appPN.options.address = appPNInfo.address;

    cp = await appPN.methods.provider().call();
    l2 = await appPN.methods.regulator().call();

    logger.info(`cp / l2 is ${cp} ${l2}`);

    appSession = new cita.base.Contract(
      appSessionInfo.abi,
      appSessionInfo.address
    );

    let operatorCNAddress = await appPN.methods.operator().call();
    logger.info(`op is ${operatorCNAddress}`);
    let operatorAbi = abi2jsonInterface(
      JSON.stringify(require('./config/operatorContract.json'))
    );
    appOperator = new cita.base.Contract(operatorAbi, operatorCNAddress);
    appOperator.options.address = operatorCNAddress;

    logger.info('cita contract init finished');

    await this.initPuppet();
    this.initListeners();
    this.initMissingEvent();
    await this.initEthPendingTxStore();
    await this.initCancelListener();

    this.initialized = true;

    logger.info('finish L2.init');
    return true;
  }

  /** * ---------- Payment APIs ---------- */

  async setDebug(debugFlag: boolean) {
    // debug = debugFlag;
    // setLogger();
  }

  /**
   * if user is in co-settle process, add co-settle request to cancelListener
   *
   * @param tokenList token address array
   */
  async initTokenList(tokenList: Array<string>) {
    logger.info('initTokenList: ', tokenList);
    return;
    for (let token of tokenList) {
      let channelID = await appPN.methods.channelIDMap(user, token).call();
      let channel = await appPN.methods.channelMap(channelID).call();
      let {
        isConfirmed,
        balance,
        lastCommitBlock,
      } = await appPN.methods.cooperativeSettleProofMap(channelID).call();

      if (
        Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_APP_CO_SETTLE
      ) {
        cancelListener.add({
          channelID,
          balance,
          lastCommitBlock: Number(lastCommitBlock),
        });
      }
    }
  }

  /**
   * approve ethPNAddress to spend user's ERC20 token
   *
   * @param amount amount to approve
   * @param token token contract address
   */
  async submitERC20Approval(amount: string | number, token): Promise<string> {
    logger.info(
      'start submitERC20Approval with params: amount: [%s], token: [%s]',
      amount + '',
      token
    );
    if (!isAddress(token)) {
      throw new Error(`token: [${token}] is not a valid address`);
    }
    const amountBN = toBN(amount);

    let allowance = await this.getERC20Allowance(
      user,
      ethPN.options.address,
      token
    );

    if (toBN(allowance).gte(amountBN)) {
      throw new Error('allowance is great than amount now.');
    }

    // let channelID = await ethPN.methods.getChannelID(user, token).call();
    let channelID = await appPN.methods.channelIDMap(user, token).call();

    let approveData = ERC20.methods
      .approve(ethPN.options.address, amountBN.toString())
      .encodeABI();
    let res = await sendEthTx(web3, user, token, 0, approveData);
    ethPendingTxStore.addTx({
      channelID,
      txHash: res,
      user,
      token,
      type: TX_TYPE.TOKEN_APPROVE,
      amount: amount + '',
      time: new Date().getTime(),
    });

    return res;
  }

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

    logger.info(
      'start deposit with params: amount: [%s], token: [%s]',
      amount + '',
      token
    );
    if (!isAddress(token)) {
      throw new Error(`token: [${token}] is not a valid address`);
    }
    let channelID = await appPN.methods.channelIDMap(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();

    amount = toBN(amount).toString();
    let ethPNAddress = ethPN.options.address;
    if (Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
      // add deposit
      let appChannel = await appPN.methods.channelMap(channelID).call();
      if (Number(appChannel.status) !== CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
        logger.info('appChannel', appChannel);
        throw new Error('channel status of appchain is not open');
      }

      let data = ethPN.methods.userDeposit(channelID, amount).encodeABI();
      if (token === ADDRESS_ZERO) {
        let res = await sendEthTx(web3, user, ethPNAddress, amount, data);

        ethPendingTxStore.addTx({
          channelID,
          txHash: res,
          user,
          token,
          type: TX_TYPE.CHANNEL_DEPOSIT,
          amount: amount + '',
          time: new Date().getTime(),
        });

        return res;
      } else {
        return await this.depositERC20Token(
          channelID,
          amount + '',
          token,
          data
        );
      }
    } else if (
      Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_INIT ||
      Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_SETTLE
    ) {
      // open channel
      let from = puppet.getAccount().address;
      let data = ethPN.methods
        .openChannel(user, from, SETTLE_WINDOW, token, amount)
        .encodeABI();

      if (token === ADDRESS_ZERO) {
        let res = await sendEthTx(web3, user, ethPNAddress, amount, data);
        ethPendingTxStore.addTx({
          channelID,
          txHash: res,
          user,
          token,
          type: TX_TYPE.CHANNEL_OPEN,
          amount: amount + '',
          time: new Date().getTime(),
        });
        return res;
      } else {
        return await this.depositERC20Token('', amount + '', token, data);
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

    logger.info(
      'start withdraw with params:  amount: [%s], token: [%s]',
      amount + '',
      token
    );

    if (!isAddress(token)) {
      throw new Error(`token: [${token}] is not a valid address`);
    }

    amount = toBN(amount).toString();
    let channelID = await appPN.methods.channelIDMap(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();
    // withdraw amount must less than user balance
    if (toBN(channel.userBalance).lt(toBN(amount))) {
      throw new Error('withdraw amount exceeds the balance');
    }

    // if withdraw balance < user's balance, then go walk with userwithdraw process.
    // if withdraw balance == user's balance, then go walk with cooperative settle process.
    if (toBN(channel.userBalance).gt(toBN(amount))) {
      if (Number(channel.status) !== CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
        throw new Error('channel status is not open');
      }
      logger.info('call userProposeWithdraw');
      return await sendAppTx(
        appPN.methods.userProposeWithdraw(
          channelID,
          amount,
          user,
          await getLCB(ethHelper, 'eth')
        ),
        'appPN.methods.userProposeWithdraw'
      );
    } else {
      if (
        Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_APP_CO_SETTLE
      ) {
        logger.info('call ethSubmitCooperativeSettle');
        return await ethMethods.ethSubmitCooperativeSettle(channelID);
      }
      logger.info('call proposeCooperativeSettle', amount);
      let res = await sendAppTx(
        appPN.methods.proposeCooperativeSettle(
          channelID,
          amount,
          await getLCB(ethHelper, 'eth')
        ),
        'appPN.methods.proposeCooperativeSettle'
      );

      let repeatTime = 0;
      while (repeatTime < CITA_SYNC_EVENT_TIMEOUT) {
        await delay(1000);

        let { status } = await appPN.methods.channelMap(channelID).call();
        if (Number(status) === CHANNEL_STATUS.CHANNEL_STATUS_APP_CO_SETTLE) {
          logger.info('break loop', repeatTime);
          res = await ethMethods.ethSubmitCooperativeSettle(channelID);
          return res;
        }
        repeatTime++;
      }

      throw new Error('withdraw timeout');
    }
  }

  /**
   * cancel unsubmited cooperative settle request
   *
   * @param token token contract address
   */
  async cancelWithdraw(token: string = ADDRESS_ZERO): Promise<string> {
    const channelID = await appPN.methods.channelIDMap(user, token).call();

    let {
      isConfirmed,
      balance: settleBalance,
      lastCommitBlock,
      providerSignature,
      regulatorSignature,
    } = await appPN.methods.cooperativeSettleProofMap(channelID).call();

    if (!isConfirmed) {
      logger.error('cooperativeSettleProof not confirmed');
      throw new Error('cooperativeSettleProof not confirmed');
    }

    while (true) {
      const { status } = await appPN.methods.channelMap(channelID).call();
      if (Number(status) !== CHANNEL_STATUS.CHANNEL_STATUS_APP_CO_SETTLE) {
        throw new Error(
          'channels status is not pending co settle, will terminate cancel withdraw'
        );
      }

      let currentBlockNumber = await ethHelper.getBlockNumber();
      if (toBN(currentBlockNumber).gt(toBN(lastCommitBlock))) {
        break;
      }
      logger.info(
        'wait to unlock coSettle, currentBlockNumber[%s], lastCommitBlockNumber[%s]',
        currentBlockNumber,
        lastCommitBlock
      );
      await delay(3000);
    }

    return await sendAppTx(
      appPN.methods.unlockCooperativeSettle(channelID),
      'appPN.methods.unlockCooperativeSettle'
    );
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

    logger.info('start forceWithdraw with params: token: [%s]', token);

    if (!isAddress(token)) {
      throw new Error(`token: [${token}] is not a valid address`);
    }

    let channelID = await appPN.methods.channelIDMap(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();
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

    logger.info(
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
    return await sendEthTx(web3, user, ethPN.options.address, 0, data);
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

    logger.info(
      'start transfer with params: to: [%s], amount: [%s], token: [%s]',
      to,
      amount + '',
      token
    );

    if (!isAddress(token)) {
      throw new Error(`token: [${token}] is not a valid address`);
    }

    let channelID = await appPN.methods.channelIDMap(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();
    if (Number(channel.status) !== CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
      throw new Error('app channel status is not open, can not transfer now');
    }

    // check user's balance is enough
    if (toBN(channel.userBalance).lt(toBN(amount))) {
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
      web3,
      ethPN.options.address,
      channelID,
      balance,
      nonce,
      additionalHash,
      user
    );

    logger.info('start Submit Transfer');
    return await sendAppTx(
      appPN.methods.transfer(
        to,
        channelID,
        balance,
        nonce,
        additionalHash,
        signature
      ),
      'appPN.methods.transfer'
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
    let repeatTimes = CITA_SYNC_EVENT_TIMEOUT;
    let session: L2Session;
    for (let i = 0; i < repeatTimes; i++) {
      session = await L2Session.getSessionById(sessionID);
      if (session) {
        logger.info('break loop', i);
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
    logger.info('getBalance called');
    this.checkInitialized();
    let channelID = await appPN.methods.channelIDMap(user, token).call();
    let channel = await appPN.methods.channelMap(channelID).call();
    if (Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_SETTLE) {
      channel.userBalance = '0';
    }
    return channel.userBalance;
  }

  async getChannelInfo(token: string = ADDRESS_ZERO) {
    logger.info('getChannelInfo called');
    this.checkInitialized();
    let channelID = await appPN.methods.channelIDMap(user, token).call();
    // let ethChannel = await ethPN.methods.channelMap(channelID).call();

    logger.info('ChannelID is ', channelID); //, ethChannel);
    let channel = await appPN.methods.channelMap(channelID).call();
    if (Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_SETTLE) {
      channel.userBalance = '0';
    }

    if (
      Number(channel.status) === CHANNEL_STATUS.CHANNEL_STATUS_APP_CO_SETTLE
    ) {
      let {
        isConfirmed,
        balance,
        lastCommitBlock,
      } = await appPN.methods.cooperativeSettleProofMap(channelID).call();
      cancelListener.add({
        channelID,
        balance,
        lastCommitBlock: Number(lastCommitBlock),
      });
    }

    channel.status = await ethPendingTxStore.getChannelStatus(
      channelID,
      Number(channel.status),
      user,
      token
    );

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

    let lastBalance = toBN(0);
    const getTX = (tx: any) => {
      let { channelID, balance, ...rest } = tx.returnValues;
      balance = toBN(balance);
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
   * check a eth transaction has been confirmed
   *
   * @param txHash eth transaction Hash
   * @param syncWithApp sync with the data on app chain, default: false
   *
   * @returns true =  confirmed false = reverted null = unknown
   */
  async getEthTxReceipt(
    txHash: string,
    syncWithApp: boolean = false
  ): Promise<boolean> {
    try {
      let { status: ethStatus } = await ethHelper.getTransactionReceipt(txHash);

      if (!ethStatus) {
        return false;
      }

      if (!syncWithApp) {
        return ethStatus;
      }

      let appStatus = await appOperator.methods.proposedTxMap(txHash).call();
      // logger.info('appStatus', appStatus);
      return appStatus;
    } catch (err) {
      logger.error('getEthTxReceipt fail', err);
      return null;
    }
  }

  /**
   * check user is a new user
   */
  async isNewUser(): Promise<boolean> {
    try {
      let firstPuppetAddress = await appPN.methods.puppets(user, 0).call();
      logger.info('firstPuppetAddress is exist', firstPuppetAddress);
      return false;
    } catch (err) {
      logger.info('first puppet not exist, it is new user', err);
      return true;
    }
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
    logger.info(puppetList);
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
    return await sendEthTx(web3, user, ethPN.options.address, 0, data);
  }

  /**
   * query on chain token/ETH balance
   *
   * @param token token address, ETH default: ADDRESS_ZERO
   */
  async getOnchainBalance(token: string = ADDRESS_ZERO) {
    if (token === ADDRESS_ZERO) {
      return await ethHelper.getBalance(user);
    } else {
      ERC20.options.address = token;
      return await ERC20.methods.balanceOf(user).call();
    }
  }

  /**
   * query ERC20 allowance
   *
   * @param owner owner address
   * @param spender spender address
   * @param token token contract address
   */
  async getERC20Allowance(owner: string, spender: string, token: string) {
    return await getERC20Allowance(owner, spender, token);
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
   * deposit ERC20 token to contract
   *
   * @param amount deposit amount
   * @param token token address
   * @param data contract interface data
   */
  private async depositERC20Token(
    channelID: string,
    amount: string,
    token: string,
    data: string
  ): Promise<string> {
    // Approve ERC20
    let ethPNAddress = ethPN.options.address;
    // let allowance = await this.getERC20Allowance(user, ethPNAddress, token);

    // if (toBN(allowance).lt(toBN(amount))) {
    //   let approveData = ERC20.methods.approve(ethPNAddress, amount).encodeABI();
    //   let txHash = await sendEthTx(web3, user, token, 0, approveData);
    //   ethPendingTxStore.addTx({
    //     channelID,
    //     txHash,
    //     user,
    //     token,
    //     type: TX_TYPE.TOKEN_APPROVE,
    //     amount: amount + '',
    //     time: new Date().getTime(),
    //   });
    // }

    let res = await sendEthTx(web3, user, ethPNAddress, 0, data);
    ethPendingTxStore.addTx({
      channelID,
      txHash: res,
      user,
      token,
      type: !!channelID ? TX_TYPE.CHANNEL_DEPOSIT : TX_TYPE.CHANNEL_OPEN,
      amount: amount + '',
      time: new Date().getTime(),
    });
    return res;
  }

  /**
   * init Puppet when L2 initializing
   */
  async initPuppet() {
    logger.info('start init Pupept');
    puppet = await Puppet.get(user, ethPN.options.address);

    logger.info(`puppet is ${puppet}`);
    // get puppet from LocalStorage, check if it is valid on eth payment contract
    if (puppet) {
      logger.info('puppet is ' + JSON.stringify(puppet));
      let puppetStatus = await appPN.methods
        .isPuppet(user, puppet.getAccount().address)
        .call();
      logger.info('puppetStatus', puppetStatus);
      if (puppetStatus) {
        // puppet is active, done
        logger.info('puppet is active');
        return;
      }
    } else {
      puppet = await Puppet.create(user, ethPN.options.address);
    }

    /*
     * if a new user never register puppet, will register puppet when open channel
     */
    try {
      let firstPuppetAddress = await appPN.methods.puppets(user, 0).call();
      logger.info('firstPuppetAddress is exist', firstPuppetAddress);
    } catch (err) {
      logger.info('first puppet not exist, it is new user', err);
      return;
    }

    /**
     * if a user register puppet, and local puppet is not registered, will register local puppet here
     */
    let data = ethPN.methods.addPuppet(puppet.getAccount().address).encodeABI();
    await sendEthTx(web3, user, ethPN.options.address, 0, data);
  }

  /**
   * init listeners for payment contract of eth and appchain
   */
  private async initListeners() {
    logger.info('start init Listener');
    // before start new watcher, stop the old watcher
    this.appWatcher && this.appWatcher.stop();

    let appWatchList = [
      { contract: appPN, listener: appEvents },
      { contract: appSession, listener: sessionEvents },
    ];
    this.appWatcher = new HttpWatcher(cita.base, 2000, appWatchList);
    this.appWatcher.start();
  }

  private async initEthPendingTxStore() {
    logger.info('start init initEthPendingTxStore');
    ethPendingTxStore && ethPendingTxStore.stopWatch();
    ethPendingTxStore = new EthPendingTxStore();
    await ethPendingTxStore.load();
    ethPendingTxStore.startWatch();
  }

  private async initCancelListener() {
    logger.info('start initCancelListener');
    cancelListener && cancelListener.stop();
    cancelListener = new CancelListener();
    await cancelListener.load();
    cancelListener.start();
  }
  /**
   * handle the missing events when user is offline.
   */
  private async initMissingEvent() {
    logger.info('start init Missing Event');

    // get all open channel of user

    let allChannelOpenedEvent = await ethPN.getPastEvents('ChannelOpened', {
      filter: { user },
      fromBlock: 0,
      toBlock: 'latest',
    });

    logger.info(
      'getAllChannelOpenedEvent length',
      allChannelOpenedEvent.length
    );

    for (let event of allChannelOpenedEvent) {
      let returnValues: any = event.returnValues;
      let { channelID } = returnValues;
      let channel = await appPN.methods.channelMap(channelID).call();

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
