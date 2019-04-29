import { CHANNEL_STATUS } from './utils/constants';
export declare enum TX_TYPE {
    CHANNEL_OPEN = 1,
    CHANNEL_DEPOSIT = 2,
    CHANNEL_WITHDRAW = 3,
    CHANNEL_CO_SETTLE = 4,
    CHANNEL_FORCE_WITHDRAW = 5,
    TOKEN_APPROVE = 6
}
export declare type TXINFO = {
    txHash: string;
    type: TX_TYPE;
    user: string;
    channelID: string;
    token: string;
    amount: string;
    time: number;
};
export default class EthPendingTxStore {
    private enabled;
    private txList;
    private key;
    constructor();
    load(): Promise<void>;
    save(): void;
    setTokenAllowance(token: string, allowance: string): void;
    getTokenAllowance(token: string): number;
    addTx(info: TXINFO): void;
    removeTx(txHash: string): void;
    getApproveEventFromLogs(logs: any): Promise<{
        user: string;
        contractAddress: string;
        amount: string;
    }>;
    startWatch(): Promise<void>;
    getPendingTxByChannelID(channelID: string): false | TXINFO;
    getPendingTxByUser(user: string, token: string): false | TXINFO;
    getChannelStatus(channelID: string, appStatus: CHANNEL_STATUS, user: string, token: string): Promise<CHANNEL_STATUS>;
    getInitSubStatus(user: any, token: any): Promise<CHANNEL_STATUS.CHANNEL_STATUS_INIT | CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ERC20_APPROVAL | CHANNEL_STATUS.CHANNEL_STATUS_ERC20_APPROVED | CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_OPEN>;
    getOpenSubStatus(channelID: string, user: string, token: string): Promise<CHANNEL_STATUS.CHANNEL_STATUS_OPEN | CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ERC20_APPROVAL | CHANNEL_STATUS.CHANNEL_STATUS_ERC20_APPROVED | CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_DEPOSIT | CHANNEL_STATUS.CHANNEL_STATUS_PENDING_ETH_WITHDRAW | CHANNEL_STATUS.CHANNEL_STATUS_PENDING_APP_CO_SETTLE>;
    stopWatch(): Promise<void>;
}
