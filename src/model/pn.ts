/**
 * model class of payment network
 */

import { Contract, Signer } from 'ethers'
import { Provider } from 'ethers/providers';

import { db } from './internal';

export class PN extends Contract {

  address: string;
  abi: string;

  id: number;
  token: string;
  cp: string;
  l2: string;
  createdAt: number;
  updatedAt: number;

  /**
   * constructor
   * @param address PN contract address
   * @param abi PN contract abi string
   *
   * @param id auto increment id
   * @param cp cp master address
   * @param l2 L2 master address
   * @param token erc20 token contract address, undefined for eth
   * @param createdAt create time of this entry, timestamp
   * @param updatedAt last update time of this entry, timestamp
   */
  constructor(
    address: string,
    abi: string,
    signerOrProvider: Signer | Provider,

    id?: number,
    token?: string,
    cp?: string,
    l2?: string,
    createdAt?: number,
    updatedAt?: number
  ) {
    super(address, abi, signerOrProvider);

    if (id) this.id = id;
    if (token) this.token = token;
    if (cp) this.cp = cp;
    if (l2) this.l2 = l2;
    if (updatedAt) this.updatedAt = updatedAt;
    if (createdAt) {
      this.createdAt = createdAt;
    } else {
      this.createdAt = new Date().getTime();
      console.log('new PN entry created at: ', this.createdAt);
    }
  }

  /**
   * sync data from contract
   */
  async sync() {

    // get pn type
    try {

      // the erc-20 contract address
      let token = await this.functions.token();

      console.log('an erc-20 payment network of ', token);
    } catch (e) {
      // token is undefined, eth pn
      console.log('an eth payment network');
    }

    // get cp address
    this.cp = await this.functions.provider();

    // get l2 address
    this.l2 = await this.functions.regulator();
  }

  async save() {
    this.updatedAt = new Date().getTime();
    let id = await db.pn.put(this);
    return Promise.resolve(id);
  }

  async getChannelId(user: string) {
    return await this.functions.getChannelIdentifier(user);
  }
}