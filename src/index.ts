import { L2 } from './L2';
import { DEPOSIT_EVENT, WITHDRAW_EVENT, PUPPETCHANGED_EVENT, FORCEWITHDRAW_EVENT, TRANSFER_EVENT } from './utils/constants';
import L2Session from './session';
import { cp } from './main';


console.log('See this in your browser console: Typescript Webpack Starter Launched');

const socketUrl = 'localhost';
// const ethPN: PN = {address: '0x119dc8Dae6C2EB015F108bF80d81f294D0711A14', abi: JSON.stringify(require('./config/onchainPayment.json'))};
// const appPN: PN = {address: '0x0a95fF901dc4206Ac4a67E827436790A0A0cF36a', abi: JSON.stringify(require('./config/offchainPayment.json'))};

const ethPNAddress = '0xA522665CEf690221850264696a02d4D785F9ba8A';
const appPNAddress = '0x9324C590040b140def29d8968Ea6c40b53F25C9c';
const appSessionAddress = '0x322628380Ee3BbC82bdB1c5683AD4B074b63A84E';

let appRpcUrl = "http://wallet.milewan.com:8090";
// let appRpcUrl = "https://node.cryptape.com";

// let token = "0x0000000000000000000000000000000000000000";
let token = "0x605a409Dc63cFd7e35ef7cb2d2cab8B66b136928";

var defaultAccount = "";
window.addEventListener('load', async () => {
  await main();
});

let sessionId = "";
let session: L2Session;


