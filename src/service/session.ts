import L2Session from '../session';
import { cp, appPN } from '../main';

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

      session.callbacks.get('close') &&
        session.callbacks.get('close')(null, {});
    },
  },
};
