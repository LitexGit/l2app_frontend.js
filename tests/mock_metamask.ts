const TX = require('ethereumjs-tx');
import { EIP712_TYPES, signHash } from '../src/config/TypedData';
import { myEcsignToHex } from '../src/utils/common';
import { bufferToHex } from 'ethereumjs-util';

export let nonce = 0;
/**
 * submit a transaction to ethereum
 *
 * @param {string} from from eth address
 * @param {string} to to eth address
 * @param {number|string} value transaction value
 * @param {string} data transaction data
 *
 * @returns {Promise<string>} transactionHash
 */
export async function mock_sendEthTx(
  web3: any,
  from: string,
  to: string,
  value: number | string,
  data: string,
  privateKey: string
): Promise<string> {
  if (nonce === 0) {
    nonce = await web3.eth.getTransactionCount(from);
  } else {
    nonce = nonce + 1;
  }

  let rawTx = {
    from: from,
    nonce: '0x' + nonce.toString(16),
    chainId: await web3.eth.net.getId(),
    to: to,
    data: data,
    value: web3.utils.toHex(value),
    gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
    gasLimit: web3.utils.toHex(300000),
  };

  let tx = new TX(rawTx);

  let priKey = privateKey;

  if (priKey.substr(0, 2) === '0x') {
    tx.sign(Buffer.from(priKey.substr(2), 'hex'));
  } else {
    tx.sign(Buffer.from(priKey, 'hex'));
  }

  let serializedTx = tx.serialize();

  let txData = '0x' + serializedTx.toString('hex');

  console.log('SEND TX', rawTx);

  return new Promise<string>((resolve, reject) => {
    try {
      web3.eth
        .sendSignedTransaction(txData)
        .on('transactionHash', (value: any) => {
          resolve(value);
        })
        .on('error', (error: any) => {
          reject(error);
        });
    } catch (e) {
      reject(e);
    }
  });
}

export async function mock_prepareSignatureForTransfer(
  web3_outer: any,
  ethPNAddress: string,
  channelID: string,
  balance: string,
  nonce: string,
  additionalHash: string,
  user: string,
  privateKey: string
): Promise<string> {
  let typedData = {
    types: EIP712_TYPES,
    primaryType: 'Transfer',
    domain: {
      name: 'litexlayer2',
      version: '1',
      chainId: 4,
      verifyingContract: ethPNAddress,
    },
    message: {
      channelID: channelID,
      balance,
      nonce,
      additionalHash,
    },
  };

  console.log('typedData ', typedData);

  let messageHash = bufferToHex(signHash(typedData));
  let signature = myEcsignToHex(web3_outer, messageHash, privateKey);
  return signature;
}
