export let config = {
  ethPNAddress: '0x0B3B88bAa51100D58A4710E3a2A2657fe3ca38e2',
  appPNAddress: '0x436c5403eA2769948d6e1Cd90D78DA54D8982daa',
  appSessionAddress: '0xFAdec7E5b28bcFc6BB133Fcc76e45764EC7aF4Fb',

  // let appRpcUrl : "http://wallet.milewan.com:8090",
  appRpcUrl: 'ws://wallet.milewan.com:4337',
  // let appRpcUrl : "https://node.cryptape.com",

  // let tokenList : [
  //   '0x0000000000000000000000000000000000000000',
  //   '0x605a409Dc63cFd7e35ef7cb2d2cab8B66b136928',
  // ],

  token: '0x0000000000000000000000000000000000000000',
};

let oldlog = console.log;
console.log = (message?: any, ...optionalParams: any[]) => {
  let timestamp = new Date().toISOString();
  if (optionalParams.length >= 1) {
    if (typeof message === 'string') {
      oldlog(timestamp + "-------  " + message, ...optionalParams);
    } else {
      oldlog(timestamp + "-------  ", message, ...optionalParams);
    }
  } else {
    if (typeof message === 'string') {
      oldlog(timestamp + "-------  " + message);
    } else {
      oldlog(timestamp + "-------  ", message);
    }
  }
};
