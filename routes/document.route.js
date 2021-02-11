const express = require('express');

const router = express.Router();
const DocCtrl = require('../controllers/document.controller');
const adminRoute = require('../middlewares/admin');
const isAuthenticated = require('../middlewares/is-authenticated');
const upload = require('../middlewares/multer');

router.post(
  '/',
  isAuthenticated,
  upload.single('document'),
  DocCtrl.requestverificationAsUser
);

router.get('/', isAuthenticated, DocCtrl.viewMyDocs);
router.get(
  '/requests',
  isAuthenticated,
  adminRoute(),
  DocCtrl.viewVerificationRequests
);
router.get('/:docId', isAuthenticated, DocCtrl.viewSingleDoc);
router.delete('/:docId', isAuthenticated, DocCtrl.deleteMyDoc);

router.get(
  '/requests/:docId',
  isAuthenticated,
  adminRoute(),
  DocCtrl.viewVerificationRequest
);
router.put(
  '/requests/:docId',
  isAuthenticated,
  adminRoute(),
  DocCtrl.updateVerificationRequest
);
module.exports = router;