async function  main() {

  if (typeof window.ethereum !== 'undefined') {
    // window.web3 = new Web3(ethereum);
    try {
      console.log("start enable");
      window.web3 = new Web3(ethereum);
      await window.ethereum.enable();
      defaultAccount = ethereum.selectedAddress;

    } catch (error) {
      console.log(error);
    }
  } else if (window.web3) {
    window.web3 = new Web3(web3.currentProvider);
    var accounts = await web3.eth.getAccounts();
    defaultAccount = accounts[0];

  } else {
    return;
  }


    document.getElementById("refresh").addEventListener("click", async (event)=>{
      console.log("refresh clicked");
      refresh();
    });

    L2.getInstance().on('Deposit', (err: any, res: DEPOSIT_EVENT)=>{
      console.log("Deposit from L2", err, res);
      refresh();
    });

    L2.getInstance().on('Withdraw', (err: any, res: WITHDRAW_EVENT)=>{
      console.log("Withdraw from L2", err, res);
      refresh();
    });

    L2.getInstance().on('PuppetChanged', (err: any, res:PUPPETCHANGED_EVENT )=>{
      console.log("PuppetChanged from L2", err, res);
      refresh();
    });

    L2.getInstance().on('ForceWithdraw', (err: any, res: FORCEWITHDRAW_EVENT)=>{
      console.log("ForceWithdraw from L2", err, res);
      refresh();
    });

    L2.getInstance().on('Transfer', (err: any, res: TRANSFER_EVENT)=>{
      console.log("Transfer from L2", err, res);
      refresh();
    });


    document.getElementById("init").addEventListener("click", async (event)=>{
      console.log("init button clicked");
      let res = await L2.getInstance().init(defaultAccount, window.web3, ethPNAddress, appRpcUrl, appPNAddress, appSessionAddress);
      console.log("int res ", res);
      console.log("web3 version", web3.version);
    });

    document.getElementById("deposit").addEventListener("click", async (event)=>{
      console.log("deposit button clicked");
      let res = await L2.getInstance().deposit(1e16 + '', token);
      console.log("deposit res ", res);
    });

    document.getElementById("withdraw").addEventListener("click", async (event)=>{
      console.log("withdraw button clicked");
      let res = await L2.getInstance().withdraw(1e15+"", token);
      console.log("withdraw res ", res);
    });

    document.getElementById("withdraw2").addEventListener("click", async (event)=>{
      console.log("withdraw button clicked");
      let res = await L2.getInstance().testUnlockWithdraw(token);
      console.log("withdraw res ", res);
    });

    document.getElementById("coclose").addEventListener("click", async (event)=>{
      console.log("coclose button clicked");
      let channel = await L2.getInstance().getChannelInfo(token);
      console.log('channel is ', channel);

      let balance = await L2.getInstance().getBalance(token);
      console.log("balance is", balance);
      let res = L2.getInstance().withdraw(balance, token);
      console.log("coclose res", res);

    });

    document.getElementById("coclose2").addEventListener("click", async (event)=>{
      console.log("coclose2 button clicked");
      let res = await L2.getInstance().testCoClose(token);
    });

    document.getElementById("forceClose").addEventListener("click", async (event)=>{
      console.log("forceClose button clicked");
      let res = await L2.getInstance().forceWithdraw(token);
      console.log("forcewithdraw res", res);
    });

    document.getElementById("settle").addEventListener("click", async (event)=>{
      console.log("settle button clicked");
      let res = await L2.getInstance().testSettle(token);
      console.log("settle res", res);
    });

    document.getElementById("transfer").addEventListener("click", async (event)=>{
      console.log("transfer button clicked");
      let res = await L2.getInstance().transfer("0xa08105d7650Fe007978a291CcFECbB321fC21ffe", 1e15+"", token);
      console.log("transfer res", res);
      refresh();

      var msg = '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0'
      var from = defaultAccount;
    });

    document.getElementById("guardTransfer").addEventListener("click", async (event)=>{
      console.log("guardTransfer button clicked");
      let res = await L2.getInstance().testGuardProof();
      console.log("guardproof res ", res);
    });

    document.getElementById("getAllTxs").addEventListener("click", async (event)=>{
      console.log("getAllTxs button clicked");
      let result = await L2.getInstance().getAllTXs(token);
      console.log('getAllTxs result', result);
    });

    document.getElementById("getAllPuppets").addEventListener("click", async (event)=>{
      console.log("getAllPuppets button clicked");
      let result = await L2.getInstance().getAllPuppets();
      console.log('getAllPuppets result', result);
    });

    document.getElementById("disablePuppet").addEventListener("click", async (event)=>{
      console.log("disablePuppet button clicked");

      let puppetList = await L2.getInstance().getAllPuppets();

      if (puppetList.length > 0) {
        let hash = await L2.getInstance().disablePuppet(puppetList[0].address);
        console.log('disablePuppet result', hash);

      }else{
        console.log("no puppet now");
      }
    });

    document.getElementById("createSession").addEventListener("click", async (event)=>{
      console.log("createSession button clicked");

      sessionId = window.web3.sha3("hello world" + new Date().getTime());
      console.log("sessionId is", sessionId);

      let result = await L2.getInstance().testCreateSession(sessionId, token, "hello my dear");

      console.log('createSession result', result);
    });

    document.getElementById("startSession").addEventListener("click", async (event)=>{
      console.log("startSession button clicked");
      session = await L2.getInstance().startSession(sessionId);
      console.log('startSession result', session);


      session.onMessage((error: Error, res: any) => {
        console.log("Watch session message------", res);
      });

      session.onSessionClose((error: Error, res: any) => {
        console.log("Watch session closed------", res)
      });

    });

    document.getElementById("sendMessage").addEventListener("click", async (event)=>{
      console.log("sendMessage button clicked");

      let result = await session.sendMessage(cp, 'one', window.web3.toHex("you know what I say"));

      console.log('sendMessage result', result);
    });

    document.getElementById("sendMessageWithAsset").addEventListener("click", async (event)=>{
      console.log("sendMessageWithAsset button clicked");
      let result = await L2.getInstance().getAllPuppets();
      console.log('sendMessageWithAsset result', result);
    });

    document.getElementById("closeSession").addEventListener("click", async (event)=>{
      console.log("closeSession button clicked");
      let result = await L2.getInstance().testCloseSession(sessionId);
      console.log('closeSession result', result);
    });

    document.getElementById("getSessionPlayers").addEventListener("click", async (event)=>{
      console.log("getSessionPlayers button clicked");
      let result = await L2.getInstance().getPlayersBySessionId(sessionId);
      console.log('getSessionPlayers result', result);
    });

    document.getElementById("getSessionMessages").addEventListener("click", async (event)=>{
      console.log("getSessionMessages button clicked");
      let result = await L2.getInstance().getMessagesBySessionId(sessionId);
      console.log('getSessionMessages result', result);
    });
}

async function refresh() {

  document.getElementById("info").innerHTML = "Loading...";
  let balance = await L2.getInstance().getChannelInfo(token);

  document.getElementById("info").innerHTML = "<br>Address: " + defaultAccount + "</br>";
  document.getElementById("info").innerHTML += "<br>channel Balance: " + JSON.stringify(balance) + "</br>";
}