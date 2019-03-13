import { ethPN, appPN, user, callbacks } from '../main';

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
    handler: async (id: string) => {
      let {
        user, amount: withdraw, ...withdrawRequest
      } = await appPN.methods.userWithdrawProofMap(id).call();

      ethPN.methods.userWithdraw({ ...withdrawRequest, withdraw }).send()
        .once('receipt', (receipt: any) => {
          callbacks.get('Withdraw')(null, {
            ok: true
          });
        })
        .on('error', (err: any, receipt: any) => {
          callbacks.get('Withdraw')(err, null);
          // TODO need destruct err object ?
        });
    }
  },

  'Transfer': {
    filter: { to: user },
    handler: async () => {
      callbacks.get('Transfer')(null, {
        ok: true
      });
    }
  },

  'ConfirmCooperativeSettle': {
    filter: {user},
    handler: async (event: any) => {

    }
  }, 


};

function getProofID(): string {
  // TODO
  return '';
}
