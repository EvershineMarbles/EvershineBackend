const mongoose = require("mongoose")

const postSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: {
      values: [
        "Imported Marble",
        "Imported Granite",
        "Exotics",
        "Onyx",
        "Travertine",
        "Indian Marble",
        "Indian Granite",
        "Semi Precious Stone",
        "Quartzite",
        "Sandstone",
      ],
      message: "{VALUE} is not a valid category",
    },
  },
  applicationAreas: {
    type: String,
    required: [true, "Application area is required"],
    enum: {
      values: ["Flooring", "Countertops", "Walls", "Exterior", "Interior"],
      message: "{VALUE} is not a valid application area",
    },
  },
  description: {
    type: String,
    required: false, // Make description optional
    default: "", // Provide default empty string
  },
  quantityAvailable: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0, "Quantity cannot be negative"],
  },
  image: {
    type: [String],
    required: [true, "At least one image is required"],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0
      },
      message: "At least one image is required"
    }
  },
  postId: {
    type: String,
    required: true,
    unique: true,
    default: () => Date.now().toString() + Math.floor(Math.random() * 1000).toString()
  },
}, {
  timestamps: true
})

module.exports = mongoose.model("Post", postSchema)]