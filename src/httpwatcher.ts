import { Contract } from 'web3/node_modules/web3-eth-contract';

export default class HttpWatcher {

    private base: any;
    private blockInterval: number;
    private contract: Contract;
    private eventHandlerList: any;
    private enabled: boolean;


    constructor(base: any, blockInterval: number, contract: Contract, eventHandlerList: any) {
      this.contract = contract;
      this.base = base;
      this.blockInterval = blockInterval;
      this.eventHandlerList = eventHandlerList;
      this.enabled = true;
    }
  
    async delay(duration: number){
        return new Promise((resolve) => setTimeout(resolve, duration));
    }
  
  
    async processEvent(fromBlockNumber: number, toBlockNumber: number, eventName: string, eventSetting: any) {

        // console.log(this.contract);

        //   console.log('eventName is ', eventName, eventSetting.filter());

        let events = await this.contract.getPastEvents(eventName, {
            filter: eventSetting.filter(),
            fromBlock: fromBlockNumber,
            toBlock: toBlockNumber
        });

        for (let event of events) {
            await eventSetting.handler(event);
            // process event
            console.log('eventName is ', eventName, eventSetting.filter());
            console.log("event", event.transactionHash);
        }
        //   console.log("get events ", events.length);
    }
  
    async start(lastBlockNumber: number = 0) {
        let currentBlockNumber = await this.base.getBlockNumber();
        lastBlockNumber = lastBlockNumber || currentBlockNumber - 10;
  
        console.log("start syncing process", lastBlockNumber, currentBlockNumber);
        while (lastBlockNumber <= currentBlockNumber) {
            for (let eventName in this.eventHandlerList) {
                await this.processEvent(
                    lastBlockNumber,
                    currentBlockNumber,
                    eventName,
                    this.eventHandlerList[eventName]
                );
            }

            lastBlockNumber = currentBlockNumber+1;
            currentBlockNumber = await this.base.getBlockNumber();

            if(this.enabled == false) {
                return;
            }
        }

        // finish sync process;
        console.log("finish syncing process", currentBlockNumber);

        while (true) {

            await this.delay(this.blockInterval);

            lastBlockNumber = currentBlockNumber + 1;
            currentBlockNumber = await this.base.getBlockNumber();
            console.log("watching event", lastBlockNumber, currentBlockNumber);
            if (lastBlockNumber > currentBlockNumber) {
                continue;
            }

            for (let eventName in this.eventHandlerList) {
                await this.processEvent(
                    lastBlockNumber,
                    currentBlockNumber,
                    eventName,
                    this.eventHandlerList[eventName]
                );
            }

            if(this.enabled == false) {
                return;
            }
        }
    }

    async stop(){
        this.enabled = false;
    }
}
  
