const mongoose = require("mongoose")

const restaurantCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("RestaurantCategory", restaurantCategorySchema)
