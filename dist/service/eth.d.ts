export declare const events: {
    PuppetAdded: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    PuppetDisabled: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    ChannelOpened: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    UserNewDeposit: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    UserWithdraw: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    CooperativeSettled: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    ChannelClosed: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
    ChannelSettled: {
        filter: () => {
            user: string;
        };
        handler: (event: any) => Promise<void>;
    };
};
