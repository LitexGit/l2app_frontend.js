/**
 * model class of puppet update records
 */

import { db } from './internal'

export class UserWithdraw {

  id: number;

  channelId: string;
  pnAddress: string;
  user: string;

  balance: string;
  lastCommitBlock: number;
  status: WITHDRAW_STATUS;

  signCP: string; // hex formt
  signL2: string; // hex formt
  signUser: string; // hex formt

  createdAt: number;
  updatedAt: number;

  constructor(

    pnAddress: string,
    channelId: string,
    user: string,

    balance: string,
    lastCommitBlock: number,
    status: WITHDRAW_STATUS,

    signCP: string, // hex formt
    signL2: string, // hex formt
    signUser: string, // hex formt

    id?: number,
    createdAt?: number,
    updatedAt?: number
  ) {
    this.pnAddress = pnAddress;
    this.channelId = channelId;
    this.user = user;
    this.balance = balance;
    this.lastCommitBlock = lastCommitBlock;
    this.status = status;
    this.signCP = signCP;
    this.signL2 = signL2;
    this.signUser = signUser;

    if (id) this.id = id;
    if (updatedAt) this.updatedAt = updatedAt;
    if (createdAt) {
      this.createdAt = createdAt;
    } else {
      this.createdAt = new Date().getTime();
      this.save()
        .then(() => console.log('new UpdatePuppet entry created at: ', this.createdAt))
        .catch(console.error);
    }
  }

  static async find(channelId: string, balance: string, lastCommitBlock: number) {
    return await db.userWithdraw.filter(uw =>
      uw.channelId === channelId &&
      uw.balance === balance &&
      uw.lastCommitBlock === lastCommitBlock
    ).first();
  }

  public async save() {
    return db.transaction('rw', db.userWithdraw, async () => {
      this.updatedAt = new Date().getTime();
      this.id = await db.userWithdraw.put(this);
    });
  }
}

export enum WITHDRAW_STATUS {
  SIGNED = 1,
  ONCHAIN
}