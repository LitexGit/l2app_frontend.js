/**
 * model class of payment network
 */

import { db, PN, Puppet, Transfer, Rebalance, REBALANCE_TYPE } from './internal';
import { ethers } from 'ethers';
import { BigNumber, solidityKeccak256 } from 'ethers/utils';
import { SOL_TYPE, SETTLE_WINDOW } from '../utils/constants';
import { MESSAGE_COMMIT_BLOCK_EXPERITION } from '../utils/constants';

export class Channel {

  id: number;

  // owner payment network
  pn: PN;

  // channel data
  meta: {
    channelId: string;
    status: CHANNEL_STATUS;
    settleInfo: {
      settleTX: string;
      closer: string;
      closeType: SETTLE_TYPES; // 1 for cooperative close, 2 for force close
    },
  }

  // user data
  user: {
    address: string;
    balance: string;
    deposit: string;
    puppet: Puppet;
    tredAmount: string;
    tredNonce: number;
    withdraw: string;
    settleAmount: string;
  };

  // cp data
  cp: {
    address: string;
    balance: string;
    tredAmount: string;
    tredNonce: number;
    settleAmount: string;
  };

  // rebalance data
  reb: {
    inAmount: string;
    inNonce: number;
    outAmount: string;
    outNonce: number;
  };

  updatedAt: number;
  createdAt: number;

  /**
   * constructor
   * @param pn owner pn contract object
   * @param user user's eth address
   */
  constructor( pn: PN, user: string ) {
    this.pn = pn;
    this.user.address = user;
  }

  static async getChannelById (channelId: string) {
    return await db.channel.where('meta.channelId').equals(channelId).first();
  }

  async getChannelId() {
    return await this.pn.getChannelId(this.user.address);
  }

  /**
   * sync data from contract
   */
  protected async syncWithContract() {

    let { meta, cp, user, pn } = this;

    meta.channelId = await pn.getChannelId(user.address);
    cp.address = await pn.functions.provider();

    // if no channel existed, stop sync
    if (!meta.channelId) {
      return Promise.reject(`no channel with user ${this.user} exists in contract`);
    }

    let channelInfo = await pn.identifier_to_channel(meta.channelId);

    meta.status = channelInfo[CHANNEL_KEYS.status]
    // if channel is closed, stop sync
    if (meta.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      return Promise.reject(`channel ${meta.channelId} is closed, stop sync`);
    }

    user.puppet = channelInfo[CHANNEL_KEYS.puppet];
    user.deposit = channelInfo[CHANNEL_KEYS.deposit];
    user.withdraw = channelInfo[CHANNEL_KEYS.withdraw];
    user.balance = channelInfo[CHANNEL_KEYS.participantBalance];
  }

  protected async syncWithL2Node() {
    // TODO sync with L2
  }



  /**
   * sync with both contract and L2 Node, return channel status
   * if no channel exists, CHANNEL_STATUS_CLOSE is returned
   */
  async sync(): Promise<CHANNEL_STATUS> {

    // sync remote data
    await this.syncWithContract();

    // if no channel or channel is closed, stop sync
    if (this.meta.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      return Promise.resolve(this.meta.status);
    }

    // sync L2 data
    await this.syncWithL2Node();

    let localChannel = await db.channel.filter(c => c.pn.address === this.pn.pnAddress).first();
    if (!localChannel || localChannel.user.tredNonce < this.user.tredNonce) {
      await this.save();
    }

    return Promise.resolve(this.meta.status);
  }


  /**
   * save to db
   */
  async save() {
    this.updatedAt = new Date().getTime();
    return await db.channel.put(this);
  }

