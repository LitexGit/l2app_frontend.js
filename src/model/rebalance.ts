import { db, PN } from './internal'

export class Rebalance {

  id: number;

  channelId: string;
  pnAddress: string;

  amount: string;
  deltaAmount: string;
  type: number;
  nonce: number;

  signCP: string;
  signL2: string;
  signUser: string;

  createdAt: number;
  updatedAt: number;

  constructor (
    channelId: string,
    pnAddress: string,
    amount: string,
    deltaAmount: string,
    type: REBALANCE_TYPE,
    nonce: number,
    id?: number,
    signCP?: string,
    signL2?: string,
    signUser?: string,
    createdAt?: number,
    updatedAt?: number,
  ) {
    this.channelId = channelId;
    this.pnAddress = pnAddress;
    this.amount = amount;
    this.deltaAmount = deltaAmount;
    this.type = type;
    this.nonce = nonce;

    if (id) this.id = id;
    if (signCP) this.signCP = signCP;
    if (signL2) this.signL2 = signL2;
    if (signUser) this.signUser = signUser;
    if (this.updatedAt) this.updatedAt = updatedAt;
    if (this.createdAt) {
      this.createdAt = createdAt;
    } else {
      this.createdAt = new Date().getTime();
      db.rebalance.put(this)
        .then(() => console.log('new Rebalance entry created at: ', this.createdAt));
    }
  }
}

export enum REBALANCE_TYPE { IN = 1, OUT};