import { callbacks, user } from '../main';

export const events = {
  'ChannelSettled': {
    filter: { user },
    handler: async (channelID: string) => {
      callbacks.get('ForceWithdraw')(null, {
        ok: true,
        channelID
      });
    }
  },
}