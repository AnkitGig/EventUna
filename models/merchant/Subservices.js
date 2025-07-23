const mongoose = require("mongoose")

const subServicesSchema = new mongoose.Schema(
  {
    subServicesName: {
      type: String,
      required: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Services",
      required: true,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Subservices", subServicesSchema)
