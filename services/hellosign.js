const { HELLOSIGN_KEY, HELLOSIGN_CLIENT_ID, NODE_ENV } = process.env;
const hellosign = require('hellosign-sdk')({ key: HELLOSIGN_KEY });

module.exports = async function requestMouSignature(user, portfolio) {
  try {
    const opts = {
      test_mode: NODE_ENV === 'production' ? 0 : 1,
      clientId: HELLOSIGN_CLIENT_ID,
      subject: portfolio.title,
      message: 'Please sign this MOU to procees with your investment',
      signers: [
        {
          email_address: user.email,
          name: user.name,
        },
      ],
      files: [portfolio.memorandum],
    };

    await hellosign.signatureRequest.createEmbedded(opts);
  } catch (error) {
    return null;
  }
};
