/**
 * 签名相关的工具函数
 */
import { ecsign, toRpcSig } from 'ethereumjs-util';
import { AbiItem } from 'web3/node_modules/web3-utils';
import {
  ETH_MESSAGE_COMMIT_BLOCK_EXPERITION,
  CITA_TX_COMMIT_BLOCK_EXPERITION,
} from './constants';
import { Contract } from 'web3/node_modules/web3-eth-contract';
import { EIP712_TYPES, signHash, recoverTypedData, compactTypedData } from '../config/TypedData';
import {
  cita,
  puppet,
  debug,
  appOperator,
  web3,
  ERC20,
  ethChainId,
} from '../main';
import { bufferToHex } from 'ethereumjs-util';
import { hexToBytes } from 'web3/node_modules/web3-utils';
import { AbiCoder } from 'web3/node_modules/web3-eth-abi';
import { resolve } from 'path';

/**
 * 用私钥签署消息
 *
 * @param {any} web3
 * @param {string} messageHash 消息Hash
 * @param {string } privateKey 私钥
 *
 * @returns {Bytes} 返回bytes格式的签名结果
 */
export function myEcsign(messageHash: string, privateKey: string) {
  let signatureHexString = myEcsignToHex(messageHash, privateKey);
  let signatureBytes = hexToBytes(signatureHexString);
  return signatureBytes;
}

/**
 * 用私钥签署消息
 *
 * @param {any} web3
 * @param {string} messageHash 消息Hash
 * @param {string} privateKey 私钥
 *
 * @returns {String} 返回hex格式的签名结果
 */
export function myEcsignToHex(messageHash: string, privateKey: string): string {
  let privateKeyBuffer = new Buffer(privateKey.replace('0x', ''), 'hex');
  let messageHashBuffer = new Buffer(messageHash.replace('0x', ''), 'hex');
  let signatureObj = ecsign(messageHashBuffer, privateKeyBuffer);
  let signatureHexString = toRpcSig(
    signatureObj.v,
    signatureObj.r,
    signatureObj.s
  );
  return signatureHexString;
}

/**
 * get eth current gas price
 *
 * @param web3
 */
