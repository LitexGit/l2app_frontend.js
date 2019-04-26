import { logger, delay, getERC20Allowance } from './utils/common';
import {
  CHANNEL_STATUS,
  CITA_TX_BLOCK_INTERVAL,
  APPROVAL_STATUS,
  ADDRESS_ZERO,
  APPROVE_EVENT,
} from './utils/constants';
import { appPN, user, web3_10, ethPN, ERC20, callbacks } from './main';

export enum TX_TYPE {
  CHANNEL_OPEN = 1,
  CHANNEL_DEPOSIT,
  CHANNEL_WITHDRAW,
  CHANNEL_CO_SETTLE,
  CHANNEL_FORCE_WITHDRAW,
  TOKEN_APPROVE,
}

export type TXINFO = {
  txHash: string;
  type: TX_TYPE;
  user: string;
  channelID: string;
  token: string;
  amount: string;
  time: number;
};

export default class EthPendingTxStore {
  private enabled: boolean;
  private txList: Array<TXINFO>;
  private key =
    'ETHPendingStore_' + web3_10.utils.sha3(user + appPN.options.address);

  public constructor() {
    // this.txList = new Array<TXINFO>();
    this.load();
  }

  load() {
    let txListStr = localStorage.getItem(this.key);
    if (!!txListStr) {
      this.txList = JSON.parse(localStorage.getItem(this.key));
    } else {
      this.txList = new Array<TXINFO>();
    }
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.txList));
  }

  setTokenAllowance(token: string, allowance: string) {
    if (token === ADDRESS_ZERO) {
      return;
    }
    let key = 'Allowance_' + web3_10.utils.sha3(user + '_' + token);
    localStorage.setItem(key, allowance);
  }

  getTokenAllowance(token: string): number {
    if (token === ADDRESS_ZERO) {
      return 0;
    }

    let key = 'Allowance_' + web3_10.utils.sha3(user + '_' + token);
    let allowance = localStorage.getItem(key);
    if (!allowance) {
      return 0;
    }
    return Number(allowance);
  }

  addTx(info: TXINFO) {
    if (!this.txList.map(item => item.txHash).includes(info.txHash)) {
      this.txList.push(info);
    }
    this.save();
  }

  removeTx(txHash: string) {
    this.txList.forEach((item, index) => {
      if (item.txHash === txHash) this.txList.splice(index, 1);
    });
    this.save();
  }

  async getApproveEventFromLogs(logs) {
    console.log('ERC20.options', ERC20.options);
    let inputs = ERC20.options.jsonInterface.filter(
      item => item.name === 'Approval' && item.type === 'event'
    )[0].inputs;
    console.log('inputs', inputs);
    console.log('logs[0]', logs[0]);
    let event = web3_10.eth.abi.decodeLog(
      inputs,
      logs[0].data,
      logs[0].topics.slice(1)
    );
    console.log(event);
    let { owner: user, spender: contractAddress, value: amount } = event;
    return { user, contractAddress, amount };
  }

  async startWatch(web3: any) {
    while (true) {
      for (let tx of this.txList) {
        let { txHash, type, token } = tx;
        try {
          let { status: txStatus, logs } = await web3.eth.getTransactionReceipt(
            txHash
          );
          logger.info('txHash status', txHash, txStatus);

          if (txStatus === true || txStatus === false) {
            console.log('tx is', tx);
            this.removeTx(txHash);
            if (type === TX_TYPE.TOKEN_APPROVE) {
              if (txStatus) {
                try {
                  let { user, amount } = await this.getApproveEventFromLogs(
                    logs
                  );
                  let approveEvent: APPROVE_EVENT = {
                    user,
                    amount,
                    token: tx.token,
                    txhash: txHash,
                    type: !!tx.channelID ? 1 : 0,
                  };
                  // console.log('approveEvent', approveEvent);
                  callbacks.get('TokenApproval') &&
                    callbacks.get('TokenApproval')(null, approveEvent);
                } catch (err) {
                  logger.error('emit TokenApproval event fail', err);
                }

                this.setTokenAllowance(token, '1');
              }
            }
            if (
              type === TX_TYPE.CHANNEL_OPEN ||
              type === TX_TYPE.CHANNEL_DEPOSIT
            ) {
              this.setTokenAllowance(token, '0');
            }
          }
        } catch (err) {
          logger.info('unknow transaction', txHash);
        }
      }

      if (this.enabled === false) {
        return;
      }
      console.log('ethPendingTxStore watching');
      await delay(3000);
    }
  }

  getPendingTxByChannelID(channelID: string) {
    logger.info('getPendingTxByChannelID', channelID, this.txList);
    let relatedTxs = this.txList
      .filter(item => item.channelID === channelID)
      .sort((a, b) => a.time - b.time);
    logger.info('relatedTxs', relatedTxs);
    if (relatedTxs.length >= 1) {
      return relatedTxs[0];
    }
    return false;
  }

  getPendingTxByUser(user: string, token: string) {
    let relatedTxs = this.txList
      .filter(item => item.user === user && item.token === token)
      .sort((a, b) => a.time - b.time);

    if (relatedTxs.length >= 1) {
      return relatedTxs[0];
    }
    return false;
  }

  async getChannelStatus(
    channelID: string,
    appStatus: CHANNEL_STATUS,
    user: string,
    token: string
  ) {
    let channelStatus = appStatus;
    switch (appStatus) {
      case CHANNEL_STATUS.CHANNEL_STATUS_INIT:
        channelStatus = await this.getInitSubStatus(user, token);
        break;
      case CHANNEL_STATUS.CHANNEL_STATUS_OPEN:
        channelStatus = await this.getOpenSubStatus(channelID, user, token);
        break;
      case CHANNEL_STATUS.CHANNEL_STATUS_APP_CO_SETTLE:
        // CHANNEL_STATUS_PENDING_ETH_CO_SETTLE,
        let tx = this.getPendingTxByChannelID(channelID);
        if (tx && tx.type === TX_TYPE.CHANNEL_CO_SETTLE) {
          channelStatus = CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_CO_SETTLE;
        }
        break;
      case CHANNEL_STATUS.CHANNEL_STATUS_CLOSE:
      case CHANNEL_STATUS.CHANNEL_STATUS_SETTLE:
        break;
    }

    logger.info('Channel status is ', appStatus);
    return channelStatus;
  }

  async getInitSubStatus(user, token) {
    // CHANNEL_STATUS_PENDING_ERC20_APPROVAL
    // CHANNEL_STATUS_ERC20_APPROVED
    // CHANNEL_STATUS_PENDING_ETH_OPEN
    let channelStatus = CHANNEL_STATUS.CHANNEL_STATUS_INIT;
    let tx = this.getPendingTxByUser(user, token);
    console.log('tx is', tx);

    if (!tx) {
      // check ERC20 allowance, if > 0
      if (token !== ADDRESS_ZERO) {
        let allowance = this.getTokenAllowance(token);
        console.log('allowance is', allowance);

        if (allowance > 0) {
          return CHANNEL_STATUS.CHANNEL_STATUS_ERC20_APPROVED;
        }
      }

      return channelStatus;
    }

    if (tx.type === TX_TYPE.CHANNEL_OPEN) {
      channelStatus = CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_OPEN;
    }

    if (tx.type === TX_TYPE.TOKEN_APPROVE) {
      channelStatus = CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ERC20_APPROVAL;
    }

    return channelStatus;
  }

  async getOpenSubStatus(channelID: string, user: string, token: string) {
    // CHANNEL_STATUS_PENDING_ERC20_APPROVAL
    // CHANNEL_STATUS_ERC20_APPROVED
    // CHANNEL_STATUS_PENDING_ETH_DEPOSIT
    // CHANNEL_STATUS_PENDING_ETH_WITHDRAW,

    // CHANNEL_STATUS_PENDING_APP_WITHDRAW,
    // CHANNEL_STATUS_PENDING_APP_CO_SETTLE,

    let tx = this.getPendingTxByChannelID(channelID);
    console.log('tx is', tx);
    if (tx) {
      if (tx.type === TX_TYPE.CHANNEL_DEPOSIT) {
        return CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_DEPOSIT;
      }

      if (tx.type === TX_TYPE.CHANNEL_WITHDRAW) {
        return CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_WITHDRAW;
      }

      if (tx.type === TX_TYPE.TOKEN_APPROVE) {
        return CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ERC20_APPROVAL;
      }
    } else {
      // CHANNEL_STATUS_PENDING_APP_WITHDRAW,
      // CHANNEL_STATUS_PENDING_APP_CO_SETTLE,

      if (token !== ADDRESS_ZERO) {
        let allowance = this.getTokenAllowance(token);
        console.log('allowance is', allowance);

        if (allowance > 0) {
          return CHANNEL_STATUS.CHANNEL_STATUS_ERC20_APPROVED;
        }
      }

      let {
        isConfirmed,
        lastCommitBlock,
      } = await appPN.methods.cooperativeSettleProofMap(channelID).call();

      if (!isConfirmed && Number(lastCommitBlock) > 0) {
        return CHANNEL_STATUS.CHANNEL_STATUS_PENDING_APP_CO_SETTLE;
      }
    }

    return CHANNEL_STATUS.CHANNEL_STATUS_OPEN;
  }

  async stopWatch() {
    this.enabled = false;
  }
}
