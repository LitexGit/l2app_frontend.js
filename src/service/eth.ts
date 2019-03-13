import { callbacks, user } from '../main';

export const events = {
  'PuppetAdded': {
    filter: {},
    handler: async(event: any) => {
      console.log("PuppetAdd event", event);
    }
  },
  'ChannelOpened': {
    filter: {},
    handler: async(event: any) => {
      console.log("ChannelOpened event", event);
    }
  }, 
  'UserNewDeposit': {
    filter: {},
    handler: async(event: any) => {
      console.log("UserNewDeposit event", event);
    }
  },
  'UserWithdraw': {
    filter: {},
    handler: async(event: any) => {
      console.log("UserWithdraw event", event);
    }
  }, 

  'CooperativeSettled': {
    filter: {},
    handler: async(event: any) => {
      console.log("CooperativeSettled event", event);
    }
  }, 
  'ChannelClosed': {
    filter: {},
    handler: async(event: any) => {
      console.log("CooperativeSettled event", event);
    }
  }, 
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