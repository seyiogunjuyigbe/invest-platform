const express = require('express');

const router = express.Router();
const VerificationCtrl = require('../controllers/verification.controller');
const adminRoute = require('../middlewares/admin');
const isAuthenticated = require('../middlewares/is-authenticated');
const upload = require('../middlewares/multer');

router.post(
  '/',
  isAuthenticated,
  upload.single('document'),
  VerificationCtrl.requestverificationAsUser
);
router.get(
  '/',
  isAuthenticated,
  adminRoute(),
  VerificationCtrl.viewVerificationRequests
);
router.get(
  '/:requestId',
  isAuthenticated,
  adminRoute(),
  VerificationCtrl.viewVerificationRequest
);
router.put(
  '/:requestId',
  isAuthenticated,
  adminRoute(),
  VerificationCtrl.updateVerificationRequest
);
module.exports = router;
