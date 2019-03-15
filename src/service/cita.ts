import { ethPN, appPN, user, callbacks, sendEthTx, getLCB, puppet, cita, web3_10, TRANSFER_EVENT } from '../main';
import { myEcsignToHex } from '../utils/common'

export const tx = {
  nonce: 999999,
  quota: 1000000,
  chainId: 1,
  version: 1,
  validUntilBlock: 999999,
  value: '0x0', 
}

export const events = {
  'ConfirmUserWithdraw': {
    filter: { user },
    handler: async (event: any) => {

      let { returnValues: { channelID, user: eventUser, confirmer, amount, lastCommitBlock, isAllConfirmed }} = event;

      if(!isAllConfirmed){
        return;
      }
      console.log("Receive ConfirmUserWithdraw event, will try to submit eth withdraw tx");

      await methods.ethSubmitUserWithdraw(channelID);

    }
  },

  'ConfirmCooperativeSettle': {
    filter: {user},
    handler: async (event: any) => {
      let { returnValues: { channelID, user, confirmer, balance, lastCommitBlock: lcb, isAllConfirmed } } = event;

      if(!isAllConfirmed){
        return;
      }

      console.log("Receive ConfirmCooperativeSettle event, will try to submit eth withdraw tx");

      await methods.ethSubmitCooperativeSettle(channelID);

    }
  }, 

  'Transfer': {
    filter: { to: user },
    handler: async (event: any) => {

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


      let {token} = await appPN.methods.channelMap(channelID).call();

      let amount = "";

    
      let tranferEvent: TRANSFER_EVENT = { from, to, token, amount, additionalHash, totalTransferredAmount: balance };


      await appMethods.appSubmitGuardProof(channelID, to);
    
    }
  },


};

export const methods = {

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

  appSubmitGuardProof: async(channelID: string, to: string) => {

    let { balance, nonce, additionalHash, signature, consignorSignature } = await appPN.methods.balanceProofMap(channelID, to).call();

    if (consignorSignature != '') {
      console.log("balance proof already signed now");
      return;
    }

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