  async transfer(amount: string) {

    let { user, pn, meta } = this;

    let amountBN = new BigNumber(amount);
    let balanceBN = new BigNumber(user.balance);
    if (amountBN.gt(balanceBN)) {
      return Promise.reject('insufficient funds');
    }

    let tredAmount = amountBN.add(new BigNumber(user.tredAmount));
    let nonce = user.tredNonce + 1;

    let request = {
      contractAddress: pn.address,
      channelIdentifier: meta.channelId,
      balance: tredAmount.toString(),
      nonce,
    };

    let types: SOL_TYPE[] = ['address', 'bytes32', 'uint256', 'uint256', 'bytes'];

    let hash = solidityKeccak256(types, Object.values(request));

    let signature = await pn.signer.signMessage(hash);

    let msg = {...request, additionalHash: '', signature };
    // send msg to CP with socket

    // save transfer to db

    new Transfer(
      meta.channelId,
      pn.address,
      tredAmount.toString(),
      amount,
      nonce,
      '',
      user.address,
      pn.cp,
      signature
    ).save();

  }

  /**
   * add deposit to channel
   * @param amount depostit amount
   */
  async addDeposit(amount: string) {

    let participant = this.user.address;
    let amountBN = new BigNumber(amount);

    let tx = await this.pn.setTotalDeposit(participant, { value: amountBN });

    console.log('deposit tx: ', tx.hash);

    return tx;
  }


  /**
   * withdraw from payment network
   * @param amount withdraw amount
   * @param receiver withdraw to this address, default to user's default address
   */
  async performWithdraw(amount: string, receiver: string = this.user.address) {

    let { pn, meta, user } = this;
    // step 1, build a withdraw request message and sign it with puppet
    let userWithdrawRequest = {
      contractAddress: pn.address,
      channelIdentifier: meta.channelId,
      withdraw: new BigNumber(amount),
      lastCommitBlock: MESSAGE_COMMIT_BLOCK_EXPERITION + await pn.provider.getBlockNumber(),
    };

    let types: SOL_TYPE[] = ['address', 'bytes32', 'uint256', 'bytes'];
    let withdrawRequestHash = solidityKeccak256(types, Object.values(userWithdrawRequest));

    let puppet = await db.puppet.where('address').equals(user.puppet.address).first();
    let signatureUser = await puppet.signMessage(withdrawRequestHash);

    let msg = { ...userWithdrawRequest, signatureUser };
    // TODO step 2, socket the msg to CP and wait for response
    let res = { signatureCP: '', signatureL2: '' };

    // step 3, build withdraw transaction based on response and submit to blockchain
    let tx = await pn.participantWithdraw(
      msg.contractAddress,
      msg.lastCommitBlock,
      res.signatureCP,
      res.signatureL2,
      receiver,
    );

    console.log('submitted withdraw tx: ', tx.hash)

    return tx;
  }


  /**
   * open a new channel
   * @param amount initial deposit amount for opening channel
   */
  async open(amount: string) {

    let { pn, user } = this;

    let tx = await pn.setTotalDeposit( user.address, user.puppet, SETTLE_WINDOW, { value: amount });

    console.log('open channel tx: ', tx.hash);

    return tx;
  }


  async coClose() {

    let { pn, meta, user } = this;

    // step 1, build a withdraw request message and sign it with puppet
    let coCloseRequest = {
      contractAddress: pn.address,
      channelIdentifier: meta.channelId,
      balance: new BigNumber(user.balance),
      lastCommitBlock: MESSAGE_COMMIT_BLOCK_EXPERITION + await pn.provider.getBlockNumber(),
    };

    let types: SOL_TYPE[] = ['address', 'bytes32', 'uint256', 'bytes'];
    let coCloseRequestHash = solidityKeccak256(types, Object.values(coCloseRequest));
    let puppet = await db.puppet.where('address').equals(user.puppet.address).first();
    let signatureUser = await puppet.signMessage(coCloseRequestHash);

    let msg = { ...coCloseRequest, signatureUser };

    // TODO step 2, socket msg to CP and wait for response
    let res = { signatureCP: '', signatureL2: '' };

    // step 3, build co-close transaction based on response and submit to blockchain
    let tx = await pn.cooperativeSettle(
      msg.contractAddress,
      msg.balance,
      msg.lastCommitBlock,
      res.signatureCP,
      res.signatureL2,
    );

    console.log('submitted co-close tx: ', tx.hash)

    return tx;
  }



