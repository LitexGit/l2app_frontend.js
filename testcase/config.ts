export let config = {
  ethPNAddress: '0xdCbd4E045096Ef980d635381Cd183120F46825d3',
  appPNAddress: '0xB30d792F5c705cAe7Ec3Fc57A12408745fd0CE7F',
  appSessionAddress: '0x6923C31b8ab980217bE283DEF58013355537C39D',

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
