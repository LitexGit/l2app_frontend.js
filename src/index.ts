import { L2 } from './L2';
import { DEPOSIT_EVENT, WITHDRAW_EVENT, PUPPETCHANGED_EVENT, FORCEWITHDRAW_EVENT, TRANSFER_EVENT } from './utils/constants';


console.log('See this in your browser console: Typescript Webpack Starter Launched');

const socketUrl = 'localhost';
// const ethPN: PN = {address: '0x119dc8Dae6C2EB015F108bF80d81f294D0711A14', abi: JSON.stringify(require('./config/onchainPayment.json'))};
// const appPN: PN = {address: '0x0a95fF901dc4206Ac4a67E827436790A0A0cF36a', abi: JSON.stringify(require('./config/offchainPayment.json'))};

const ethPNAddress = '0x6a927622FaFDAbd3179FE7E665298B7Ec4CA3FA9';
const appPNAddress = '0x7853b321868cdD4cd5180595573262F7CcfA828E';

let appRpcUrl = "http://wallet.milewan.com:8090";
// let appRpcUrl = "https://node.cryptape.com";

// let token = "0x0000000000000000000000000000000000000000";
let token = "0x605a409Dc63cFd7e35ef7cb2d2cab8B66b136928";

var defaultAccount = "";
window.addEventListener('load', async () => {
  await main();
});

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
      let res = await L2.getInstance().init(defaultAccount, window.web3, ethPNAddress, appRpcUrl, appPNAddress);
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
}

async function refresh() {

  document.getElementById("info").innerHTML = "Loading...";
  let balance = await L2.getInstance().getChannelInfo(token);

  document.getElementById("info").innerHTML = "<br>Address: " + defaultAccount + "</br>";
  document.getElementById("info").innerHTML += "<br>channel Balance: " + JSON.stringify(balance) + "</br>";
}