const fs = require('fs');
const path = require('path');

exports.deleteOldImages = (folderName, oldPath) => {
  try {
    if (!oldPath) return; // avoid deleting base folder accidentally

    const oldImagePath = path.join(__dirname, '..', 'public', folderName, oldPath);
    console.log("Deleting old file →", oldImagePath);

    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
      console.log("File deleted successfully.");
    } else {
      console.log("File does not exist.");
    }
  } catch (err) {
    console.error("Failed to delete image:", err.message);
  }
};
