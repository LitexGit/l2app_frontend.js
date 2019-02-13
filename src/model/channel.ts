/**
 * model class of payment network
 */

import L2  from '../L2';
import { db, PN, Puppet, Transfer, Rebalance, REBALANCE_TYPE } from './internal';
import { ethers } from 'ethers';
import { BigNumber, solidityKeccak256 } from 'ethers/utils';
import { SOL_TYPE } from '../utils/constants';
import { MESSAGE_COMMIT_BLOCK_EXPERITION } from '../utils/constants';

let contract: ethers.Contract;
let pn: PN;

export class Channel {

  id: number;

  pnAddress: string;

  // channel data
  channelId: string;
  status: CHANNEL_STATUS;
  settleTX: string;
  closer: string;
  closeType: number; // 1 for cooperative close, 2 for force close

  // user data
  user: string;
  balance: string;
  deposit: string;
  puppet: string;
  tredAmount: string;
  tredNonce: number;
  withdraw: string;
  settleAmount: string;

  // cp data
  cp: string;
  cpBalance: string;
  cpTredAmount: string;
  cpTredNonce: number;
  cpSettleAmount: string;

  // rebalance data
  rebinAmount: string;
  rebinNonce: number;
  reboutAmount: string;
  reboutNonce: number;

  updatedAt: number;
  createdAt: number;

  /**
   * constructor
   * @param pnAddress payment network contract address containing this channel
   *
   * @param channelId unique id of channel
   * @param id auto-increment id
   * @param status channel status, see CHANNEL_STATUS for reference
   * @param settleTx hash of the settle transaction
   * @param closer address of the initiator of force-close
   * @param closeType 1 for co-close, 2 for force-close
   *
   * @param puppet puppet address of user
   * @param balance off-chain balance of user
   * @param deposit total amount of user's deposit into channel
   * @param tredAmount total amount of user's off-chain trasactions (to cp)
   * @param tredNonce latest sequence number of user's off-chain transaction
   * @param withdraw total amount of user's withdraw from channel
   * @param settleAmount user's actual amount when settled
   *
   * @param cpBalance off-chain balance of cp
   * @param cpTredAmount total amount of cp's off-chain transactions (to user)
   * @param cpTredNonce latest sequence number of cp's off-chain transaction
   * @param cpSettleAmount cp's actual balance when settled
   *
   * @param rebinAmount total rebalance in amount
   * @param rebinNonce latest sequence number of rebalance in action
   * @param reboutAmount total rebalance out amount
   * @param reboutNonce latest sequence number of rebalance out action
   *
   * @param createdAt
   * @param updatedAt
   */
  constructor(

    pnAddress: string,

    channelId?: string,
    id?: number,
    status?: number,
    settleTX?: string,
    closer?: string,
    closeType?: number,

    user?: string,
    puppet?: string,
    balance?: string,
    deposit?: string,
    tredAmount?: string,
    tredNonce?: number,
    withdraw?: string,
    settleAmount?: string,

    cpBalance?: string,
    cpTredAmount?: string,
    cpTredNonce?: number,
    cpSettleAmount?: string,

    rebinAmount?: string,
    rebinNonce?: number,
    reboutAmount?: string,
    reboutNonce?: number,

    createdAt?: number,
    updatedAt?: number
  ) {

    this.pnAddress = pnAddress;
    if (!L2.getInstance().getPN(pnAddress)) {
      let errMsg = `no PN found of address: ${pnAddress}, have you forgot to pass it in during L2.init ?`;
      console.error(errMsg);
      throw errMsg;
    }

    if (channelId) this.channelId = channelId;
    if (id) this.id = id;
    if (status) this.status = status;
    if (settleTX) this.settleTX = settleTX;
    if (closer) this.closer = closer;
    if (closeType) this.closeType = closeType;

    if (user) this.user = user;
    if (puppet) this.puppet = puppet;
    if (balance) this.balance = balance;
    if (deposit) this.deposit = deposit;
    if (tredAmount) this.tredAmount = tredAmount;
    if (tredNonce) this.tredNonce = tredNonce;
    if (withdraw) this.withdraw = withdraw;
    if (settleAmount) this.settleAmount = settleAmount;

    if (cpBalance) this.cpBalance = cpBalance;
    if (cpTredAmount) this.cpTredAmount = cpTredAmount;
    if (cpTredNonce) this.cpTredNonce = cpTredNonce;
    if (cpSettleAmount) this.cpSettleAmount = cpSettleAmount;

    if (rebinAmount) this.rebinAmount = rebinAmount;
    if (rebinNonce) this.rebinNonce = rebinNonce;
    if (reboutAmount) this.reboutAmount = reboutAmount;
    if (reboutNonce) this.reboutNonce = reboutNonce;

    if (updatedAt) this.updatedAt = updatedAt;
    if (createdAt) {
      this.createdAt = createdAt;
    } else {
      this.createdAt = new Date().getTime();
      console.log('new Channel entry created at: ', this.createdAt);
    }

    this.getContractAndPN();
  }

