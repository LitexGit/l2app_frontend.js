import L2Session from '../session';
import { cp, appPN, callbacks } from '../main';
import { SESSION_STATUS } from '../utils/constants';

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
      console.log(
        '--------------------Handle CITA SendMessage--------------------'
      );
      let {
        returnValues: {
          from,
          to,
          sessionID,
          mType: type,
          content,
          channelID,
          balance,
          nonce,
          amount,
        },
        transactionHash,
      } = event;

      console.log(
        ' from: [%s], to: [%s], sessionID: [%s], type: [%s], content: [%s], channelID: [%s], balance: [%s], nonce: [%s], amount: [%s] ',
        from,
        to,
        sessionID,
        type,
        content,
        channelID,
        balance,
        nonce,
        amount
      );
      let session = await L2Session.getSessionById(sessionID, false);
      if (!session) {
        return;
      }
      let { token } = await appPN.methods.channelMap(channelID).call();

      session.callbacks.get('message') &&
        session.callbacks.get('message')(null, {
          from,
          to,
          sessionID,
          type,
          content,
          amount,
          token,
        });

      callbacks.get('SessionMessage') &&
        callbacks.get('SessionMessage')(null, {
          session,
          from,
          to,
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
      console.log(
        '--------------------Handle CITA CloseSession--------------------'
      );
      let {
        returnValues: { sessionID },
      } = event;
      console.log('sessionID', sessionID);

      let session = await L2Session.getSessionById(sessionID, false);
      if (!session) {
        return;
      }

      session.status = SESSION_STATUS.SESSION_STATUS_CLOSE;

      session.callbacks.get('close') &&
        session.callbacks.get('close')(null, {});

      callbacks.get('SessionClose') &&
        callbacks.get('SessionClose')(null, { session });
    },
  },
};