  /**
   * update puppet address in contract to local value
   * @param newPuppet new puppet object
   */
  async updatePuppet(newPuppet: Puppet) {

    let { pn, meta } = this;

    let updatePuppetRequest = {
      contractAddress: pn.address,
      channelIdentifier: meta.channelId,
      lastCommitBlock: MESSAGE_COMMIT_BLOCK_EXPERITION + await pn.provider.getBlockNumber()
    }

    let types: SOL_TYPE[] = ['address', 'bytes32', 'address', 'uint256'];
    let updatePuppetRequestHash = solidityKeccak256(types, Object.values(updatePuppetRequest));

    let signatureUser = await pn.signMessage(updatePuppetRequestHash);

    let NewPuppet = {
      ...updatePuppetRequest,
      signatureUser,
      signatureCP: '',
      newPuppet: newPuppet.address,
    };


    let rebOut = await db.rebalance.where('type').equals(REBALANCE_TYPE.OUT).last();
    let rebalanceOutRequest = {
      contractAddress: pn.address,
      channelIdentifier: meta.channelId,
      outAmount: rebOut.amount,
      outNonce: rebOut.nonce,
    };

    types = ['address', 'bytes32', 'uint256', 'bytes'];
    let rebalanceOutRequestHash = solidityKeccak256(types, Object.values(rebalanceOutRequest));
    signatureUser = await newPuppet.signMessage(rebalanceOutRequestHash);

    let RebalanceOut = {
      ...rebalanceOutRequest,
      signatureUser,
      signatureCP: rebOut.signCP
    }

    let NewPuppetRequest = { NewPuppet, RebalanceOut };

    // TODO socket NewPuppetRequest to CP
  }


  async forceClose() {

    let { pn, user, cp, reb } = this;

    let { additionalHash, sign } = await db.transfer.filter(t => t.nonce === cp.tredNonce && t.from === cp.address).first();
    let { signL2, signCP: signCPIn } = await db.rebalance.filter(r => r.type === REBALANCE_TYPE.IN && r.nonce === reb.inNonce).first();
    let { signUser, signCP: signCPOut } = await db.rebalance.filter(r => r.type === REBALANCE_TYPE.OUT && r.nonce === reb.outNonce).first();

    let tx = await pn.closeChannel(
      user.address,
      cp.tredAmount,
      cp.tredNonce,
      additionalHash,
      sign,
      reb.inAmount,
      reb.inNonce,
      signL2,
      signCPIn,
      reb.outAmount,
      reb.outNonce,
      signUser,
      signCPOut
    )

    // let tx = await contractSigner.closeChannel(
    //   participant,
    //   balance,
    //   nonce,
    //   additionalHash,
    //   partnerSignature,
    //   inAmount,
    //   inNonce,
    //   regulatorSignature,
    //   inProviderSignature,
    //   outAmount,
    //   outNonce,
    //   participantSignature,
    //   outProviderSignature
    // );

    console.log('force close tx: ', tx.hash);

    return tx;
  }

}

export enum CHANNEL_KEYS {
  status,
  isCloser,
  settleBlock,
  puppet,
  deposit,
  withdraw,
  participantBalance,
  participantNonce,
  providerBalance,
  providerNonce,
  inAmount,
  inNonce,
  outAmount,
  outNonce,
};

export enum SETTLE_TYPES { CO = 1, FORCE };

export enum CHANNEL_STATUS {
  CHANNEL_STATUS_INIT = 1,
  CHANNEL_STATUS_PENDINGOPEN,
  CHANNEL_STATUS_OPEN,
  CHANNEL_STATUS_PENDING_UPDATE_PUPPET,
  CHANNEL_STATUS_PENDING_SETTLE,
  CHANNEL_STATUS_CLOSE,
  CHANNEL_STATUS_PARTNER_UPDATE_PROOF,
  CHANNEL_STATUS_REGULATOR_UPDATE_PROOF
};