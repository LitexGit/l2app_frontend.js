import {
  ADDRESS_ZERO,
  SESSION_STATUS,
  CHANNEL_STATUS,
} from './utils/constants';
import {
  appSession,
  appPN,
  ethPN,
  web3_10,
  user,
  puppet,
  web3_outer,
  cp,
} from './main';
import {
  myEcsignToHex,
  prepareSignatureForTransfer,
  sendAppTx,
} from './utils/common';
import * as rlp from 'rlp';

/**
 * Session manager
 */
export default class L2Session {
  /**-----------------Public Attributes------------------------ */
  sessionID: string;
  status: SESSION_STATUS;
  //   players: Array<string>;
  game: string;
  data: string;
  provider: string;

  callbacks: Map<string, (err: Error, res: any) => void>;

  /**-----------------Static Attributes & APIs------------------------ */
  static sessionList: Map<string, L2Session> = new Map<string, L2Session>();

  /**
   * get session by session id
   *
   * @param {} _sessionID
   * @param {} fromChain  OPTIONAL load session from cita chain. default: true
   *
   * @returns {Promise<L2Session}
   */
  static async getSessionById(
    _sessionID: string,
    fromChain: boolean = true
  ): Promise<L2Session> {
    let session = L2Session.sessionList.get(_sessionID);
    if (!session) {
      let sessionExist = await L2Session.isExists(_sessionID);
      if (!sessionExist) {
        return null;
      }

      session = new L2Session(_sessionID);
      await session.initialize();
      L2Session.sessionList.set(_sessionID, session);
    }
    return session;
  }

  /**
   * check session is initialized on appchain
   *
   * @param {string} _sessionID
   *
   * @returns {Promise<boolean>}
   */
  static async isExists(_sessionID: string): Promise<boolean> {
    let session = await appSession.methods.sessions(_sessionID).call();
    if (Number(session.status) === SESSION_STATUS.SESSION_STATUS_INIT) {
      return false;
    }

    return true;
  }

  /**
   * get all messages of the session
   *
   * @param {string} _sessionID
   *
   * @returns {Promise<Array<any>>}
   */
  static async getMessagesBySessionID(_sessionID: string): Promise<Array<any>> {
    let messages = await appSession.methods.exportSession(_sessionID).call();
    return messages;
  }

  /**
   * get all players join in the session
   *
   * @param {string} _sessionID
   *
   * @returns {Promise<Array<string>>}
   */
  static async getPlayersBySessionID(
    _sessionID: string
  ): Promise<Array<string>> {
    let players = await appSession.methods.exportPlayer(_sessionID).call();
    return players;
  }

  /**-----------------Private Constructor------------------------ */

  /**
   * constructor of L2Session
   *
   * @param {string} _sessionID
   * @param {Contract} _sessionContract
   */
  private constructor(_sessionID: string) {
    this.sessionID = _sessionID;
  }

  /**
   * initialize L2Session, using session from appchain contract
   */
  private async initialize() {
    // query session by _sessionPN
    let {
      status,
      provider,
      game,
      paymentContract,
      data,
    } = await appSession.methods.sessions(this.sessionID).call();
    this.status = Number(status);
    this.game = game;
    this.data = web3_10.utils.hexToUtf8(data);
    this.provider = provider;

    this.callbacks = this.callbacks || new Map<string, () => void>();
  }

  /**-----------------Session APIs------------------------ */

  /**
   * send message to the session contract
   *
   * @param {string} to the destination of the message
   * @param {number} type the type of message encoding
   * @param {string} content encoded message content
   * @param {string | number} amount token amount transferred to other player
   * @param {string} token token address, default: '0x0000000000000000000000000000000000000000'
   *
   * @returns {Promise<string>} the tx hash of the sendMessage transaction
   */
  async sendMessage(
    to: string,
    type: number,
    content: string,
    amount: string | number = '0',
    token: string = ADDRESS_ZERO
  ): Promise<string> {
    console.log(
      'sendMessage start execute with params: to: [%s], type: [%s], content: [%s], amount: [%s], token: [%s]',
      to,
      type,
      content,
      amount + '',
      token
    );

    // TODO check params valid

    // check session status

    // let { status } = await appSession.methods.sessions(this.sessionID).call();
    // if (Number(status) !== SESSION_STATUS.SESSION_STATUS_OPEN) {
    //   throw new Error('session is not open');
    // }

    // build session message
    let from = user;
    let messageHash = web3_10.utils.soliditySha3(
      { t: 'address', v: from },
      { t: 'address', v: to },
      { t: 'bytes32', v: this.sessionID },
      { t: 'uint8', v: type },
      { t: 'bytes', v: content }
    );
    let signature = myEcsignToHex(
      web3_10,
      messageHash,
      puppet.getAccount().privateKey
    );

    let paymentData = await this.buildTransferData(
      from,
      web3_10.utils.toBN(amount).toString(),
      token,
      messageHash
    );
    // call appSession's sendMessage
    return await sendAppTx(
      appSession.methods.sendMessage(
        from,
        to,
        this.sessionID,
        type,
        content,
        signature,
        paymentData
      )
    );
  }

  /**
   *
   * @param callback
   *
   */
  async onMessage(callback: (error: Error, res: any) => void) {
    this.callbacks.set('message', callback);
  }

  /**
   *
   * @param callback
   */
  async onSessionClose(callback: (error: Error, res: any) => void) {
    this.callbacks.set('close', callback);
  }

  private async buildTransferData(
    from: string,
    amount: string,
    token: string,
    messageHash: string
  ): Promise<any> {
    console.log(
      'start buildTransferData with params: from[%s], amount[%s], token[%s], messageHash[%s]',
      from,
      amount,
      token,
      messageHash
    );
    let { bytesToHex, toHex, soliditySha3, toBN } = web3_10.utils;
    let channelID =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    let balance = '0';
    let nonce = '0';
    let additionalHash =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    let paymentSignature = '0x0';
    if (Number(amount) > 0) {
      console.log('start get channelID');
      channelID = await ethPN.methods.getChannelID(from, token).call();
      console.log('start get channel status');
      // let channel = await appPN.methods.channelMap(channelID).call();

      // // check channel status
      // if (Number(channel.status) !== CHANNEL_STATUS.CHANNEL_STATUS_OPEN) {
      //   throw new Error('app channel status is not open, can not transfer now');
      // }
      // // check user's balance is enough
      // if (toBN(channel.userBalance).lt(toBN(amount))) {
      //   throw new Error("user's balance is less than transfer amount");
      // }

      // build transfer message
      // get balance proof from eth contract
      console.log('start get channel balanceProof');
      let balanceProof = await appPN.methods
        .balanceProofMap(channelID, cp)
        .call();

      balance = toBN(amount)
        .add(toBN(balanceProof.balance))
        .toString();
      nonce = toBN(balanceProof.nonce)
        .add(toBN(1))
        .toString();
      additionalHash = soliditySha3(
        { t: 'bytes32', v: messageHash },
        { t: 'uint256', v: amount }
      );
      paymentSignature = await prepareSignatureForTransfer(
        web3_outer,
        ethPN.options.address,
        channelID,
        balance,
        nonce,
        additionalHash,
        user
      );
    }

    let paymentData = [
      channelID,
      toHex(balance),
      toHex(nonce),
      toHex(amount),
      additionalHash,
      paymentSignature,
    ];
    console.log('paymentData: ', paymentData);
    // rlpencode is encoded data
    let rlpencode = '0x' + rlp.encode(paymentData).toString('hex');

    console.log('rlpencode is', rlpencode);

    return rlpencode;
  }
}
