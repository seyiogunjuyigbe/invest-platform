module.exports = function endpointsUtil() {
  const flwBaseUrl =
    process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
  return {
    raveAuthUrl: `${flwBaseUrl}/payments`,
    raveInitiatePayment: `${flwBaseUrl}/flwv3-pug/getpaidx/api/charge`,
    raveVerifyPayment: `${flwBaseUrl}/flwv3-pug/getpaidx/api/verify`,
    raveTokenCharge: `${flwBaseUrl}/tokenized-charges`,
    raveValidatePayment: `${flwBaseUrl}/flwv3-pug/getpaidx/api/validatecharge`,
    raveCreateTransfer: `${flwBaseUrl}/v2/gpx/transfers/create`,
    raveGetTransfer: `${flwBaseUrl}/v2/gpx/transfers`,
    raveListBanks: `${flwBaseUrl}/banks`,
    raveBeneficiaryUrl: `${flwBaseUrl}/beneficiaries`,
    raveTransferUrl: `${flwBaseUrl}/transfers`,
    raveGetTx: `${flwBaseUrl}/transactions`,
    raveValidateBvn: `${flwBaseUrl}/kyc/bvns`,
  };
};