export async function getEthGasPrice(web3: any) {
  const { toBigNumber } = web3;
  return new Promise((resolve, reject) => {
    web3.eth.getGasPrice((error, result) => {
      if (error) {
        reject(error);
      } else {
        const biggerPrice = result.mul(toBigNumber(11)).div(toBigNumber(10));
        resolve(biggerPrice.toString(10));
      }
    });
  });
}

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
export async function sendEthTx(
  web3: any,
  from: string,
  to: string,
  value: number | string,
  data: string
): Promise<string> {
  const gasPrice = await getEthGasPrice(web3);
  return new Promise<string>((resolve, reject) => {
    web3.eth.sendTransaction({ from, to, value, data, gasPrice }, function(
      err: any,
      result: any
    ) {
      logger.info('send Transaction', err, result);
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * sign message with eth_SignTypedData_v3 by metamask
 *
 * @param {any} web3
 * @param {string} typedData messages need to be signed
 *
 * @returns {Promise<string>} the sign result
 */
export async function signMessage(
  web3: any,
  from: string,
  typedData: any
): Promise<string> {
  if (!(web3.currentProvider as any).isMetaMask) {

    const typedDataHash = bufferToHex(signHash(typedData));
    let message = typedDataHash;

    if ((web3.currentProvider as any).isAlphaWallet) {
      message = bufferToHex(compactTypedData(typedData));
    }

    console.log('typedDataHash, from', typedDataHash, from);
    let signFunc = new Promise((resolve, reject) => {
      web3.eth.sign(from, message, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
    const sig = (await signFunc) as string;
    const recoveredAddress = recoverTypedData(typedData, sig);
    if (recoveredAddress.toLowerCase() !== from.toLowerCase()) {
      throw new Error(
        `Invalid sig ${sig} of hash ${typedDataHash} of data ${JSON.stringify(
          typedData
        )} recovered ${recoveredAddress} instead of ${from}.`
      );
    }
    return sig;
  } else {
    let params = [from, JSON.stringify(typedData)];
    // console.dir(params);
    let method = 'eth_signTypedData_v3';

    return new Promise<string>((resolve, reject) => {
      web3.currentProvider.sendAsync(
        {
          method,
          params,
          from,
        },
        async (err: any, result: any) => {
          logger.info('sign Result', err, result);
          if (err) {
            reject(err);
          } else if (result.error) {
            reject(result.error);
          } else {
            resolve(result.result);
          }
        }
      );
    });
  }
}

/**
 * convert contract abi code of string type to AbiItem[]
 *
 * @param {string} abi contract abi code
 *
 * @returns {AbiItem[]|undefined} the abi code of AbiItem[] type
 */
export function abi2jsonInterface(abi: string): AbiItem[] | undefined {
  try {
    let abiArray: AbiItem[] = JSON.parse(abi);
    if (!Array.isArray(abiArray)) return undefined;
    return abiArray;
  } catch (e) {
    return undefined;
  }
}

/**
 * get the valid the block number for tx or msg
 *
 * @param {any} base
 * @param {string} chain eth or cita
 *
 * @returns the last commit block for valid data
 */
export async function getLCB(base: any, chain: string) {
  let current = await base.getBlockNumber();
  if (chain === 'eth') {
    return current + ETH_MESSAGE_COMMIT_BLOCK_EXPERITION;
  } else {
    return current + CITA_TX_COMMIT_BLOCK_EXPERITION;
  }
}

/**
 * delay time for duation
 *
 * @param {number} duration  unit: milisecond
 *
 * @returns {Promise<any>}
 */
export async function delay(duration: number): Promise<any> {
  return new Promise(resolve => setTimeout(resolve, duration));
}

/**
 * ask outer wallet to sign transfer message
 *
 * @param {any} web3
 * @param {string} ethPNAddress
 * @param {string} channelID
 * @param {string} balance
 * @param {string} nonce
 * @param {string} additionalHash
 * @param {string} user
 *
 * @returns {Promise<string>} signature for transfer message
 */
export async function prepareSignatureForTransfer(
  web3: any,
  ethPNAddress: string,
  channelID: string,
  balance: string,
  nonce: string,
  additionalHash: string,
  user: string
): Promise<string> {
  // build typed data for transfer message
  let typedData = {
    types: EIP712_TYPES,
    primaryType: 'Transfer',
    domain: {
      name: 'litexlayer2',
      version: '1',
      chainId: ethChainId,
      verifyingContract: ethPNAddress,
    },
    message: {
      channelID: channelID,
      balance,
      nonce,
      additionalHash,
    },
  };

  logger.info('typedData ', typedData);

  let signature = '';
  try {
    signature = await signMessage(web3, user, typedData);
  } catch (err) {
    logger.info('user reject the sign action');
    throw err;
  }

  return signature;
}

/**
 * extract event from transaction receipt
 *
 * @param receipt
 * @param contract contract definition
 * @param name event name
 *
 * @returns event object
 */
export function extractEventFromReceipt(
  web3: any,
  receipt: any,
  contract: Contract,
  name: string
) {
  let abiItems = contract.options.jsonInterface;

  let eventDefinition = null;
  for (let abiItem of abiItems) {
    if (abiItem.type === 'event' && abiItem.name === name) {
      eventDefinition = abiItem;
      break;
    }
  }

  if (eventDefinition === null) {
    return null;
  }

  let abiCoder = new AbiCoder();

  let eventSignature = abiCoder.encodeEventSignature(eventDefinition);

  for (let log of receipt.logs) {
    if (log.topics[0] === eventSignature) {
      return abiCoder.decodeLog(
        eventDefinition.inputs,
        log.data,
        log.topics.slice(1)
      );
    }
  }

  return null;
}

/**
 * build the valid tx options for submiting cita transaction
 */
export async function getAppTxOption() {
  const tx = {
    nonce: 999999,
    quota: 1000000,
    chainId: 1,
    version: 1,
    validUntilBlock: 999999,
    value: '0x0',
  };
  return {
    ...tx,
    validUntilBlock: await getLCB(cita.base, 'cita'),
    from: puppet.getAccount().address,
    privateKey: puppet.getAccount().privateKey,
  };
}

export async function sendAppTx(action: any, name: string): Promise<string> {
  let tx = await getAppTxOption();
  let res = await action.send(tx);
  if (res.hash) {
    let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
    if (receipt.errorMessage) {
      logger.error(
        `CTIATX ${name} confirm error ${receipt.errorMessage}`,
        res.hash,
        action.arguments,
        tx
      );
      throw new Error(`CTIATX ${name} confirm error ${receipt.errorMessage}`);
    } else {
      logger.info(`CTIATX ${name} success`, res.hash);
      return res.hash;
    }
  } else {
    logger.error(
      `CITATX ${name} submit failed`,
      res.hash,
      action.arguments,
      tx
    );
    throw new Error(`CITATX ${name} submit failed`);
  }
}
export async function getERC20Allowance(
  owner: string,
  spender: string,
  token: string
) {
  ERC20.options.address = token;
  let allowance = await ERC20.methods.allowance(owner, spender).call();
  // ethPendingTxStore.setTokenAllowance(token, allowance);
  return allowance;
}

/**
 * get eth transaction hash from operator's tx
 *
 * @param appTxHash appchain transaction Hash
 */
export async function extractEthTxHashFromAppTx(
  appTxHash: any
): Promise<string> {
  let receipt = await cita.listeners.listenToTransactionReceipt(appTxHash);
  // logger.info('receipt', receipt);

  let executionABIs = appOperator.options.jsonInterface.filter(
    item => item.name === 'Execution'
  );

  let abiCoder = new AbiCoder();
  for (let log of receipt.logs) {
    if (log.topics[0] === abiCoder.encodeEventSignature(executionABIs[0])) {
      let transactionId = log.topics[1];
      let { txHash } = await appOperator.methods
        .transactions(transactionId)
        .call();
      return txHash;
    }
  }
}

export declare let logger;

// mylog();
logger = {
  info: debug ? console.log : () => {},
  error: debug ? console.error : () => {},
};

export async function setLogger() {
  logger = {
    info: debug ? console.log : () => {},
    error: debug ? console.error : () => {},
  };
}
