import { SESSION_STATUS } from './utils/constants';
export default class L2Session {
    sessionID: string;
    status: SESSION_STATUS;
    game: string;
    data: string;
    provider: string;
    callbacks: Map<string, (err: Error, res: any) => void>;
    static sessionList: Map<string, L2Session>;
    static getSessionById(_sessionID: string, fromChain?: boolean): Promise<L2Session>;
    static isExists(_sessionID: string): Promise<boolean>;
    static getMessagesBySessionID(_sessionID: string): Promise<Array<any>>;
    static getPlayersBySessionID(_sessionID: string): Promise<Array<string>>;
    private constructor();
    private initialize;
    sendMessage(to: string, type: number, content: string, amount?: string | number, token?: string): Promise<string>;
    onMessage(callback: (error: Error, res: any) => void): Promise<void>;
    onSessionClose(callback: (error: Error, res: any) => void): Promise<void>;
    private buildTransferData;
}
