/**
 * model class of payment network
 */

import { db } from './internal'
import { ethers } from 'ethers'
import SimpleCrypto from 'simple-crypto-js';
import { Arrayish } from 'ethers/utils';

export class Puppet {

  id: number;

  address: string;
  key: string;
  createdAt: number;
  updatedAt: number;

  constructor(
    id?: number,
    address?: string,
    key?: string,
    createdAt?: number,
    updatedAt?: number
  ) {
    if (id) this.id = id;
    if (address) this.address = address;
    if (key) this.key = key;
    if (updatedAt) this.updatedAt = updatedAt;
    if (createdAt) {
      this.createdAt = createdAt;
    } else {
      this.create();
      this.save()
        .then(() => console.log('new Puppet entry created at: ', this.createdAt))
        .catch(console.error);
    }
  }

  public static async getOrCreate() {
    let puppet = await db.puppet.orderBy('id').last();

    if (!puppet) puppet = new Puppet();

    return puppet;
  }

  /**
   * create a new puppet
   */
  private create() {

    console.log('creating new puppet..');

    let wallet = ethers.Wallet.createRandom();
    this.address = wallet.address;

    // use the last 8 characters of public key as password
    let crypto = new SimpleCrypto(this.getPassword());
    this.key = crypto.encrypt(wallet.privateKey);

    this.createdAt = new Date().getTime();
  }

  private async save() {
    return db.transaction('rw', db.puppet, async () => {
      this.updatedAt = new Date().getTime();
      this.id = await db.puppet.put(this);
    });
  }

  private getPassword() {
    return this.address.slice(-8);
  }

  async signMessage(message: Arrayish) {
    let crypto = new SimpleCrypto(this.getPassword());
    let key = crypto.decrypt(this.key).toString();
    let wallet = new ethers.Wallet(key);
    return wallet.signMessage(message);
  }
}