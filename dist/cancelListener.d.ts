export declare type SettleRequest = {
    channelID: string;
    balance: string;
    lastCommitBlock: number;
};
export default class CancelListener {
    private enabled;
    private settleList;
    private key;
    constructor();
    load(): Promise<void>;
    save(): void;
    add(info: SettleRequest): void;
    contains(channelID: string): boolean;
    remove(channelID: string): void;
    start(): Promise<void>;
    stop(): void;
}
