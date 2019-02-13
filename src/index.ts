import L2, { PN, Channel, Puppet } from './L2';
import { db } from './model/internal'
import SimpleCrypto from 'simple-crypto-js'
import { ethers } from 'ethers';
const ganache = require('ganache-cli');

console.log('See this in your browser console: Typescript Webpack Starter Launched');

const socketUrl = 'localhost';
const ethPN = new PN('0x0B37298a4C05637c896B9837A717648D2C539aC4', `[{"constant":true,"inputs":[],"name":"provider","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"participant","type":"address"},{"name":"puppet","type":"address"},{"name":"settleWindow","type":"uint256"}],"name":"openChannel","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"participant","type":"address"},{"name":"balance","type":"uint256"},{"name":"lastCommitBlock","type":"uint256"},{"name":"providerSignature","type":"bytes"},{"name":"regulatorSignature","type":"bytes"}],"name":"cooperativeSettle","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"withdraw","type":"uint256"},{"name":"lastCommitBlock","type":"uint256"},{"name":"providerSignature","type":"bytes"},{"name":"regulatorSignature","type":"bytes"},{"name":"receiver","type":"address"}],"name":"participantWithdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"puppet","type":"address"},{"name":"lastCommitBlock","type":"uint256"},{"name":"providerSignature","type":"bytes"},{"name":"regulatorSignature","type":"bytes"}],"name":"setPuppet","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"participant","type":"address"},{"name":"balance","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"additionalHash","type":"bytes32"},{"name":"partnerSignature","type":"bytes"},{"name":"inAmount","type":"uint256"},{"name":"inNonce","type":"uint256"},{"name":"regulatorSignature","type":"bytes"},{"name":"inProviderSignature","type":"bytes"},{"name":"outAmount","type":"uint256"},{"name":"outNonce","type":"uint256"},{"name":"participantSignature","type":"bytes"},{"name":"outProviderSignature","type":"bytes"}],"name":"closeChannel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"participant","type":"address"},{"name":"inAmount","type":"uint256"},{"name":"inNonce","type":"uint256"},{"name":"regulatorSignature","type":"bytes"},{"name":"inProviderSignature","type":"bytes"},{"name":"outAmount","type":"uint256"},{"name":"outNonce","type":"uint256"},{"name":"participantSignature","type":"bytes"},{"name":"outProviderSignature","type":"bytes"}],"name":"regulatorUpdateProof","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"counter","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"participant","type":"address"}],"name":"getChannelIdentifier","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"identifier_to_channel","outputs":[{"name":"status","type":"uint8"},{"name":"settleBlock","type":"uint256"},{"name":"puppet","type":"address"},{"name":"deposit","type":"uint256"},{"name":"withdraw","type":"uint256"},{"name":"participantBalance","type":"uint256"},{"name":"participantNonce","type":"uint256"},{"name":"providerBalance","type":"uint256"},{"name":"providerNonce","type":"uint256"},{"name":"inAmount","type":"uint256"},{"name":"inNonce","type":"uint256"},{"name":"outAmount","type":"uint256"},{"name":"outNonce","type":"uint256"},{"name":"isCloser","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"participant","type":"address"}],"name":"setTotalDeposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"participant","type":"address"}],"name":"settleChannel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"providerBalance","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"providerSetDeposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"settleWindowMax","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"balance","type":"int256"},{"name":"lastCommitBlock","type":"uint256"},{"name":"regulatorSignature","type":"bytes"}],"name":"providerWithdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"participant","type":"address"},{"name":"balance","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"additionalHash","type":"bytes32"},{"name":"partnerSignature","type":"bytes"},{"name":"consignorSignature","type":"bytes"}],"name":"partnerUpdateProof","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"},{"name":"","type":"address"}],"name":"verifyPuppet","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"settleWindowMin","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"regulator","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"participant_to_counter","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_regulator","type":"address"},{"name":"_provider","type":"address"},{"name":"_settleWindowMin","type":"uint256"},{"name":"_settleWindowMax","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"participant","type":"address"},{"indexed":false,"name":"puppet","type":"address"},{"indexed":false,"name":"settleWindow","type":"uint256"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"channelIdentifier","type":"bytes32"}],"name":"ChannelOpened","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"channelIdentifier","type":"bytes32"},{"indexed":true,"name":"participant","type":"address"},{"indexed":false,"name":"puppet","type":"address"}],"name":"PuppetChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"channelIdentifier","type":"bytes32"},{"indexed":true,"name":"participant","type":"address"},{"indexed":false,"name":"newDeposit","type":"uint256"},{"indexed":false,"name":"totalDeposit","type":"uint256"}],"name":"ChannelNewDeposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"channelIdentifier","type":"bytes32"},{"indexed":true,"name":"participant","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"withdraw","type":"uint256"}],"name":"ParticipantWithdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"channelIdentifier","type":"bytes32"},{"indexed":true,"name":"participant","type":"address"},{"indexed":false,"name":"balance","type":"uint256"}],"name":"CooperativeSettled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"channelIdentifier","type":"bytes32"},{"indexed":true,"name":"closing","type":"address"},{"indexed":false,"name":"balance","type":"uint256"},{"indexed":false,"name":"nonce","type":"uint256"},{"indexed":false,"name":"inAmount","type":"uint256"},{"indexed":false,"name":"inNonce","type":"uint256"},{"indexed":false,"name":"outAmount","type":"uint256"},{"indexed":false,"name":"outNonce","type":"uint256"}],"name":"ChannelClosed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"channelIdentifier","type":"bytes32"},{"indexed":true,"name":"participant","type":"address"},{"indexed":false,"name":"participantBalance","type":"uint256"},{"indexed":false,"name":"participantNonce","type":"uint256"},{"indexed":false,"name":"providerBalance","type":"uint256"},{"indexed":false,"name":"providerNonce","type":"uint256"}],"name":"PartnerUpdateProof","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"channelIdentifier","type":"bytes32"},{"indexed":true,"name":"participant","type":"address"},{"indexed":false,"name":"inAmount","type":"uint256"},{"indexed":false,"name":"inNonce","type":"uint256"},{"indexed":false,"name":"outAmount","type":"uint256"},{"indexed":false,"name":"outNonce","type":"uint256"}],"name":"RegulatorUpdateProof","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"channelIdentifier","type":"bytes32"},{"indexed":true,"name":"participant","type":"address"},{"indexed":false,"name":"transferToParticipantAmount","type":"uint256"},{"indexed":false,"name":"transferToProviderAmount","type":"uint256"}],"name":"ChannelSettled","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"balance","type":"int256"}],"name":"ProviderNewDeposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"balance","type":"int256"}],"name":"ProviderWithdraw","type":"event"}]`);
const pnList = [ ethPN ];

