import { delay, sendAppTx, logger } from './utils/common';
import { user, appPN, appOperator, callbacks } from './main';
import { CHANNEL_STATUS, WITHDRAW_UNLOCKED_EVENT } from './utils/constants';
import { sha3 } from 'web3/node_modules/web3-utils';

export type SettleRequest = {
  channelID: string;
  balance: string;
  lastCommitBlock: number;
};

export default class CancelListener {
  private enabled: boolean;
  private settleList: Array<SettleRequest>;
  private key = 'CancelListenerStore_' + sha3(user + appPN.options.address);

  public constructor() {
    // this.load();
  }

  async load() {
    let txListStr = await localStorage.getItem(this.key);
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
          let { channelID, balance, lastCommitBlock } = settle;

          logger.info('cancel listner', currentBlockNumber, lastCommitBlock);
          if (currentBlockNumber > lastCommitBlock) {
            try {
              let { user, token, status } = await appPN.methods
                .channelMap(channelID)
                .call();
              if (status === CHANNEL_STATUS.CHANNEL_STATUS_SETTLE) {
                this.remove(channelID);
                continue;
              }

              await sendAppTx(
                appPN.methods.unlockCooperativeSettle(channelID),
                'appPN.methods.unlockCooperativeSettle'
              );
              this.remove(channelID);

              let withdrawUnlockedEvent: WITHDRAW_UNLOCKED_EVENT = {
                user,
                type: 2,
                token,
                amount: balance,
              };

              callbacks.get('WithdrawUnlocked') &&
                callbacks.get('WithdrawUnlocked')(null, withdrawUnlockedEvent);
            } catch (err) {
              logger.error('unlockCooperativeSettle failed', channelID);
            }
          }
        }

        if (this.enabled === false) {
          return;
        }
        await delay(15000);
      } catch (err) {
        logger.error('cancelListener error', err);
      }
    }
  }

  stop() {
    this.enabled = false;
  }
}
