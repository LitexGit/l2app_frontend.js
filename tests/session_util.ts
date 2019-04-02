// export async function testCreateSession(
//   cita: any,
//   appSession: Contract,
//   sessionID: string,
//   game: string,
//   data: string
// ) {
//   let tx = await getAppTxOption();
//   tx.from = '0xa08105d7650Fe007978a291CcFECbB321fC21ffe';
//   tx.privateKey =
//     '6A22D7D5D87EFC4A1375203B7E54FBCF35FAA84975891C5E3D12BE86C579A6E5';
//   let res = await appSession.methods
//     .initSession(
//       sessionID,
//       cp,
//       game,
//       [user, cp],
//       appPN.options.address,
//       web3_10.utils.toHex(data)
//     )
//     .send(tx);

//   if (res.hash) {
//     let receipt = await cita.listeners.listenToTransactionReceipt(res.hash);
//     if (receipt.errorMessage) {
//       throw new Error(receipt.errorMessage);
//     } else {
//       console.log('submit initSession success', receipt);
//       return res.hash;
//     }
//   } else {
//     console.log(res);
//     throw new Error('submit initSession failed');
//   }
// }
