import { Contract } from "web3/node_modules/web3-eth-contract";

export default class HttpWatcher {
  private enabled: boolean;

  private base: any;
  private blockInterval: number;
  private contract: Contract;
  private watchList: any;

  constructor(base: any, blockInterval: number, watchList: any) {
    //   this.contract = contract;
    this.base = base;
    this.blockInterval = blockInterval;
    this.watchList = watchList;

    this.enabled = true;
  }

  async delay(duration: number) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  async processEvent(
    fromBlockNumber: number,
    toBlockNumber: number,
    contract: Contract,
    eventName: string,
    eventSetting: any
  ) {
    // console.log(this.contract);

    //   console.log('eventName is ', eventName, eventSetting.filter());

    let events = await contract.getPastEvents(eventName, {
      filter: eventSetting.filter(),
      fromBlock: fromBlockNumber,
      toBlock: toBlockNumber
    });

    for (let event of events) {
      await eventSetting.handler(event);
      // process event
      console.log("eventName is ", eventName, eventSetting.filter());
      console.log("event", event.transactionHash);
    }
    //   console.log("get events ", events.length);
  }

  async start(lastBlockNumber: number = 0) {
    let currentBlockNumber = await this.base.getBlockNumber();
    lastBlockNumber = lastBlockNumber || currentBlockNumber - 10;

    console.log("start syncing process", lastBlockNumber, currentBlockNumber);
    while (lastBlockNumber <= currentBlockNumber) {
      console.log("watchList", this.watchList);
      for (let watchItem of this.watchList) {
        for (let eventName in watchItem.listener) {
          await this.processEvent(
            lastBlockNumber,
            currentBlockNumber,
            watchItem.contract,
            eventName,
            watchItem.listener[eventName]
          );
        }

        if (this.enabled === false) {
          return;
        }
      }

      lastBlockNumber = currentBlockNumber + 1;
      currentBlockNumber = await this.base.getBlockNumber();
    }

    // finish sync process;
    console.log("finish syncing process", currentBlockNumber);

    while (true) {
      await this.delay(this.blockInterval);

      try {
        lastBlockNumber = currentBlockNumber + 1;
        currentBlockNumber = await this.base.getBlockNumber();
        console.log("watching event", lastBlockNumber, currentBlockNumber);
        if (lastBlockNumber > currentBlockNumber) {
          continue;
        }

        for (let watchItem of this.watchList) {
          for (let eventName in watchItem.listener) {
            await this.processEvent(
              lastBlockNumber,
              currentBlockNumber,
              watchItem.contract,
              eventName,
              watchItem.listener[eventName]
            );
          }

          if (this.enabled === false) {
            return;
          }
        }
      } catch (err) {
        console.error("watch error:", err);
      }
  }  
}

  async stop() {
    this.enabled = false;
  }
}
