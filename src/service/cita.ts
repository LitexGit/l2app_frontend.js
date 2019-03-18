import { ethPN, appPN, user, callbacks, sendEthTx, getLCB, puppet, cita, web3_10, TRANSFER_EVENT } from '../main';
import { myEcsignToHex } from '../utils/common'

/**
 * the transaction options for submiting cita transaction 
 */
export const tx = {
  nonce: 999999,
  quota: 1000000,
  chainId: 1,
  version: 1,
  validUntilBlock: 999999,
  value: '0x0', 
}

/**
 * Handle events from cita payment contract, only filter current user related event
 */
export const events = {

  'ConfirmUserWithdraw': {
    filter: () => { return { user } },
    handler: async (event: any) => {

      let { returnValues: { channelID, user: eventUser, confirmer, amount, lastCommitBlock, isAllConfirmed }} = event;

      //If UserWithdraw Proposal not confirmed by both provider and regulator, ignore the event.
      if(!isAllConfirmed){
        return;
      }
      console.log("Receive ConfirmUserWithdraw event, will try to submit eth withdraw tx");

      // when both provider and regualtor confirmed UserWithdraw Proposal, user should submit eth tx to get his asset on chain
      await methods.ethSubmitUserWithdraw(channelID);

    }
  },

  'ConfirmCooperativeSettle': {
    filter: () => { return { user } },
    handler: async (event: any) => {
      let { returnValues: { channelID, user, confirmer, balance, lastCommitBlock: lcb, isAllConfirmed } } = event;

      //If CooperativeSettle Proposal not confirmed by both provider and regulator, ignore the event.
      if(!isAllConfirmed){
        return;
      }

      console.log("Receive ConfirmCooperativeSettle event, will try to submit eth withdraw tx");

      // when both provider and regualtor confirmed CooperativeSettle Proposal, user should submit eth tx to get his asset on chain
      await methods.ethSubmitCooperativeSettle(channelID);

    }
  }, 

  'Transfer': {
    filter: () => { return { to: user } },
    handler: async (event: any) => {

      // console.log("Transfer user is ", user);

      let {
        returnValues: {
          from,
          to,
          channelID,
          balance,
          // nonce,
          additionalHash
        }
      } = event;

      console.log("Receive Transfer event", event);


      // emit the Transfer event to sdk caller
      let {token} = await appPN.methods.channelMap(channelID).call();
      let amount = "";
      let transferEvent: TRANSFER_EVENT = { from, to, token, amount, additionalHash, totalTransferredAmount: balance };
      callbacks.get('Transfer') && callbacks.get('Transfer')(null, transferEvent);


      // automatically submit GuardProof for the received Transfer, to make sure user's proof can be submit when provider force-close channel and user is offline
      await appMethods.appSubmitGuardProof(channelID, to);
    
    }
  },

};

export const methods = {

  /**
   *  submit user withdraw tx to eth payment contract.
   *  1. find provider and regulator's confirmation from appchain
   *  2. embrace provider and regualtor's signature in the withdraw request to eth payment contract
   */
  ethSubmitUserWithdraw: async (channelID: string)=>{
    let { isConfirmed, amount: withdraw, providerSignature, regulatorSignature, lastCommitBlock, receiver, } = await appPN.methods.userWithdrawProofMap(channelID).call();

    if(!isConfirmed){
      console.log("userWithdrawProofMap not confirmed");
      return;
    }

    //TODO: check if lastCommitBlock is exceed, should unlock the proof on appchain


    let txData = ethPN.methods.userWithdraw(channelID, withdraw, lastCommitBlock, providerSignature, regulatorSignature, receiver).encodeABI();
    sendEthTx(user, ethPN.options.address, 0, txData);
  },

  /**
   *  submit cooperativeSettle tx to eth payment contract
   *  1. find provider and regulator's confirmation from appchain
   *  2. embrace provider and regualtor's signature in the cooperativeSettle request to eth payment contract
   */
  ethSubmitCooperativeSettle: async (channelID: string) => {
    let { isConfirmed, balance: settleBalance, lastCommitBlock, providerSignature, regulatorSignature, } = await appPN.methods.cooperativeSettleProofMap(channelID).call();

    if(!isConfirmed){
      console.log("cooperativeSettleProof not confirmed");
      return;
    }

    //TODO: check if lastCommitBlock is exceed, should unlock the proof on appchain

    let txData = ethPN.methods.cooperativeSettle(channelID, settleBalance, lastCommitBlock, providerSignature, regulatorSignature).encodeABI();
    sendEthTx(user, ethPN.options.address, 0, txData);
  }

}

export const appMethods = {

  /**
   * submit GuardProof tx to appchain payment contract
   * 1. find user's received Transfer from appchain
   * 2. sign the received Transfer
   * 3. Build tx request which including user's received Transfer & user's signature
   * 4. submit tx request to appchain payment contract
   *  
   */
  appSubmitGuardProof: async(channelID: string, to: string) => {

    let { balance, nonce, additionalHash, signature, consignorSignature } = await appPN.methods.balanceProofMap(channelID, to).call();


    console.log("balanceProof is", {balance, nonce, additionalHash, signature, consignorSignature});
    // check if user has uploaded his guard proof
    if (consignorSignature != null) {
      console.log("balance proof already signed now");
      return;
    }

    if(balance == '0'){
      console.log("no balance proof now");
      return;
    }


    // sign the received transfer
    let messageHash = web3_10.utils.soliditySha3(
      { t: 'address', v: ethPN.options.address },
      { t: 'bytes32', v: channelID },
      { t: 'uint256', v: balance },
      { t: 'uint256', v: nonce },
      { t: 'bytes32', v: additionalHash },
      { t: 'bytes', v: signature },
    );

    consignorSignature = myEcsignToHex(web3_10, messageHash, puppet.getAccount().privateKey);


    let appTx = {
      ...tx,
      validUntilBlock: await getLCB('cita'),
      from: user,
      privateKey: puppet.getAccount().privateKey
    }

    console.log("guardBalanceProof params", { channelID, balance, nonce, additionalHash, signature, consignorSignature });
    let res = await appPN.methods.guardBalanceProof(channelID, balance, nonce, additionalHash, signature, consignorSignature).send(appTx);

    // check the response
    if (res.hash) {
      let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
      if (receipt.errorMessage) {
        console.error('[CITA] - guardBalanceProof', receipt.errorMessage);
      }else{
        console.log("submit cita tx success")
      }
    }

  }

}

