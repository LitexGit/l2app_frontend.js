export declare const events: {
    SendMessage: {
        filter: () => {
            from: string;
        };
        handler: (event: any) => Promise<void>;
    };
    CloseSession: {
        filter: () => {};
        handler: (event: any) => Promise<void>;
    };
};
