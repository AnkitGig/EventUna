const mongoose = require("mongoose");

const addtionalServicesSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      unique: true,   // 👈 This will make the serviceName unique
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdditionalService", addtionalServicesSchema);
