let ethUtil = require('ethereumjs-util');
const abi = require('ethereumjs-abi');

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
  return ethUtil.keccak256(encodeType(primaryType));
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
      value = ethUtil.keccak256(value);
      encValues.push(value);
    } else if (types[field.type] !== undefined) {
      encTypes.push('bytes32');
      value = ethUtil.keccak256(encodeData(field.type, value));
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
  return ethUtil.keccak256(encodeData(primaryType, data));
}
export function compactTypedData(message: any) {
  return Buffer.concat([
    Buffer.from('1901', 'hex'),
    structHash('EIP712Domain', message.domain),
    structHash(message.primaryType, message.message),
  ]);
}

export function signHash(message: any) {
  return ethUtil.keccak256(compactTypedData(message));
}

export function recoverTypedData(typedData: any, signature: string) {
  const hash = signHash(typedData);
  const sigParams = ethUtil.fromRpcSig(signature);
  const pubKey = ethUtil.ecrecover(hash, sigParams.v, sigParams.r, sigParams.s);
  const address = ethUtil.pubToAddress(pubKey);
  return ethUtil.toChecksumAddress(ethUtil.bufferToHex(address));
}
