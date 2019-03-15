import { L2, PN } from './L2';
import { l2 } from './main';


console.log('See this in your browser console: Typescript Webpack Starter Launched');

const socketUrl = 'localhost';
const ethPN: PN = {address: '0xf211887E769E49a2df5E2a3900d949CfF0e0d737', abi: JSON.stringify(require('./config/onchainPayment.json'))};
const appPN: PN = {address: '0x565235C593b791D1D1E072cD6CE20F5A4D2fb67B', abi: JSON.stringify(require('./config/offchainPayment.json'))};

let appRpcUrl = "http://wallet.milewan.com:8090";


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



    // let appRpcUrl = "https://node.cryptape.com";


    document.getElementById("refresh").addEventListener("click", async (event)=>{
      console.log("refresh clicked");
      document.getElementById("info").innerHTML = "Loading...";
      let balance = await L2.getInstance().getChannelInfo();

      document.getElementById("info").innerHTML = "<br>Address: " + defaultAccount+"</br>";
      document.getElementById("info").innerHTML += "<br>channel Balance: " + JSON.stringify(balance)+"</br>";

    });


    document.getElementById("init").addEventListener("click", async (event)=>{
      console.log("init button clicked");
      await L2.getInstance().init(defaultAccount, web3.currentProvider, ethPN, appRpcUrl, appPN);

      console.log("web3 version", web3.version);

    });


    document.getElementById("deposit").addEventListener("click", (event)=>{
      console.log("deposit button clicked");
      L2.getInstance().deposit(1e16 + '');
    });

    document.getElementById("withdraw").addEventListener("click", (event)=>{
      console.log("withdraw button clicked");
      L2.getInstance().withdraw(1e16+"");
    });

    document.getElementById("coclose").addEventListener("click", (event)=>{
      console.log("coclose button clicked");
      L2.getInstance().getBalance().then((balance)=>{
        console.log("balance is", balance);
        L2.getInstance().withdraw(balance);
      });
    });

    document.getElementById("coclose2").addEventListener("click", (event)=>{
      console.log("coclose2 button clicked");
      L2.getInstance().testCoClose();
    });

    document.getElementById("forceClose").addEventListener("click", (event)=>{
      console.log("forceClose button clicked");
      L2.getInstance().forceWithdraw();
    });

    document.getElementById("transfer").addEventListener("click", (event)=>{
      console.log("transfer button clicked");
      L2.getInstance().transfer("0xa08105d7650Fe007978a291CcFECbB321fC21ffe", 1e15+"");

      event.preventDefault()


      var msg = '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0'
      var from = defaultAccount;


    });

    document.getElementById("guardTransfer").addEventListener("click", (event)=>{
      console.log("guardTransfer button clicked");
      L2.getInstance().testGuardProof();
    });

}