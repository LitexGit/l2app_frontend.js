import { callbacks, user, PUPPETCHANGED_EVENT, DEPOSIT_EVENT, ethPN, WITHDRAW_EVENT, FORCEWITHDRAW_EVENT, appPN } from '../main';

export const events = {
  'PuppetAdded': {
    filter: () => { return { user } },
    handler: async(event: any) => {
      console.log("PuppetAdd event", event);

      let {returnValues: {user, puppet}} = event;
      let puppetChangeEvent: PUPPETCHANGED_EVENT = { user, puppet, type: 1 };
      callbacks.get('PuppetChanged') && callbacks.get('PuppetChanged')(null, puppetChangeEvent);
    }
  },

  'PuppetDisabled': {
    filter: () => { return { user } },
    handler: async(event: any) => {
      console.log("PuppetAdd event", event);

      let {returnValues: {user, puppet}} = event;
      let puppetChangeEvent: PUPPETCHANGED_EVENT = { user, puppet, type: 2 };
      callbacks.get('PuppetChanged') && callbacks.get('PuppetChanged')(null, puppetChangeEvent);
    }
  },

  'ChannelOpened': {
    filter: () => { return { user } },
    handler: async(event: any) => {
      console.log("ChannelOpened event", event);

      let {returnValues: {
        sender,
        user,
        token,
        puppet,
        amount,
        settleWindow,
        channelID
      }, transactionHash} = event;
      let depositEvent: DEPOSIT_EVENT = { user: user, type: 1, token, amount: amount, totalDeposit: amount, txhash: transactionHash };
      callbacks.get('Deposit') && callbacks.get('Deposit')(null, depositEvent);
    }

  }, 
  'UserNewDeposit': {
    filter: () => { return { user } },
    handler: async(event: any) => {
      console.log("UserNewDeposit event", event);

      let {returnValues: {
          channelID,
          user,
          newDeposit,
          totalDeposit
      }, transactionHash} = event;

      let {token } = await ethPN.methods.channels(channelID).call();

      let depositEvent: DEPOSIT_EVENT = { user: user, type: 2, token, amount: newDeposit, totalDeposit: totalDeposit, txhash: transactionHash };
      callbacks.get('Deposit') && callbacks.get('Deposit')(null, depositEvent);



    }
  },
  'UserWithdraw': {
    filter: () => { return { user } },
    handler: async(event: any) => {
      console.log("UserWithdraw event", event);

      
      let {returnValues: {
        channelID,
        user,
        amount,
        totalWithdraw,
        lastCommitBlock
      }, transactionHash} = event;

      let {token } = await ethPN.methods.channes(channelID).call();

      let withdrawEvent: WITHDRAW_EVENT = { user: user, type: 1, token, amount, totalWithdraw, txhash: transactionHash };
      callbacks.get('Withdraw') && callbacks.get('Withdraw')(null, withdrawEvent);

    }
  }, 

  'CooperativeSettled': {
    filter: () => { return { user } },
    handler: async(event: any) => {
      console.log("CooperativeSettled event", event);

      let { returnValues: { channelID, user, token, balance, lastCommitBlock } , transactionHash} = event;
      let withdrawEvent: WITHDRAW_EVENT = {user: user, type: 2, token, amount: balance, totalWithdraw: '', txhash: transactionHash };
      callbacks.get('Withdraw') && callbacks.get('Withdraw')(null, withdrawEvent);
    }
  }, 
  'ChannelClosed': {
    filter: () => { return { user } },
    handler: async(event: any) => {
      console.log("ChannelClosed event", event);
    }
  }, 
  'ChannelSettled': {
    filter: () => { return { user } },
    handler: async (event: any) => {

      console.log("ChannelSettled event", event);

      let {returnValues: {
          channelID,
          user,
          token,
          transferTouserAmount,
          transferToProviderAmount
      }, transactionHash} = event;

      let { closer } = await appPN.methods.closingChannelMap(channelID).call();
      let forceWithdrawEvent: FORCEWITHDRAW_EVENT = { closer, token, userSettleAmount: transferTouserAmount, providerSettleAmount: transferToProviderAmount, txhash: transactionHash };
      callbacks.get('ForceWithdraw') && callbacks.get('ForceWithdraw')(null, forceWithdrawEvent);

    }
  },

}