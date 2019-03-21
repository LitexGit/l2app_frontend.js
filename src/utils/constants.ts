
export type SOL_TYPE = 'address' | 'uint256' | 'bytes32' | 'bytes';

export const ETH_MESSAGE_COMMIT_BLOCK_EXPERITION = 250;
export const CITA_TX_COMMIT_BLOCK_EXPERITION = 88;
export const CITA_TX_BLOCK_INTERVAL = 1000;
export const SETTLE_WINDOW = 5;
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export enum PUPPET_STATUS {
  NULL,
  ENABLED,
  DISABLED
};

export enum CHANNEL_STATUS {
  CHANNEL_STATUS_INIT = 0,
  CHANNEL_STATUS_OPEN,
  CHANNEL_STATUS_CLOSE,
  CHANNEL_STATUS_SETTLE,
  CHANNEL_STATUS_PENDING_CO_SETTLE
};

export enum SESSION_STATUS {
  SESSION_STATUS_INIT = 0,
  SESSION_STATUS_OPEN,
  SESSION_STATUS_CLOSE
};


/**
 * EXTERNAL EXPORTS
 * all properties need outside, will be exposed in L2.ts
 */
export type L2_EVENT = 'Deposit' | 'Withdraw' | 'ForceWithdraw' | 'Transfer' | 'PuppetChanged';

export type DEPOSIT_EVENT = {
  user: string,
  type: number,
  token: string,
  amount: string,
  totalDeposit: string,
  txhash: string
}

export type WITHDRAW_EVENT = {
  user: string,
  type: number,
  token: string,
  amount: string,
  totalWithdraw: string,
  txhash: string
}

export type FORCEWITHDRAW_EVENT = {
  closer: string,
  token: string,
  userSettleAmount: string,
  providerSettleAmount: string,
  txhash: string
}

export type TRANSFER_EVENT = {
  from: string,
  to: string,
  token: string,
  amount: string,
  additionalHash: string,
  totalTransferredAmount: string,
}

export type PUPPETCHANGED_EVENT = {
  user: string,
  puppet: string
  type: number
}


export type L2_CB = (err: any, res: DEPOSIT_EVENT | WITHDRAW_EVENT | FORCEWITHDRAW_EVENT | TRANSFER_EVENT | PUPPETCHANGED_EVENT) => void;
export type ContractInfo = {
  address: string,
  abi: string
};