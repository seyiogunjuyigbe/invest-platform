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
  DocCtrl.submitDocument
);

router.get('/', isAuthenticated, DocCtrl.viewDocuments);
router.get('/:docId', isAuthenticated, DocCtrl.viewDocument);
router.delete('/:docId', isAuthenticated, DocCtrl.deleteMyDoc);
router.put('/:docId', isAuthenticated, adminRoute(), DocCtrl.updateDocument);
module.exports = router;
