import L2Session from '../session';
import { cp, cita, web3_10, appPN } from '../main';
import { ADDRESS_ZERO } from '../utils/constants';
import { extractEventFromReceipt } from '../utils/common';

export const events = {
  // 'InitSession': {
  //     filter: () => { return {} },
  //     handler: async (event: any) => {
  //     }
  // },
  // 'JoinSession': {
  //     filter: () => { return {} },
  //     handler: async (event: any) => {
  //     }
  // },
  SendMessage: {
    filter: () => {
      return { from: cp };
    },
    handler: async (event: any) => {
      console.log('SendMessage event', event);
      // return;

      let {
        returnValues: {
          from,
          to,
          sessionID: sessionId,
          mType: type,
          content,
          channelID,
          balance,
          nonce,
        },
        transactionHash,
      } = event;
      let session = await L2Session.getSessionById(sessionId, false);
      if (!session) {
        return;
      }

      let amount = '0';
      let token = ADDRESS_ZERO;

      if (Number(balance) !== 0 && Number(nonce) !== 0) {
        // fetch token&amount from transaction receipt log
        let receipt = await cita.listeners.listenToTransactionReceipt(
          transactionHash
        );
        let transferEvent = extractEventFromReceipt(
          web3_10,
          receipt,
          appPN,
          'Transfer'
        );

        let channel = await appPN.methods
          .channelMap(transferEvent.channelID)
          .call();
        token = channel.token;
        amount = transferEvent.transferAmount;
      }

      // console.log("session callbacks", session.callbacks.get("message"));

      session.callbacks.get('message') &&
        session.callbacks.get('message')(null, {
          from,
          to,
          sessionId,
          type,
          content,
          amount,
          token,
        });
    },
  },
  CloseSession: {
    filter: () => {
      return {};
    },
    handler: async (event: any) => {
      let {
        returnValues: { sessionID: sessionId },
      } = event;

      let session = await L2Session.getSessionById(sessionId, false);
      if (!session) {
        return;
      }

      session.callbacks.get('close') &&
        session.callbacks.get('close')(null, {});
    },
  },
};
