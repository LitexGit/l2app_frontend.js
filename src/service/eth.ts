import { user } from '../main';

export const events = {
  PuppetAdded: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      // console.log('PuppetAdd event', event);
    },
  },

  PuppetDisabled: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      // console.log('PuppetDisabled event', event);
    },
  },

  ChannelOpened: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      // console.log('ChannelOpened event', event);
    },
  },
  UserNewDeposit: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      // console.log('UserNewDeposit event', event);
    },
  },
  UserWithdraw: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      // console.log('UserWithdraw event', event);
    },
  },

  CooperativeSettled: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      // console.log('CooperativeSettled event', event);
    },
  },
  ChannelClosed: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      // console.log('ChannelClosed event', event);
    },
  },
  ChannelSettled: {
    filter: () => {
      return { user };
    },
    handler: async (event: any) => {
      // console.log('ChannelSettled event', event);
    },
  },
};
