/**
 * model class of puppet update records
 */

import { db } from './internal'

export class UpdatePuppet {

  id: number;

  pnAddress: string;
  channelId: string;

  newPuppet: string;
  oldPuppet: string;

  lastCommitBlock: number;
  status: PUPPET_STATUS;

  signCP: string; // hex formt
  signL2: string; // hex formt
  signUser: string; // hex formt

  createdAt: number;
  updatedAt: number;

  constructor(

    pnAddress: string,
    channelId: string,

    newPuppet: string,
    oldPuppet: string,

    lastCommitBlock: number,
    status: PUPPET_STATUS,

    signCP: string, // hex formt
    signL2: string, // hex formt
    signUser: string, // hex formt

    id?: number,
    createdAt?: number,
    updatedAt?: number
  ) {
    this.pnAddress = pnAddress;
    this.channelId = channelId;
    this.newPuppet = newPuppet;
    this.oldPuppet = oldPuppet;
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

  public async save() {
    return db.transaction('rw', db.updatePuppet, async () => {
      this.updatedAt = new Date().getTime();
      this.id = await db.updatePuppet.put(this);
    });
  }
}

export enum PUPPET_STATUS {
  SIGNED = 1,
  ONCHAIN
}