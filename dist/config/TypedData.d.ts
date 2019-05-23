/// <reference types="node" />
export declare const EIP712_TYPES: {
    EIP712Domain: {
        name: string;
        type: string;
    }[];
    Transfer: {
        name: string;
        type: string;
    }[];
};
export declare function compactTypedData(message: any): Buffer;
export declare function signHash(message: any): any;
export declare function recoverTypedData(typedData: any, signature: string): any;
