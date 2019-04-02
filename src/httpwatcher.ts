import { Contract } from 'web3/node_modules/web3-eth-contract';
import { delay } from './utils/common';

/**
 * because appchain can not suppport event subscription.
 * httpWatcher using http way to poll new event from blockchain, instead of websocket subscription
 */
export default class HttpWatcher {
  private enabled: boolean;
  private base: any;
  private blockInterval: number;
  private watchList: any;

  /**
   * constructor of HttpWatcher
   *
   * @param base  web3.eth/cita.base
   * @param blockInterval the interval time to poll event
   * @param watchList the contract and setting list to watch
   */
  constructor(base: any, blockInterval: number, watchList: any) {
    this.base = base;
    this.blockInterval = blockInterval;
    this.watchList = watchList;
    this.enabled = true;
  }

  /**
   * search a specified event of contract from blockchain, and handle it
   *
   * @param fromBlockNumber start blockNumber
   * @param toBlockNumber end blockNumber
   * @param contract contract instance
   * @param eventName event name
   * @param eventSetting event setting, include filter and handler
   */
  async processEvent(
    fromBlockNumber: number,
    toBlockNumber: number,
    contract: Contract,
    eventName: string,
    eventSetting: any
  ) {
    let events = await contract.getPastEvents(eventName, {
      filter: eventSetting.filter(),
      fromBlock: fromBlockNumber,
      toBlock: toBlockNumber,
    });

    for (let event of events) {
      await eventSetting.handler(event);
    }
  }

  /**
   * watch all event of a contract, and handle them
   *
   * @param fromBlockNumber start blockNumber
   * @param toBlockNumber end blockNumber
   * @param watchItem watch event list and settings
   */
  async processAllEvent(
    fromBlockNumber: number,
    toBlockNumber: number,
    watchItem: any
  ) {
    let events = await watchItem.contract.getPastEvents('allEvents', {
      filter: {},
      fromBlock: fromBlockNumber,
      toBlock: toBlockNumber,
    });

    for (let event of events) {
      let { event: eventName, returnValues } = event;

      if (watchItem.listener[eventName]) {
        let filter = watchItem.listener[eventName].filter();
        let filterResult = true;
        for (let k in filter) {
          if (
            !returnValues[k] ||
            returnValues[k].toLowerCase() !== filter[k].toLowerCase()
          ) {
            filterResult = false;
            break;
          }
        }

        if (filterResult) {
          watchItem.listener[eventName].handler(event);
        }
      }
    }
  }

  /**
   * start httpwatcher to watch blockchain
   *
   * @param lastBlockNumber start block number
   */
  async start(lastBlockNumber: number = 0) {
    let currentBlockNumber = await this.base.getBlockNumber();
    lastBlockNumber = lastBlockNumber || currentBlockNumber - 1;

    console.log('start syncing process', lastBlockNumber, currentBlockNumber);
    while (lastBlockNumber <= currentBlockNumber) {
      for (let watchItem of this.watchList) {
        await this.processAllEvent(
          lastBlockNumber,
          currentBlockNumber,
          watchItem
        );
        if (this.enabled === false) {
          return;
        }
      }

      lastBlockNumber = currentBlockNumber + 1;
      currentBlockNumber = await this.base.getBlockNumber();
    }

    // finish sync process;
    console.log('finish syncing process', currentBlockNumber);

    while (true) {
      await delay(this.blockInterval);

      try {
        lastBlockNumber = currentBlockNumber + 1;
        currentBlockNumber = await this.base.getBlockNumber();

        if (lastBlockNumber > currentBlockNumber) {
          continue;
        }

        for (let watchItem of this.watchList) {
          await this.processAllEvent(
            lastBlockNumber,
            currentBlockNumber,
            watchItem
          );

          if (this.enabled === false) {
            return;
          }
        }
        // console.log('currentBlockNumber', currentBlockNumber);
      } catch (err) {
        console.error('watch error:', err);
        // this.base.setProvider('ws://wallet.milewan.com:4337');
        // alert 机制
      }
    }
  }

  /**
   * stop http watcher
   */
  async stop() {
    this.enabled = false;
  }
}
