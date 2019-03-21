/**
 * 签名相关的工具函数
 */
import { ecsign, toRpcSig } from 'ethereumjs-util'
import { AbiItem } from 'web3/node_modules/web3-utils';
import { ETH_MESSAGE_COMMIT_BLOCK_EXPERITION, CITA_TX_COMMIT_BLOCK_EXPERITION } from './constants';
import { Contract } from 'web3/node_modules/web3-eth-contract';
import { EIP712_TYPES } from '../config/TypedData';




/**
 * 用私钥签署消息
 * 
 * @param {any} web3 
 * @param {string} messageHash 消息Hash
 * @param {string } privateKey 私钥
 * 
 * @returns {Bytes} 返回bytes格式的签名结果
 */
export function myEcsign(web3: any, messageHash: string, privateKey: string)  {

    let signatureHexString = myEcsignToHex(web3, messageHash, privateKey);
    let signatureBytes = web3.utils.hexToBytes(signatureHexString);
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
export function myEcsignToHex(web3: any, messageHash: string, privateKey: string): string {

    let privateKeyBuffer = new Buffer(privateKey.replace('0x', ''), 'hex');
    let messageHashBuffer = new Buffer(messageHash.replace('0x', ''), 'hex');
    let signatureObj = ecsign(messageHashBuffer, privateKeyBuffer);
    let signatureHexString = toRpcSig(signatureObj.v, signatureObj.r, signatureObj.s)//.toString('hex');
    return signatureHexString;
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
export async function sendEthTx(web3: any, from: string, to: string, value: number | string , data: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        web3.eth.sendTransaction({ from, to, value, data, gasPrice: 1e10 }, function (err: any, result: any) {
            console.log("send Transaction", err, result);
            if (err){
                reject(err)
            }else{
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
export async function signMessage(web3: any, from: string, typedData: any): Promise<string> {

    // if (!(web3.currentProvider as any).isMetaMask) {

    //     const typedDataHash = ethUtil.bufferToHex(hashTypedData(typedData));
    //     const sig = await web3.eth.sign(typedDataHash, from);
    //     const recoveredAddress = recoverTypedData(typedData, sig);
    //     if (recoveredAddress !== from) {
    //     }
    //     return sig;


    // }else {
    var params = [from, JSON.stringify(typedData)]
    console.dir(params)
    var method = 'eth_signTypedData_v3'

    return new Promise<string>((resolve, reject) => {
        web3.currentProvider.sendAsync({
            method,
            params,
            from,
        }, async (err: any, result: any) => {
            console.log('sign Result', err, result);
            if (err) {
                reject(err);
            } else if (result.error) {
                reject(result.error)
            } else {
                resolve(result.result);
            }
        });
    });

    // }
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
  } catch(e) {
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
 * @param {number} duration 
 * 
 * @returns {Promise<any>}
 */
export async function delay(duration: number): Promise<any>{
    return new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * ask outer wallet to sign transfer message
 * 
 * @param {any} web3_outer 
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
  web3_outer: any,
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
    primaryType: "Transfer",
    domain: {
      name: "litexlayer2",
      version: "1",
      chainId: 4,
      verifyingContract: ethPNAddress
    },
    message: {
      channelID: channelID,
      balance,
      nonce,
      additionalHash
    }
  };

  console.log("typedData ", typedData);

  let signature = "";
  try {
    signature = await signMessage(web3_outer, user, typedData);
  } catch (err) {
    console.log("user reject the sign action");
    throw err;
  }

  return signature;
}