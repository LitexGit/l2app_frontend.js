export declare const events: {
    ConfirmUserWithdraw: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    ConfirmCooperativeSettle: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    Transfer: {
        filter: () => {
            to: string;
        };
        handler: (event: any) => Promise<void>;
    };
    OnchainAddPuppet: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    OnchainDisablePuppet: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    OnchainOpenChannel: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    OnchainUserDeposit: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    OnchainUserWithdraw: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    OnchainCooperativeSettleChannel: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    OnchainSettleChannel: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
};
export declare const ethMethods: {
    ethSubmitUserWithdraw: (channelID: string, duration?: number) => Promise<void>;
    ethSubmitCooperativeSettle: (channelID: string) => Promise<string>;
    ethSettleChannel: (channelID: string) => Promise<void>;
};
export declare const appMethods: {
    appSubmitGuardProof: (channelID: string, to: string) => Promise<void>;
};
