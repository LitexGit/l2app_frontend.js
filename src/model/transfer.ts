import { db, PN } from './internal'

export class Transfer {

  id: number;

  channelId: string;
  pnAddress: string;

  tredAmount: string;
  nonce: number;

  deltaAmount: string;
  additionalHash: string;

  from: string;
  to: string;
  sign: string;

  createdAt: number;
  updatedAt: number;

  constructor (
    channelId: string,
    pnAddress: string,
    tredAmount: string,
    deltaAmount: string,
    nonce: number,
    additionalHash: string,
    from: string,
    to: string,
    sign: string,

    id?: number,
    createdAt?: number,
    updatedAt?: number,
  ) {
    this.channelId = channelId;
    this.pnAddress = pnAddress;
    this.tredAmount = tredAmount;
    this.deltaAmount = deltaAmount;
    this.nonce = nonce;
    this.additionalHash = additionalHash;
    this.from = from;
    this.to = to;
    this.sign = sign;

    if (id) this.id = id;
    if (this.updatedAt) this.updatedAt = updatedAt;
    if (this.createdAt) {
      this.createdAt = createdAt;
    } else {
      this.createdAt = new Date().getTime();
    }
  }

  async save() {
    this.updatedAt = new Date().getTime();
    return await db.transfer.put(this);
  }
}