let pn: PN;
let channel: Channel;

if (typeof ethereum !== 'undefined') {
  ethereum.enable().catch(console.error);
  let user = web3.eth.accounts[0];
  // L2.getInstance().init(user, socketUrl, pnList, web3.currentProvider).catch(console.error);

  // let signer = new ethers.providers.Web3Provider(web3.currentProvider).getSigner();
  let signer = new ethers.providers.Web3Provider(ganache.provider()).getSigner();
  signer.signMessage('hello world').then(console.log);

  // pn_demo();
  // channel_demo();
  // puppet_demo();
}

async function pn_demo () {

  console.log('---PN Tests---\n');
  console.log(`\n1. get pn at address: ${ethPN.address}\n`);

  pn = new PN(ethPN.address, ethPN.abi);
  let status = await pn.syncWithContract();
  await pn.save()

  let localPN = db.pn.where('address').equals(ethPN.address);
  console.log(`pn saved in db: ${JSON.stringify(localPN)}`);

  console.log(`\n2. watch & handle contract events\n`);
  // TODO
}

async function channel_demo () {

  // generate new pn
  channel = new Channel(pn.address);
  await channel.sync();
  await channel.save()
}

async function puppet_demo() {
  let puppet = new Puppet();
  let password = puppet.address.slice(-8);

  let crypto = new SimpleCrypto(password);
  let privateKey = crypto.decrypt(puppet.key);
  console.log('decrypted private key: ', privateKey);
}