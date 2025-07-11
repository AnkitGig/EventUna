const multer = require('multer')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/profile');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});


const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/services');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });
const upload2 = multer({ storage2 });

module.exports = { upload, upload2 };