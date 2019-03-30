import { ethPN, appPN, user, callbacks, puppet, cita, web3_10 } from '../main';
import { myEcsignToHex, sendEthTx, getLCB, delay } from '../utils/common';
import {
  TRANSFER_EVENT,
  CITA_TX_BLOCK_INTERVAL,
  PUPPETCHANGED_EVENT,
  DEPOSIT_EVENT,
  WITHDRAW_EVENT,
  FORCEWITHDRAW_EVENT,
} from '../utils/constants';

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
};

/**
 * build the valid tx options for submiting cita transaction
 */
export async function getAppTxOption() {
  return {
    ...tx,
    validUntilBlock: await getLCB(cita.base, 'cita'),
    from: puppet.getAccount().address,
    privateKey: puppet.getAccount().privateKey,
  };
}

/**
 * Handle events from cita payment contract, only filter current user related event
 */
export const events = {
  ConfirmUserWithdraw: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      console.log(
        '--------------------Handle CITA ConfirmUserWithdraw--------------------'
      );
      let {
        returnValues: {
          channelID,
          user,
          confirmer,
          amount,
          lastCommitBlock,
          isAllConfirmed,
          providerSignature,
          regulatorSignature,
        },
        transactionHash,
      } = event;

      console.log(
        ' channelID: [%s], user: [%s], confirmer: [%s], amount: [%s], lastCommitBlock: [%s], isAllConfirmed: [%s], providerSignature: [%s], regulatorSignature: [%s]',
        channelID,
        user,
        confirmer,
        amount,
        lastCommitBlock,
        isAllConfirmed,
        providerSignature,
        regulatorSignature
      );

      // if UserWithdraw Proposal not confirmed by both provider and regulator, ignore the event.
      if (isAllConfirmed === false) {
        return;
      }
      console.log(
        'Receive ConfirmUserWithdraw event, will try to submit eth withdraw tx %s',
        transactionHash
      );

      let txData = ethPN.methods
        .userWithdraw(
          channelID,
          amount,
          lastCommitBlock,
          providerSignature,
          regulatorSignature,
          user
        )
        .encodeABI();
      sendEthTx(web3_10, user, ethPN.options.address, 0, txData);
    },
  },

  ConfirmCooperativeSettle: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      console.log(
        '--------------------Handle CITA ConfirmCooperativeSettle--------------------'
      );
      let {
        returnValues: {
          channelID,
          user,
          confirmer,
          balance,
          lastCommitBlock,
          isAllConfirmed,
          providerSignature,
          regulatorSignature,
        },
        transactionHash,
      } = event;

      console.log(
        ' channelID: [%s], user: [%s], confirmer: [%s], balance: [%s], lastCommitBlock: [%s], isAllConfirmed: [%s], providerSignature: [%s], regulatorSignature: [%s] ',
        channelID,
        user,
        confirmer,
        balance,
        lastCommitBlock,
        isAllConfirmed,
        providerSignature,
        regulatorSignature
      );

      // if CooperativeSettle Proposal not confirmed by both provider and regulator, ignore the event.
      if (isAllConfirmed === false) {
        return;
      }

      console.log(
        'Receive ConfirmCooperativeSettle event, will try to submit eth settle tx %s',
        transactionHash
      );
      let txData = ethPN.methods
        .cooperativeSettle(
          channelID,
          balance,
          lastCommitBlock,
          providerSignature,
          regulatorSignature
        )
        .encodeABI();
      let res = await sendEthTx(
        web3_10,
        user,
        ethPN.options.address,
        0,
        txData
      );
      return;
    },
  },

  Transfer: {
    filter: () => {
      return { to: user };
    },
    handler: async (event: any) => {
      console.log(
        '--------------------Handle CITA Transfer--------------------'
      );
      let {
        returnValues: {
          from,
          to,
          channelID,
          balance,
          transferAmount,
          additionalHash,
        },
      } = event;

      console.log(
        ' from: [%s], to: [%s], channelID: [%s], balance: [%s], transferAmount: [%s], additionalHash: [%s] ',
        from,
        to,
        channelID,
        balance,
        transferAmount,
        additionalHash
      );

      // emit the Transfer event to sdk caller
      if (
        callbacks.get('Transfer') &&
        additionalHash ===
          '0x0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        let { token } = await appPN.methods.channelMap(channelID).call();
        let amount = transferAmount;
        let transferEvent: TRANSFER_EVENT = {
          from,
          to,
          token,
          amount,
          additionalHash,
          totalTransferredAmount: balance,
        };
        callbacks.get('Transfer')(null, transferEvent);
      }

      // automatically submit GuardProof for the received Transfer, to make sure user's proof can be submit when provider force-close channel and user is offline
      await delay(CITA_TX_BLOCK_INTERVAL * 2);
      await appMethods.appSubmitGuardProof(channelID, to);
    },
  },
  /****************************onchain Event(operator emit)************************************/
  OnchainAddPuppet: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      console.log(
        '--------------------Handle CITA OnchainAddPuppet--------------------'
      );
      let {
        returnValues: { user, puppet },
      } = event;
      console.log('user: [%s], puppet: [%s]', user, puppet);
      let puppetChangeEvent: PUPPETCHANGED_EVENT = { user, puppet, type: 1 };
      callbacks.get('PuppetChanged') &&
        callbacks.get('PuppetChanged')(null, puppetChangeEvent);
    },
  },
  OnchainDisablePuppet: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      console.log(
        '--------------------Handle CITA OnchainDisablePuppet--------------------'
      );
      let {
        returnValues: { user, puppet },
      } = event;
      console.log('user: [%s], puppet: [%s]', user, puppet);
      let puppetChangeEvent: PUPPETCHANGED_EVENT = { user, puppet, type: 2 };
      callbacks.get('PuppetChanged') &&
        callbacks.get('PuppetChanged')(null, puppetChangeEvent);
    },
  },
  OnchainOpenChannel: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      console.log(
        '--------------------Handle CITA OnchainOpenChannel--------------------'
      );
      let {
        returnValues: { user, token, amount, channelID },
        transactionHash,
      } = event;
      console.log(
        ' user: [%s], token: [%s], amount: [%s], channelID: [%s] ',
        user,
        token,
        amount,
        channelID
      );
      let depositEvent: DEPOSIT_EVENT = {
        user: user,
        type: 1,
        token,
        amount: amount,
        totalDeposit: amount,
        txhash: transactionHash,
      };
      callbacks.get('Deposit') && callbacks.get('Deposit')(null, depositEvent);
    },
  },
  OnchainUserDeposit: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      console.log(
        '--------------------Handle CITA OnchainUserDeposit--------------------'
      );
      let {
        returnValues: { channelID, user, deposit, totalDeposit },
        transactionHash,
      } = event;

      console.log(
        ' channelID: [%s], user: [%s], deposit: [%s], totalDeposit: [%s] ',
        channelID,
        user,
        deposit,
        totalDeposit
      );

      let { token } = await ethPN.methods.channels(channelID).call();

      let depositEvent: DEPOSIT_EVENT = {
        user: user,
        type: 2,
        token,
        amount: deposit,
        totalDeposit,
        txhash: transactionHash,
      };
      callbacks.get('Deposit') && callbacks.get('Deposit')(null, depositEvent);
    },
  },
  OnchainUserWithdraw: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      console.log(
        '--------------------Handle CITA OnchainUserWithdraw--------------------'
      );
      let {
        returnValues: {
          channelID,
          user,
          amount,
          withdraw: totalWithdraw,
          lastCommitBlock,
        },
        transactionHash,
      } = event;

      console.log(
        ' channelID: [%s], user: [%s], amount: [%s], totalWithdraw: [%s], lastCommitBlock: [%s], ',
        channelID,
        user,
        amount,
        totalWithdraw,
        lastCommitBlock
      );

      let { token } = await ethPN.methods.channels(channelID).call();

      let withdrawEvent: WITHDRAW_EVENT = {
        user: user,
        type: 1,
        token,
        amount,
        totalWithdraw,
        txhash: transactionHash,
      };
      callbacks.get('Withdraw') &&
        callbacks.get('Withdraw')(null, withdrawEvent);
    },
  },
  OnchainCooperativeSettleChannel: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      console.log(
        '--------------------Handle CITA OnchainCooperativeSettleChannel--------------------'
      );
      let {
        returnValues: { channelID, user, token, balance, lastCommitBlock },
        transactionHash,
      } = event;
      console.log(
        ' channelID: [%s], user: [%s], token: [%s], balance: [%s], lastCommitBlock: [%s] ',
        channelID,
        user,
        token,
        balance,
        lastCommitBlock
      );
      let withdrawEvent: WITHDRAW_EVENT = {
        user: user,
        type: 2,
        token,
        amount: balance,
        totalWithdraw: '',
        txhash: transactionHash,
      };
      callbacks.get('Withdraw') &&
        callbacks.get('Withdraw')(null, withdrawEvent);
    },
  },
  OnchainSettleChannel: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      console.log(
        '--------------------Handle CITA OnchainSettleChannel--------------------'
      );
      let {
        returnValues: {
          channelID,
          user,
          token,
          userSettleAmount: transferTouserAmount,
          providerSettleAmount: transferToProviderAmount,
        },
        transactionHash,
      } = event;
      console.log(
        ' channelID: [%s], user: [%s], token: [%s], transferTouserAmount: [%s], transferToProviderAmount: [%s], ',
        channelID,
        user,
        token,
        transferTouserAmount,
        transferToProviderAmount
      );

      let { closer } = await appPN.methods.closingChannelMap(channelID).call();
      let forceWithdrawEvent: FORCEWITHDRAW_EVENT = {
        closer,
        token,
        userSettleAmount: transferTouserAmount,
        providerSettleAmount: transferToProviderAmount,
        txhash: transactionHash,
      };
      callbacks.get('ForceWithdraw') &&
        callbacks.get('ForceWithdraw')(null, forceWithdrawEvent);
    },
  },
};