  protected getContractAndPN() {
    if (contract || pn) return;

    pn = L2.getInstance().getPN(this.pnAddress);
    contract = new ethers.Contract(pn.address, pn.abi, L2.getInstance().getProvider())

    console.log('contract: ', contract);
  }
  /**
   * sync data from contract
   */
  protected async syncWithContract() {

    this.user = L2.getInstance().getUserAddress();
    this.cp = await contract.functions.provider();

    // get channel id
    this.channelId = await contract.getChannelIdentifier(this.user);

    // if no channel existed, stop sync
    if (!this.channelId) {
      return Promise.reject(`no channel with user ${this.user} exists in contract`);
    }

    let channelInfo = await contract.identifier_to_channel(this.channelId);

    this.status = channelInfo[CHANNEL_KEYS.status]
    console.log(`channel status: ${this.status}`);

    // if channel is closed, stop sync
    if (this.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE) {
      return Promise.reject(`channel ${this.channelId} is closed, stop sync`);
    }

    this.puppet = channelInfo[CHANNEL_KEYS.puppet];
    this.deposit = channelInfo[CHANNEL_KEYS.deposit];
    this.withdraw = channelInfo[CHANNEL_KEYS.withdraw];
    this.balance = channelInfo[CHANNEL_KEYS.participantBalance];
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
    if (this.status === CHANNEL_STATUS.CHANNEL_STATUS_CLOSE)
      return Promise.resolve(this.status);

    // sync L2 data
    await this.syncWithL2Node();

    let localChannel = await db.channel.filter(c => c.pnAddress === this.pnAddress).first();
    if (!localChannel || localChannel.tredNonce < this.tredNonce) {
      await this.save();
    }

    return Promise.resolve(this.status);
  }


  /**
   * save to db
   */
  async save() {
    return db.transaction('rw', db.channel, async () => {
      this.updatedAt = new Date().getTime();
      this.id = await db.channel.put(this);
    });
  }

  async transfer(amount: string) {

    let value = new BigNumber(amount);
    let balance = new BigNumber(this.balance);
    if (value.gt(balance)) {
      return Promise.reject('insufficient funds');
    }

    let tredAmount = value.add(new BigNumber(this.tredAmount));
    let nonce = this.tredNonce + 1;

    let types: SOL_TYPE[] = ['address', 'bytes32', 'uint256', 'uint256', 'bytes'];
    let data = [this.pnAddress, this.channelId, tredAmount, nonce];

    let hash = solidityKeccak256(types, data);

    let signature = await L2.getInstance().getProvider().getSigner().signMessage(hash);

    let msg = {
      contractAddress: this.pnAddress,
      channelIdentifier: this.channelId,
      balance: tredAmount.toString(),
      nonce,
      additionalHash: '',
      signature
    };

    // send to CP with socket

    // save transfer to db

    new Transfer(
      this.channelId,
      this.pnAddress,
      tredAmount.toString(),
      amount,
      nonce,
      '',
      L2.getInstance().getUserAddress(),
      pn.cp,
      signature
    ).save();

  }

