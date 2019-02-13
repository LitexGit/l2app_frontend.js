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

import { ethers, utils } from 'ethers'
import * as io from 'socket.io-client'
import { PN, Channel, Puppet, CHANNEL_STATUS } from './model/internal';
import { Web3Provider } from 'ethers/providers';

export class L2 {

  // network provider
  private provider: any;

  // user's master eth address
  private user: string;

  // current puppet
  private puppet: Puppet;

  // socket url of portal server
  private socketUrl: string;

  // payment network list
  private pnList: PN[];

  // socket io client
  private socket: any;

  // singleton object
  private static _instance: L2;

  // callbacks of L2.on
  private callbacks: Map<L2_EVENT, L2_CB>;

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
   * @param userAddress user's main eth address
   * @param socketUrl socket io url of portal server
   * @param pnList supported payment network list
   * @param provider web3 provider
   */
  async init(
    userAddress: string,
    socketUrl: string,
    pnList: PN[],
    provider?: any,
  ) {

    if (!userAddress) {
      Promise.reject('user address is undefined');
    }

    this.user = userAddress;
    this.socketUrl = socketUrl;
    this.pnList = pnList;
    if (provider) this.setProvider(provider);


    // init puppet
    this.puppet = await Puppet.getOrCreate();
    console.log('puppet: ', this.puppet);


    // init socket connection
    if (this.socket === undefined) {
      // this.socket = io(this.socketUrl);
      // NEED API to register eth address to server
    }


    // init payment networks
    for (let pn of this.pnList) {

      console.log('init PN: ', JSON.stringify(pn));

      /**
       * check corresponding channel status
       * */
      let channel = new Channel(pn.address);
      let status = await channel.sync();

      // if channel doesn't exits or is closed, skip current pn
      if (status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) continue;

      // if channel's puppet is outdated, update puppet to local version
      if (this.puppet.address !== channel.puppet) {
        await channel.updatePuppet(this.puppet);
      }


      // sync pn with contract
      await pn.syncWithContract();

      // save updated pn to db
      await pn.save();

      // start watching events
      pn.startWatch();
    }
  }

  getUserAddress() {
    return this.user;
  }

  setUserAddress(user: string) {
    this.user = user;
  }

  getProvider(): Web3Provider {
    console.log('current provider: ', this.provider);
    if (!this.provider) {
      console.log('[using default provider]');
      this.provider = ethers.getDefaultProvider();
    }
    return this.provider
  }

  setProvider(provider: any) {
    this.provider = new ethers.providers.Web3Provider(provider);
  }

  // deposit | openChannel
  async deposit(pnAddress: string, amount: string) {

    let channel = new Channel(pnAddress);
    let status = await channel.sync();

    if (status === CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
      // deposit
      return channel.addDeposit(amount);
    } else {
      // open channel
      return channel.open(amount);
    }
  }


  // withdraw | co-close
  async withdraw(pnAddress: string, amount: string) {

    let channel = new Channel(pnAddress);
    let status = await channel.sync();

    if (status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      return Promise.reject('channel is closed');
    }
    let amountBN = new utils.BigNumber(amount);
    let balanceBN = new utils.BigNumber(channel.balance);
    if (amountBN.gt(balanceBN)) {
      return Promise.reject('insufficient funds');
    }
    if (amountBN.lt(balanceBN)) {
      return channel.performWithdraw(amount);
    } else {
      return channel.coClose();
    }
  }


  async forceClose(pnAddress: string) {

    let channel = new Channel(pnAddress);
    let status = await channel.sync();
    if (status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      return Promise.reject('channel is closed');
    }

    return channel.forceClose();
  }


  async sendAsset(pnAddress: string, amount: string) {

    let channel = new Channel(pnAddress);
    let status = await channel.sync();
    if (status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      return Promise.reject('channel is closed');
    }
    return channel.transfer(amount);
  }

  getCB (event: L2_EVENT) {
    return this.callbacks.get(event);
  }

  getPN (address: string) {
    return this.pnList.find(pn => pn.address === address);
  }

  on(event: L2_EVENT, callback: L2_CB) {
    this.callbacks.set(event, callback);
  }

}

export type L2_EVENT = 'Deposit' | 'Withdraw' | 'ForceWithdraw'

export type L2_CB = (err: any, data: any) => { }

export default L2;