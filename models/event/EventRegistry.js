const mongoose = require("mongoose");

const registrySchema = new mongoose.Schema(
  {
    registryName: {
      type: String,
      required: true,
    },
    registryUrtl: {
      type: String,
      required: true        
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("registry", registrySchema);