  /**
   * add deposit to channel
   * @param amount depostit amount
   */
  async addDeposit(amount: string) {

    let web3Signer = L2.getInstance().getProvider().getSigner();
    let contractSigner = contract.connect(web3Signer);
    let participant = L2.getInstance().getUserAddress();
    let value = new BigNumber(amount);

    let tx = await contractSigner.setTotalDeposit(participant, { value });
    console.log('deposit tx: ', tx.hash);

    return tx;
  }


  /**
   * withdraw from payment network
   * @param amount withdraw amount
   * @param receiver withdraw to this address, default to user's default address
   */
  async performWithdraw(amount: string, receiver: string = L2.getInstance().getUserAddress()) {

    let provider = L2.getInstance().getProvider();
    let web3Signer = provider.getSigner();
    let contractSigner = contract.connect(web3Signer);

    // step 1, build a withdraw request message and sign it with puppet
    let contractAddress = pn.address;
    let channelIdentifier = this.channelId;
    let withdraw = new BigNumber(amount);
    let lastCommitBlock = MESSAGE_COMMIT_BLOCK_EXPERITION + await provider.getBlockNumber();

    let types: SOL_TYPE[] = ['address', 'bytes32', 'uint256', 'bytes'];
    let data = [contractAddress, channelIdentifier, withdraw, lastCommitBlock];
    let withdrawRequestHash = solidityKeccak256(types, data);

    let puppet = await db.puppet.where('address').equals(this.puppet).first();
    let signatureUser = await puppet.signMessage(withdrawRequestHash);
    let userWithdrawRequest = {
      contractAddress,
      channelIdentifier,
      withdraw,
      lastCommitBlock,
      signatureUser
    };


    // TODO step 2, socket the userWithdrawRequest to CP and wait for response
    let res = { signatureCP: '', signatureL2: '' };

    // step 3, build withdraw transaction based on response and submit to blockchain
    let tx = await contractSigner.participantWithdraw(
      contractAddress,
      lastCommitBlock,
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

    let web3Signer = L2.getInstance().getProvider().getSigner();
    let contractSigner = contract.connect(web3Signer);
    let participant = L2.getInstance().getUserAddress();
    let puppet = this.puppet;
    let settleWindow = 10;
    let value = new BigNumber(amount);

    let tx = await contractSigner.setTotalDeposit({ participant, puppet, settleWindow }, { value });
    console.log('open channel tx: ', tx.hash);

    return tx;
  }


  async coClose() {

    let provider = L2.getInstance().getProvider();
    let web3Signer = provider.getSigner();
    let contractSigner = contract.connect(web3Signer);

    // step 1, build a withdraw request message and sign it with puppet
    let contractAddress = pn.address;
    let channelIdentifier = this.channelId;
    let balance = new BigNumber(this.balance);
    let lastCommitBlock = MESSAGE_COMMIT_BLOCK_EXPERITION + await provider.getBlockNumber();

    let types: SOL_TYPE[] = ['address', 'bytes32', 'uint256', 'bytes'];
    let data = [contractAddress, channelIdentifier, balance, lastCommitBlock];

    let coCloseRequestHash = solidityKeccak256(types, data);

    let puppet = await db.puppet.where('address').equals(this.puppet).first();
    let signatureUser = await puppet.signMessage(coCloseRequestHash);
    let coCloseRequest = {
      contractAddress,
      channelIdentifier,
      balance,
      lastCommitBlock,
      signatureUser
    };


    // TODO step 2, socket the coCloseRequest to CP and wait for response
    let res = { signatureCP: '', signatureL2: '' };

    // step 3, build co-close transaction based on response and submit to blockchain
    let tx = await contractSigner.cooperativeSettle(
      L2.getInstance().getUserAddress(),
      balance,
      lastCommitBlock,
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

    let provider = L2.getInstance().getProvider();

    let contractAddress = this.pnAddress;
    let channelIdentifier = this.channelId;
    let lastCommitBlock = MESSAGE_COMMIT_BLOCK_EXPERITION + await provider.getBlockNumber();

    let types: SOL_TYPE[] = ['address', 'bytes32', 'address', 'uint256'];
    let data = [contractAddress, channelIdentifier, newPuppet.address, lastCommitBlock];
    let userSignatureData = solidityKeccak256(types, data);

    let signatureUser = await L2.getInstance().getProvider().getSigner().signMessage(userSignatureData);
    let signatureCP = '';

    let NewPuppet = {
      contractAddress,
      channelIdentifier,
      newPuppet: newPuppet.address,
      lastCommitBlock,
      signatureUser,
      signatureCP,
    };

    let rebOut = await db.rebalance.where('type').equals(REBALANCE_TYPE.OUT).last();
    let outAmount = rebOut.amount;
    let outNonce = rebOut.nonce;

    types = ['address', 'bytes32', 'uint256', 'bytes'];
    data = [contractAddress, channelIdentifier, outAmount, outNonce];
    userSignatureData = solidityKeccak256(types, data);
    signatureUser = await newPuppet.signMessage(userSignatureData);
    signatureCP = rebOut.signCP;

    let RebalanceOut = {
      contractAddress,
      channelIdentifier,
      outAmount: rebOut.amount,
      outNonce: rebOut.nonce,
      signatureCP,
      signatureUser,
    }


    let NewPuppetRequest = { NewPuppet, RebalanceOut };

    //  send NewPuppetRequest to CP
  }


  async forceClose() {

    let provider = L2.getInstance().getProvider();
    let web3Signer = provider.getSigner();
    let contractSigner = contract.connect(web3Signer);

    let participant = L2.getInstance().getUserAddress();
    let balance = this.cpTredAmount;
    let nonce = this.cpTredNonce;
    let { additionalHash, sign: partnerSignature } = await db.transfer.filter(t => t.nonce === nonce && t.from === pn.cp).first();
    let inAmount = this.rebinAmount;
    let inNonce = this.rebinNonce;
    let { signL2: regulatorSignature, signCP: inProviderSignature } = await db.rebalance.filter(r => r.type === REBALANCE_TYPE.IN && r.nonce === inNonce).first();
    let outAmount = this.reboutAmount;
    let outNonce = this.reboutNonce;
    let { signUser: participantSignature, signCP: outProviderSignature } = await db.rebalance.filter(r => r.type === REBALANCE_TYPE.OUT && r.nonce === outNonce).first();


    let tx = await contractSigner.closeChannel(
      participant,
      balance,
      nonce,
      additionalHash,
      partnerSignature,
      inAmount,
      inNonce,
      regulatorSignature,
      inProviderSignature,
      outAmount,
      outNonce,
      participantSignature,
      outProviderSignature
    );

    console.log('force close tx: ', tx.hash);

    return tx;
  }

}

export enum CHANNEL_KEYS {
  status,
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
  isCloser, // newest version is different
}

export enum CHANNEL_STATUS {
  CHANNEL_STATUS_INIT = 1,
  CHANNEL_STATUS_PENDINGOPEN,
  CHANNEL_STATUS_OPEN,
  CHANNEL_STATUS_PENDING_UPDATE_PUPPET,
  CHANNEL_STATUS_PENDING_SETTLE,
  CHANNEL_STATUS_CLOSE,
  CHANNEL_STATUS_PARTNER_UPDATE_PROOF,
  CHANNEL_STATUS_REGULATOR_UPDATE_PROOF
}