export const ethMethods = {
  /**
   *  submit user withdraw tx to eth payment contract.
   *  1. find provider and regulator's confirmation from appchain
   *  2. embrace provider and regualtor's signature in the withdraw request to eth payment contract
   */
  ethSubmitUserWithdraw: async (channelID: string, duration: number = 0) => {
    await delay(duration);

    let [
      {
        isConfirmed,
        amount: withdraw,
        providerSignature,
        regulatorSignature,
        lastCommitBlock,
        receiver,
      },
    ] = await Promise.all([
      appPN.methods.userWithdrawProofMap(channelID).call(),
    ]);

    console.log(
      'userWithdrawProofMap: isConfirmed: [%s], withdraw: [%s], providerSignature: [%s], regulatorSignature: [%s], lastCommitBlock: [%s], receiver: [%s]',
      isConfirmed,
      withdraw,
      providerSignature,
      regulatorSignature,
      lastCommitBlock,
      receiver
    );
    if (!isConfirmed) {
      console.log('userWithdrawProofMap not confirmed');
      return;
    }

    let currentBlockNumber = await web3_10.eth.getBlockNumber();
    if (
      web3_10.utils
        .toBN(currentBlockNumber)
        .gt(web3_10.utils.toBN(lastCommitBlock))
    ) {
      console.log('unlock user withdraw now');
      let tx = await getAppTxOption();
      let res = await appPN.methods.unlockUserWithdrawProof(channelID).send(tx);
    } else {
      console.log('submit user withdraw now');
      // TODO: check the eth tx has been submited before
      let txData = ethPN.methods
        .userWithdraw(
          channelID,
          withdraw,
          lastCommitBlock,
          providerSignature,
          regulatorSignature,
          receiver
        )
        .encodeABI();
      sendEthTx(web3_10, user, ethPN.options.address, 0, txData);
    }
  },

  /**
   *  submit cooperativeSettle tx to eth payment contract
   *  1. find provider and regulator's confirmation from appchain
   *  2. embrace provider and regualtor's signature in the cooperativeSettle request to eth payment contract
   */
  ethSubmitCooperativeSettle: async (channelID: string): Promise<string> => {
    let {
      isConfirmed,
      balance: settleBalance,
      lastCommitBlock,
      providerSignature,
      regulatorSignature,
    } = await appPN.methods.cooperativeSettleProofMap(channelID).call();

    console.log(
      'cooperativeSettleProof: channelID: [%s], isConfirmed: [%s], balance: [%s], lastCommitBlock: [%s], providerSignature: [%s], regulatorSignature: [%s]',
      channelID,
      isConfirmed,
      settleBalance,
      lastCommitBlock,
      providerSignature,
      regulatorSignature
    );

    if (!isConfirmed) {
      console.log('cooperativeSettleProof not confirmed');
      return null;
    }

    let currentBlockNumber = await web3_10.eth.getBlockNumber();
    if (
      web3_10.utils
        .toBN(currentBlockNumber)
        .gt(web3_10.utils.toBN(lastCommitBlock))
    ) {
      let tx = await getAppTxOption();
      let res = await appPN.methods.unlockCooperativeSettle(channelID).send(tx);
      return res;
    } else {
      // TODO: check the eth tx has been submited before
      let txData = ethPN.methods
        .cooperativeSettle(
          channelID,
          settleBalance,
          lastCommitBlock,
          providerSignature,
          regulatorSignature
        )
        .encodeABI();
      let res = await sendEthTx(
        web3_10,
        user,
        ethPN.options.address,
        0,
        txData
      );
      return res;
    }
  },

  ethSettleChannel: async (channelID: string) => {
    let txData = ethPN.methods.settleChannel(channelID).encodeABI();
    sendEthTx(web3_10, user, ethPN.options.address, 0, txData);
  },
};

