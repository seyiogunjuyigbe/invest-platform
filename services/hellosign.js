const { HELLOSIGN_KEY, HELLOSIGN_CLIENT_ID, NODE_ENV } = process.env;
const hellosign = require('hellosign-sdk')({ key: HELLOSIGN_KEY });
const https = require('https');
const fs = require('fs');
const path = require('path');

function getMOU(MOUPath, cloudinaryUrl) {
  const mouExists = fs.existsSync(MOUPath);
  if (mouExists) return MOUPath;
  console.log(mouExists);
  return new Promise((resolve, reject) => {
    try {
      const mou = fs.createWriteStream(MOUPath);
      https.get(cloudinaryUrl, res => {
        res.pipe(mou);
        mou.on('finish', () => resolve(cloudinaryUrl));
      });
    } catch (error) {
      reject(error);
    }
  });
}
async function getSignatureURL(sigId) {
  const url = await hellosign.embedded.getSignUrl(sigId);
  return url;
}

module.exports = function requestMouSignature(user, portfolio) {
  // eslint-disable-next-line
  return new Promise(async (resolve, reject) => {
    try {
      const dir = path.resolve(__dirname, `../temp/${portfolio.localPath}.pdf`);
      await getMOU(dir, portfolio.memorandum);
      const opts = {
        test_mode: NODE_ENV === 'production' ? 0 : 1,
        clientId: HELLOSIGN_CLIENT_ID,
        subject: portfolio.title,
        message: 'Please sign this MOU to proceed with your investment',
        signers: [
          {
            email_address: user.email,
            name: user.name,
          },
        ],
        files: [dir],
        metadata: {
          userId: user.id,
          portfolioId: portfolio.id,
        },
      };
      const hsResp = await hellosign.signatureRequest.createEmbedded(opts);
      const url = await getSignatureURL(
        hsResp.signature_request.signatures[0].signature_id
      );
      resolve(url);
    } catch (error) {
      reject(error);
    }
  });
};
