import { AbiItem } from 'web3/node_modules/web3-utils';
import L2Session from '../session';

export type SOL_TYPE = 'address' | 'uint256' | 'bytes32' | 'bytes';

export const CITA_SYNC_EVENT_TIMEOUT = 15;
export const ETH_MESSAGE_COMMIT_BLOCK_EXPERITION = 15;
export const CITA_TX_COMMIT_BLOCK_EXPERITION = 88;
export const CITA_TX_BLOCK_INTERVAL = 1000;
export const SETTLE_WINDOW = 20;
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export enum PUPPET_STATUS {
  NULL,
  ENABLED,
  DISABLED,
}

export enum CHANNEL_STATUS {
  CHANNEL_STATUS_INIT = 0,
  CHANNEL_STATUS_OPEN,
  CHANNEL_STATUS_CLOSE,
  CHANNEL_STATUS_SETTLE,
  CHANNEL_STATUS_APP_CO_SETTLE,

  CHANNEL_STATUS_PENDING_ERC20_APPROVAL = 10000,
  CHANNEL_STATUS_ERC20_APPROVED,
  CHANNEL_STATUS_PENDING_ETH_OPEN,
  CHANNEL_STATUS_PENDING_ETH_DEPOSIT,
  CHANNEL_STATUS_PENDING_APP_WITHDRAW,
  CHANNEL_STATUS_PENDING_ETH_WITHDRAW,
  CHANNEL_STATUS_PENDING_APP_CO_SETTLE,
  CHANNEL_STATUS_PENDING_ETH_CO_SETTLE,
}

export enum APPROVAL_STATUS {
  INIT = 0,
  APPROVING,
  APPROVED,
}

export enum SESSION_STATUS {
  SESSION_STATUS_INIT = 0,
  SESSION_STATUS_OPEN,
  SESSION_STATUS_CLOSE,
}

/**
 * EXTERNAL EXPORTS
 * all properties need outside, will be exposed in L2.ts
 */
export type L2_EVENT =
  | 'TokenApproval'
  | 'Deposit'
  | 'Withdraw'
  | 'ForceWithdraw'
  | 'Transfer'
  | 'PuppetChanged'
  | 'SessionMessage'
  | 'SessionClose'
  | 'WithdrawUnlocked';

export type APPROVE_EVENT = {
  user: string;
  type: number;
  token: string;
  amount: string;
  txhash: string;
};

export type DEPOSIT_EVENT = {
  user: string;
  type: number;
  token: string;
  amount: string;
  totalDeposit: string;
  balance: string;
  txhash: string;
};

export type WITHDRAW_EVENT = {
  user: string;
  type: number;
  token: string;
  amount: string;
  totalWithdraw: string;
  balance: string;
  txhash: string;
};

export type FORCEWITHDRAW_EVENT = {
  closer: string;
  token: string;
  userSettleAmount: string;
  providerSettleAmount: string;
  balance: string;
  txhash: string;
};

export type TRANSFER_EVENT = {
  from: string;
  to: string;
  token: string;
  amount: string;
  additionalHash: string;
  totalTransferredAmount: string;
  balance: string;
};

export type PUPPETCHANGED_EVENT = {
  user: string;
  puppet: string;
  type: number;
};

export type SESSION_MESSAGE_EVENT = {
  session: L2Session;
  from: string;
  to: string;
  type: number;
  content: string;
  amount: string;
  token: string;
};

export type SESSION_CLOSE_EVENT = {
  session: L2Session;
};

export type WITHDRAW_UNLOCKED_EVENT = {
  user: string;
  type: number;
  token: string;
  amount: string;
};

export type L2_CB = (
  err: any,
  res:
    | APPROVE_EVENT
    | DEPOSIT_EVENT
    | WITHDRAW_EVENT
    | FORCEWITHDRAW_EVENT
    | TRANSFER_EVENT
    | PUPPETCHANGED_EVENT
    | SESSION_MESSAGE_EVENT
    | SESSION_CLOSE_EVENT
    | WITHDRAW_UNLOCKED_EVENT
) => void;
export type ContractInfo = {
  address: string;
  abi: AbiItem[] | AbiItem;
};
