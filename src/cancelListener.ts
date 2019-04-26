import { delay, sendAppTx, logger } from './utils/common';
import { web3_10, user, appPN, appOperator } from './main';
import { ethMethods } from './service/cita';
import { CHANNEL_STATUS } from './utils/constants';

export type SettleRequest = {
  channelID: string;
  lastCommitBlock: number;
};

export default class CancelListener {
  private enabled: boolean;
  private settleList: Array<SettleRequest>;
  private key =
    'CancelListenerStore_' + web3_10.utils.sha3(user + appPN.options.address);

  public constructor() {
    this.load();
  }

  load() {
    let txListStr = localStorage.getItem(this.key);
    if (!!txListStr) {
      this.settleList = JSON.parse(localStorage.getItem(this.key));
    } else {
      this.settleList = new Array<SettleRequest>();
    }
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.settleList));
  }

  add(info: SettleRequest) {
    if (!this.settleList.map(item => item.channelID).includes(info.channelID)) {
      this.settleList.push(info);
    }
    this.save();
  }

  contains(channelID: string) {
    if (this.settleList.map(item => item.channelID).includes(channelID)) {
      return true;
    }
    return false;
  }

  remove(channelID: string) {
    this.settleList.forEach((item, index) => {
      if (item.channelID === channelID) this.settleList.splice(index, 1);
    });
    this.save();
  }

  async start() {
    while (true) {
      // get block number from appOperator
      try {
        let currentBlockNumber = await appOperator.methods
          .ethBlockNumber()
          .call();

        for (let settle of this.settleList) {
          let { channelID, lastCommitBlock } = settle;

          logger.info('cancel listner', currentBlockNumber, lastCommitBlock);
          if (currentBlockNumber > lastCommitBlock) {
            try {
              let { status } = await appPN.methods.channelMap(channelID);
              if (status === CHANNEL_STATUS.CHANNEL_STATUS_SETTLE) {
                this.remove(channelID);
                continue;
              }

              await sendAppTx(appPN.methods.unlockCooperativeSettle(channelID));
              this.remove(channelID);
            } catch (err) {
              logger.error('unlockCooperativeSettle failed', channelID);
            }
          }
        }

        if (this.enabled === false) {
          return;
        }
        await delay(3000);
      } catch (err) {
        logger.error('cancelListener error', err);
      }
    }
  }

  stop() {
    this.enabled = false;
  }
}