export const appMethods = {
  /**
   * submit GuardProof tx to appchain payment contract
   * 1. find user's received Transfer from appchain
   * 2. sign the received Transfer
   * 3. Build tx request which including user's received Transfer & user's signature
   * 4. submit tx request to appchain payment contract
   *
   */
  appSubmitGuardProof: async (channelID: string, to: string) => {
    let {
      balance,
      nonce,
      additionalHash,
      signature,
      consignorSignature,
    } = await appPN.methods.balanceProofMap(channelID, to).call();

    console.log(
      'balanceProof:  balance: [%s], nonce: [%s], additionalHash: [%s], signature: [%s], consignorSignature: [%s]',
      balance,
      nonce,
      additionalHash,
      signature,
      consignorSignature
    );
    // check if user has uploaded his guard proof
    if (consignorSignature != null) {
      console.log('balance proof already signed now');
      return;
    }

    if (balance === '0') {
      console.log('no balance proof now');
      return;
    }

    // sign the received transfer
    let messageHash = web3_10.utils.soliditySha3(
      { t: 'address', v: ethPN.options.address },
      { t: 'bytes32', v: channelID },
      { t: 'uint256', v: balance },
      { t: 'uint256', v: nonce },
      { t: 'bytes32', v: additionalHash },
      { t: 'bytes', v: signature }
    );

    consignorSignature = myEcsignToHex(
      web3_10,
      messageHash,
      puppet.getAccount().privateKey
    );

    let appTx = await getAppTxOption();

    console.log(
      'guardBalanceProof params: channelID: [%s], balance: [%s], nonce: [%s], additionalHash: [%s], signature: [%s], consignorSignature: [%s]',
      channelID,
      balance,
      nonce,
      additionalHash,
      signature,
      consignorSignature
    );
    let res = await appPN.methods
      .guardBalanceProof(
        channelID,
        balance,
        nonce,
        additionalHash,
        signature,
        consignorSignature
      )
      .send(appTx);

    // check the response
    if (res.hash) {
      let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
      if (receipt.errorMessage) {
        console.error('[CITA] - guardBalanceProof', receipt.errorMessage);
      } else {
        console.log('submit cita tx success');
      }
    }
  },
};
