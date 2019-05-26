import { AbiItem } from 'web3/node_modules/web3-utils';
import L2Session from '../session';
export declare type SOL_TYPE = 'address' | 'uint256' | 'bytes32' | 'bytes';
export declare const CITA_SYNC_EVENT_TIMEOUT = 15;
export declare const ETH_MESSAGE_COMMIT_BLOCK_EXPERITION = 15;
export declare const CITA_TX_COMMIT_BLOCK_EXPERITION = 88;
export declare const CITA_TX_BLOCK_INTERVAL = 1000;
export declare const SETTLE_WINDOW = 20;
export declare const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export declare enum PUPPET_STATUS {
    NULL = 0,
    ENABLED = 1,
    DISABLED = 2
}
export declare enum CHANNEL_STATUS {
    CHANNEL_STATUS_INIT = 0,
    CHANNEL_STATUS_OPEN = 1,
    CHANNEL_STATUS_CLOSE = 2,
    CHANNEL_STATUS_SETTLE = 3,
    CHANNEL_STATUS_APP_CO_SETTLE = 4,
    CHANNEL_STATUS_PENDING_ERC20_APPROVAL = 10000,
    CHANNEL_STATUS_ERC20_APPROVED = 10001,
    CHANNEL_STATUS_PENDING_ETH_OPEN = 10002,
    CHANNEL_STATUS_PENDING_ETH_DEPOSIT = 10003,
    CHANNEL_STATUS_PENDING_APP_WITHDRAW = 10004,
    CHANNEL_STATUS_PENDING_ETH_WITHDRAW = 10005,
    CHANNEL_STATUS_PENDING_APP_CO_SETTLE = 10006,
    CHANNEL_STATUS_PENDING_ETH_CO_SETTLE = 10007
}
export declare enum APPROVAL_STATUS {
    INIT = 0,
    APPROVING = 1,
    APPROVED = 2
}
export declare enum SESSION_STATUS {
    SESSION_STATUS_INIT = 0,
    SESSION_STATUS_OPEN = 1,
    SESSION_STATUS_CLOSE = 2
}
export declare type L2_EVENT = 'TokenApproval' | 'Deposit' | 'Withdraw' | 'ForceWithdraw' | 'Transfer' | 'PuppetChanged' | 'SessionMessage' | 'SessionClose' | 'WithdrawUnlocked';
export declare type APPROVE_EVENT = {
    user: string;
    type: number;
    token: string;
    amount: string;
    txhash: string;
};
export declare type DEPOSIT_EVENT = {
    user: string;
    type: number;
    token: string;
    amount: string;
    totalDeposit: string;
    balance: string;
    txhash: string;
};
export declare type WITHDRAW_EVENT = {
    user: string;
    type: number;
    token: string;
    amount: string;
    totalWithdraw: string;
    balance: string;
    txhash: string;
};
export declare type FORCEWITHDRAW_EVENT = {
    closer: string;
    token: string;
    userSettleAmount: string;
    providerSettleAmount: string;
    balance: string;
    txhash: string;
};
export declare type TRANSFER_EVENT = {
    from: string;
    to: string;
    token: string;
    amount: string;
    additionalHash: string;
    totalTransferredAmount: string;
    balance: string;
};
export declare type PUPPETCHANGED_EVENT = {
    user: string;
    puppet: string;
    type: number;
};
export declare type SESSION_MESSAGE_EVENT = {
    session: L2Session;
    from: string;
    to: string;
    type: number;
    content: string;
    amount: string;
    token: string;
};
export declare type SESSION_CLOSE_EVENT = {
    session: L2Session;
};
export declare type WITHDRAW_UNLOCKED_EVENT = {
    user: string;
    type: number;
    token: string;
    amount: string;
};
export declare type L2_CB = (err: any, res: APPROVE_EVENT | DEPOSIT_EVENT | WITHDRAW_EVENT | FORCEWITHDRAW_EVENT | TRANSFER_EVENT | PUPPETCHANGED_EVENT | SESSION_MESSAGE_EVENT | SESSION_CLOSE_EVENT | WITHDRAW_UNLOCKED_EVENT) => void;
export declare type ContractInfo = {
    address: string;
    abi: AbiItem[] | AbiItem;
};
