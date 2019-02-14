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

import { ethers, utils, Event } from 'ethers'
import * as io from 'socket.io-client'
import { PN, Channel, Puppet, CHANNEL_STATUS, WITHDRAW_STATUS, UserWithdraw } from './model/internal';
import { Web3Provider } from 'ethers/providers';
import { BigNumber } from 'ethers/utils';

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
      let channel = new Channel(pn, this.user);
      let status = await channel.sync();

      // if channel doesn't exits or is closed, skip current pn
      if (status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) continue;

      // if channel's puppet is outdated, update puppet to local version
      if (this.puppet.address !== channel.user.puppet.address) {
        await channel.updatePuppet(this.puppet);
      }

      // sync pn with contract
      await pn.syncWithContract();

      // save updated pn to db
      await pn.save();

      // start watching events
      this.watchEvents(pn);
    }
  }

  setProvider(provider: any) {
    this.provider = new ethers.providers.Web3Provider(provider);
  }

  // deposit | openChannel
  async deposit(pnAddress: string, amount: string) {

    let channel = new Channel(this.getPN(pnAddress), this.user);
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

    let channel = new Channel(this.getPN(pnAddress), this.user);
    let status = await channel.sync();

    if (status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      return Promise.reject('channel is closed');
    }
    let amountBN = new utils.BigNumber(amount);
    let balanceBN = new utils.BigNumber(channel.user.balance);
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

    let channel = new Channel(this.getPN(pnAddress), this.user);
    let status = await channel.sync();
    if (status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      return Promise.reject('channel is closed');
    }

    return channel.forceClose();
  }


  async sendAsset(pnAddress: string, amount: string) {

    let channel = new Channel(this.getPN(pnAddress), this.user);
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

  private async watchEvents (pn: PN) {

    let participant = this.user;
    let channelIdentifier = pn.getChannelId(participant);
    let filter = undefined;

    for (let key in this.EVENTS) {
      if (key === 'ChannelOpened') {
        filter = pn.filters[key](participant);
      } else {
        filter = pn.filters[key](channelIdentifier);
      }
      pn.on(filter, this.EVENTS[key].handler)
      this.EVENTS[key].filter = filter;
    }
  }

  stopWatch(pn: PN) {
    for (let key in this.EVENTS) {
      pn.removeAllListeners(this.EVENTS[key].filter)
    }
  }

  protected EVENTS = {
    ChannelOpened: { handler: this.handleChannelOpen },
    ChannelNewDeposit: { handler: this.handleNewDeposit },
    PuppetChanged: { handler: this.handlePuppetChange },
    ParticipantWithdraw: { handler: this.handleParticipantWithdraw },
    CooperativeSettled: { handler: this.handleCoSettle },
    ChannelClosed: { handler: this.handleChannelClose },
    PartnerUpdateProof: { handler: this.handlePartnerUpdateProof },
    ChannelSettled: { handler: this.handleChannelSettle },
  }

  protected async handleChannelOpen(
    participant: string,
    puppet: string,
    settleWindow: number,
    amount: BigNumber,
    channelIdentifier: string,
    event: Event
  ) {

    // check db for channel
    let channel = await Channel.getChannelById(channelIdentifier);

    if (!channel) {
      channel = new Channel(this.getPN(event.address), this.user);
      await channel.sync();
      await channel.save();
    }

    // TODO notify cp
  }

  protected async handleNewDeposit(
    channelIdentifier: string,
    participant: string,
    newDeposit: BigNumber,
    totalDeposit: BigNumber,
    event: Event
  ) {

    // check db for channel
    let channel = await Channel.getChannelById(channelIdentifier);
    if (!channel) {
      channel = new Channel(this.getPN(event.address), this.user);
      await channel.sync();
    } else {
      let userDeposit = new BigNumber(channel.user.deposit);
      if (userDeposit.lt(totalDeposit)) {
        channel.user.deposit = totalDeposit.toString();
        let userBalance = new BigNumber(channel.user.balance);
        channel.user.balance = userBalance.add(newDeposit).toString();
      }
    }

    await channel.save();

    // TODO handle error and notify cp

    // notify cp
    this.getCB('Deposit') (undefined, {
      pnAddress: channel.pn.address,
      depositAddress: participant,
      depositAmount: newDeposit.toString()
    });
  }

  protected async handlePuppetChange(
    channelIdentifier: string,
    participant: string,
    puppet: string,
    event: Event
  ) {
    let channel = await Channel.getChannelById(channelIdentifier);
    if (!channel) {
      // TODO
    }

    if (channel.user.puppet.address !== puppet) {
      // TODO how to get the private key info?
      channel.user.puppet = new Puppet(undefined, puppet);

      // let puppetRecord = await updatePuppet.where('newPuppetAddress').equals(puppet).first();
      // updatePuppet.status = PUPPET_STATUS.ONCHAIN;
      // await updatePuppet.save();
    }
  }

  protected async handleParticipantWithdraw(
    channelIdentifier: string,
    participant: string,
    amount: BigNumber,
    withdraw: BigNumber,
    lastCommitBlock: number,
    event: Event
  ) {
    let channel = await Channel.getChannelById(channelIdentifier);
    let pnAddress = event.address;
    if (!channel) {
      // TODO
    }

    if (!withdraw.eq(new BigNumber(channel.user.withdraw))) {
      channel.user.withdraw = withdraw.toString();
      channel.user.balance = new BigNumber(channel.user.balance).sub(amount).toString();
      let tx = await event.getTransaction();

      let userWithdraw = await UserWithdraw.find(channelIdentifier, channel.user.balance, lastCommitBlock);
      if (userWithdraw) {
        userWithdraw.status = WITHDRAW_STATUS.ONCHAIN;
        await userWithdraw.save()
      }
    }
  }

  protected async handleCoSettle(
    channelIdentifier: string,
    participant: string,
    balance: BigNumber,
    event: Event
  ) {
    let channel = await Channel.getChannelById(channelIdentifier);
    if (!channel || channel.meta.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      // TODO
    }

    channel.sync();
    channel.meta.status = CHANNEL_STATUS.CHANNEL_STATUS_CLOSE;
    await channel.save();
  }

  protected async handleChannelClose(
    channelIdentifier: string,
    closing: string,
    balance: BigNumber,
    nonce: number,
    inAmount: BigNumber,
    inNonce: number,
    outAmount: BigNumber,
    outNonce: number,
    event: Event
  ) {
    let channel = await Channel.getChannelById(channelIdentifier);
    if (!channel || channel.meta.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      // TODO
    }

    channel.meta.status = CHANNEL_STATUS.CHANNEL_STATUS_CLOSE;
    await channel.save();
  }

  protected async handlePartnerUpdateProof(
    channelIdentifier: string,
    participant: string,
    participantBalance: BigNumber,
    participantNonce: number,
    providerBalance: BigNumber,
    providerNonce: number,
    event: Event
  ) {
    let channel = await Channel.getChannelById(channelIdentifier);
    if (!channel || channel.meta.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      // TODO
    }

    channel.meta.status = CHANNEL_STATUS.CHANNEL_STATUS_PARTNER_UPDATE_PROOF;
    await channel.save();
  }

  protected async handleChannelSettle(
    channelIdentifier: string,
    participant: string,
    transferToParticipantAmount: BigNumber,
    transferToParticipantNonce: number,
    event: Event
  ) {
    let channel = await Channel.getChannelById(channelIdentifier);
    if (!channel || channel.meta.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      // TODO
    }

    channel.sync();
    channel.meta.status = CHANNEL_STATUS.CHANNEL_STATUS_CLOSE;
    await channel.save();
  }

}

export type L2_EVENT = 'Deposit' | 'Withdraw' | 'ForceWithdraw'

export type L2_CB = (err: any, data: any) => { }

export default L2;