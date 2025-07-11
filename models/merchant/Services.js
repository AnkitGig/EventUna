const mongoose = require("mongoose");

const servicesSchema = new mongoose.Schema(
  {
    servicesName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Services", servicesSchema);
