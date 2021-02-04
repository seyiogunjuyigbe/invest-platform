const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path')
const { cloudinaryConfig } = require('../config/cloudinary');

cloudinaryConfig();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'files',
  },

});

module.exports = multer({
  storage
})

