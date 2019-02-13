/**
 * model class of payment network
 */

import { ethers, Event } from 'ethers'
import { db, Channel, CHANNEL_STATUS, PUPPET_STATUS, WITHDRAW_STATUS } from './internal';
import { BigNumber } from 'ethers/utils';
import { MESSAGE_COMMIT_BLOCK_EXPERITION } from '../utils/constants';

let contract: ethers.Contract;

export class PN {

  address: string;
  abi: string;

  id: number;
  token: string;
  cp: string;
  l2: string;
  createdAt: number;
  updatedAt: number;

  /**
   * constructor
   * @param address PN contract address
   * @param abi PN contract abi string
   *
   * @param id auto increment id
   * @param cp cp master address
   * @param l2 L2 master address
   * @param token erc20 token contract address, undefined for eth
   * @param createdAt create time of this entry, timestamp
   * @param updatedAt last update time of this entry, timestamp
   */
  constructor(
    address: string,
    abi: string,

    id?: number,
    token?: string,
    cp?: string,
    l2?: string,
    createdAt?: number,
    updatedAt?: number
  ) {
    this.address = address;
    this.abi = abi;

    if (id) this.id = id;
    if (token) this.token = token;
    if (cp) this.cp = cp;
    if (l2) this.l2 = l2;
    if (updatedAt) this.updatedAt = updatedAt;
    if (createdAt) {
      this.createdAt = createdAt;
    } else {
      this.createdAt = new Date().getTime();
      console.log('new PN entry created at: ', this.createdAt);
    }
  }

  protected getContract() {
    if (!contract) {
      let { address, abi } = this;
      let contract = new ethers.Contract(address, abi, L2.getInstance().getProvider())
      console.log('contract: ', contract);
    }

    return contract;
  }

  /**
   * sync data from contract
   */
  async syncWithContract() {

    contract = this.getContract();

    // get token
    try {
      let token = await contract.token();
      console.log('token: ', token);
      this.token = token.toString();
      console.log('an erc-20 payment network of ', token);
    } catch (e) {
      console.log('an eth payment network');
    }

    // get cp address
    let cpAddress = await contract.functions.provider();
    console.log('cp: ', cpAddress);
    this.cp = cpAddress.toString();

    // get l2 address
    let l2Address = await contract.regulator();
    console.log('l2: ', l2Address);
    this.l2 = l2Address.toString();
  }

  save() {
    return db.transaction('rw', db.pn, async () => {
      this.updatedAt = new Date().getTime();
      this.id = await db.pn.put(this);
    });
  }

  async startWatch() {

    contract = this.getContract();

    let participant = L2.getInstance().getUserAddress();
    let channelIdentifier = await contract.getChannelIdentifier(participant);

    let filter = undefined;
    for (let key in this.EVENTS) {
      if (key === 'ChannelOpened') {
        filter = contract.filters[key](participant);
      } else {
        filter = contract.filters[key](channelIdentifier);
      }
      contract.on(filter, this.EVENTS[key].handler)
      this.EVENTS[key].filter = filter;
    }
  }

  stopWatch() {

    contract = this.getContract();

    for (let key in this.EVENTS) {
      contract.removeAllListeners(this.EVENTS[key].filter)
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
    let channel = await db.channel.where('channelId').equals(channelIdentifier).first();
    if (!channel) {
      channel = new Channel(this.address);
      let status = await channel.sync();
      await channel.save();
    }

    // notify cp
  }

  protected async handleNewDeposit(
    channelIdentifier: string,
    participant: string,
    newDeposit: BigNumber,
    totalDeposit: BigNumber,
    event: Event
  ) {
    let channel = await db.channel.where('channelId').equals(channelIdentifier).first();
    if (!channel) {
      channel = new Channel(this.address);
      let status = await channel.sync();
    } else {
      let userDeposit = new BigNumber(channel.deposit);
      if (userDeposit.lt(totalDeposit)) {
        channel.deposit = totalDeposit.toString();
        let userBalance = new BigNumber(channel.balance);
        channel.balance = userBalance.add(newDeposit).toString();
      }
    }

    await channel.save();

    // notify cp
    let pnAddress = this.address;
    L2.getInstance().getCB('Deposit') (undefined, {
      pnAddress,
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
    let channel = await db.channel.where('channelId').equals(channelIdentifier).first();
    if (!channel) {
      // TODO
    }

    if (channel.puppet !== puppet) {
      channel.puppet = puppet;
      let updatePuppet = await db.updatePuppet.where('newPuppetAddress').equals(puppet).first();
      updatePuppet.status = PUPPET_STATUS.ONCHAIN;
      await updatePuppet.save();
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
    let channel = await db.channel.where('channelId').equals(channelIdentifier).first();
    if (!channel) {
      // TODO
    }

    if (!withdraw.eq(new BigNumber(channel.withdraw))) {
      channel.withdraw = withdraw.toString();
      channel.balance = new BigNumber(channel.balance).sub(amount).toString();
      let tx = await event.getTransaction();

      let userWithdraw = await db.userWithdraw.filter(uw =>
        uw.channelId === channelIdentifier &&
        uw.balance === channel.balance &&
        uw.lastCommitBlock === lastCommitBlock
      ).first();

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
    let channel = await db.channel.where('channelId').equals(channelIdentifier).first();
    if (!channel || channel.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      // TODO
    }

    channel.sync();
    channel.status = CHANNEL_STATUS.CHANNEL_STATUS_CLOSE;
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
    let channel = await db.channel.where('channelId').equals(channelIdentifier).first();
    if (!channel || channel.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      // TODO
    }

    channel.status = CHANNEL_STATUS.CHANNEL_STATUS_CLOSE;
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
    let channel = await db.channel.where('channelId').equals(channelIdentifier).first();
    if (!channel) {
      // TODO
    }

    channel.status = CHANNEL_STATUS.CHANNEL_STATUS_PARTNER_UPDATE_PROOF;
    await channel.save();
  }

  protected async handleChannelSettle(
    channelIdentifier: string,
    participant: string,
    transferToParticipantAmount: BigNumber,
    transferToParticipantNonce: number,
    event: Event
  ) {
    let channel = await db.channel.where('channelId').equals(channelIdentifier).first();
    if (!channel || channel.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      // TODO
    }

    channel.sync();
    channel.status = CHANNEL_STATUS.CHANNEL_STATUS_CLOSE;
    await channel.save();
  }
}