import { AbiItem } from 'web3/node_modules/web3-utils';
import { Contract } from 'web3/node_modules/web3-eth-contract';
export declare function myEcsign(messageHash: string, privateKey: string): number[];
export declare function myEcsignToHex(messageHash: string, privateKey: string): string;
export declare function getEthGasPrice(web3: any): Promise<{}>;
export declare function sendEthTx(web3: any, from: string, to: string, value: number | string, data: string): Promise<string>;
export declare function signMessage(web3: any, from: string, typedData: any): Promise<string>;
export declare function abi2jsonInterface(abi: string): AbiItem[] | undefined;
export declare function getLCB(base: any, chain: string): Promise<any>;
export declare function delay(duration: number): Promise<any>;
export declare function prepareSignatureForTransfer(web3: any, ethPNAddress: string, channelID: string, balance: string, nonce: string, additionalHash: string, user: string): Promise<string>;
export declare function extractEventFromReceipt(web3: any, receipt: any, contract: Contract, name: string): {
    [key: string]: string;
};
export declare function getAppTxOption(): Promise<{
    validUntilBlock: any;
    from: string;
    privateKey: string;
    nonce: number;
    quota: number;
    chainId: number;
    version: number;
    value: string;
}>;
export declare function sendAppTx(action: any, name: string): Promise<string>;
export declare function getERC20Allowance(owner: string, spender: string, token: string): Promise<any>;
export declare function extractEthTxHashFromAppTx(appTxHash: any): Promise<string>;
export declare let logger: any;
export declare function setLogger(): Promise<void>;
