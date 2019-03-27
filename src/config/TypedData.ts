export const EIP712_TYPES = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ],
  Transfer: [
    { name: 'channelID', type: 'bytes32' },
    { name: 'balance', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'additionalHash', type: 'bytes32' },
  ],
};
