const multer = require('multer')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/profile');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});


const storageServices = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/merchant/services');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});


const storageEvent = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/event');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// const storageMerchant = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/merchant/services');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });


const upload = multer({ storage });
const uploadServices = multer({ storage: storageServices });
const uploadEvent = multer({ storage: storageEvent });
// const uploadMerchant = multer({ storage: storageMerchant });


module.exports = { upload, uploadServices, uploadEvent };