import Dexie from 'dexie'
import { PN, Channel, Rebalance, Transfer, Puppet, UpdatePuppet, UserWithdraw } from './internal';

export class L2DB extends Dexie {

  pn: Dexie.Table<PN, number>;
  channel: Dexie.Table<Channel, number>;
  rebalance: Dexie.Table<Rebalance, number>;
  transfer: Dexie.Table<Transfer, number>;
  puppet: Dexie.Table<Puppet, number>;
  updatePuppet: Dexie.Table<UpdatePuppet, number>;
  userWithdraw: Dexie.Table<UserWithdraw, number>;

  constructor() {

    super("L2DB");

    this.version(1).stores({
      pn: `++id, address, token, cp, l2, createdAt, updatedAt`,
      channel: `++id, channelId, pnAddress, user, puppet, deposit, withdraw, balance,
        tredAmount, tredNonce, cp, cpBalance, cpTredAmount, cpTredNonce,
        rebinAmount, rebinNonce, reboutAmount, reboutNonce, status, closeType, closer,
        settledAmount, cpSettledAmount, settleTX, createdAt, updatedAt`,
      rebalance: `++id, channelId, pnAddress, amount, deltaAmount, type, nonce,
        signCP, signL2, signUser, createdAt, updatedAt`,
      transfer: `++id, channelId, pnAddress, tredAmount, deltaAmount, nonce,
        additionalHash, from, to, sign, createdAt, updatedAt`,
      puppet: `++id, address, key, createdAt, updatedAt`,
      updatePuppet: `++id, pnAddress, channelId, newPuppet, oldPuppet, lastCommitBlock, status, signCP, signL2, singUser, createdAt, updatedAt`,
      userWithdraw: `++id, pnAddress, channelId, user, balance, lastCommitBlock, status, signCP, signL2, singUser, createdAt, updatedAt`,
    })

    this.pn.mapToClass(PN);
    this.channel.mapToClass(Channel);
    this.rebalance.mapToClass(Rebalance);
    this.transfer.mapToClass(Transfer);
    this.puppet.mapToClass(Puppet);
    this.updatePuppet.mapToClass(UpdatePuppet);
    this.userWithdraw.mapToClass(UserWithdraw);
  }
}

export const db = new L2DB();