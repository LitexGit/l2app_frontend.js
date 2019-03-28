const TX = require('ethereumjs-tx');
const ethUtil = require('ethereumjs-util');
import { keccak256 } from 'ethereumjs-util';
import { EIP712_TYPES } from '../src/config/TypedData';
import { myEcsignToHex } from '../src/utils/common';
const abi = require('ethereumjs-abi');

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

  let messageHash = signHash(typedData);
  let signature = myEcsignToHex(web3_outer, messageHash, privateKey);
  return signature;
}

const types = EIP712_TYPES;

function dependencies(primaryType: any, found: any = []) {
  if (found.includes(primaryType)) {
    return found;
  }
  if (types[primaryType] === undefined) {
    return found;
  }
  found.push(primaryType);
  for (let field of types[primaryType]) {
    for (let dep of dependencies(field.type, found)) {
      if (!found.includes(dep)) {
        found.push(dep);
      }
    }
  }
  return found;
}

function encodeType(primaryType: any) {
  // Get dependencies primary first, then alphabetical
  let deps = dependencies(primaryType);
  deps = deps.filter((t: any) => t != primaryType);
  deps = [primaryType].concat(deps.sort());

  // Format as a string with fields
  let result = '';
  for (let type of deps) {
    // @ts-ignore
    result += `${type}(${types[type]
      .map(({ name, type }: any) => `${type} ${name}`)
      .join(',')})`;
  }

  return result;
}

function typeHash(primaryType: any) {
  return keccak256(encodeType(primaryType));
}

function encodeData(primaryType: any, data: any) {
  let encTypes: any = [];
  let encValues: any = [];

  // Add typehash
  encTypes.push('bytes32');
  encValues.push(typeHash(primaryType));

  // Add field contents
  for (let field of types[primaryType]) {
    let value = data[field.name];
    if (field.type == 'string' || field.type == 'bytes') {
      encTypes.push('bytes32');
      value = keccak256(value);
      encValues.push(value);
    } else if (types[field.type] !== undefined) {
      encTypes.push('bytes32');
      value = keccak256(encodeData(field.type, value));
      encValues.push(value);
    } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
      throw 'TODO: Arrays currently unimplemented in encodeData';
    } else {
      encTypes.push(field.type);
      encValues.push(value);
    }
  }

  return abi.rawEncode(encTypes, encValues);
}

function structHash(primaryType: any, data: any) {
  return keccak256(encodeData(primaryType, data));
}

function signHash(message: any) {
  return keccak256(
    Buffer.concat([
      Buffer.from('1901', 'hex'),
      structHash('EIP712Domain', message.domain),
      structHash(message.primaryType, message.message),
    ])
  ).toString('hex');
}
