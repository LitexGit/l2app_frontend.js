/**
 * 签名相关的工具函数
 */
//const Tx = require('ethereumjs-tx')
// const ethUtil = require('ethereumjs-util');
import { ecsign, toRpcSig } from 'ethereumjs-util'


/**
 * 用私钥签署消息
 * @param web3 
 * @param messageHash 消息Hash
 * @param privateKey 私钥
 * @returns {Bytes} 返回bytes格式的签名结果
 */
export function myEcsign(web3: any, messageHash: string, privateKey: string) {

    let signatureHexString = myEcsignToHex(web3, messageHash, privateKey);
    let signatureBytes = web3.utils.hexToBytes(signatureHexString);
    return signatureBytes;
}

/**
 * 用私钥签署消息
 * @param web3 
 * @param messageHash 消息Hash
 * @param privateKey 私钥
 * @returns {String} 返回hex格式的签名结果
 */
export function myEcsignToHex(web3: any, messageHash: string, privateKey: string) {

    let privateKeyBuffer = new Buffer(privateKey.replace('0x', ''), 'hex');
    let messageHashBuffer = new Buffer(messageHash.replace('0x', ''), 'hex');
    let signatureObj = ecsign(messageHashBuffer, privateKeyBuffer);
    let signatureHexString = toRpcSig(signatureObj.v, signatureObj.r, signatureObj.s)//.toString('hex');
    return signatureHexString;
}

