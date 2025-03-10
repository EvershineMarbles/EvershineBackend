const mongoose = require("mongoose")

const postSchema = mongoose.Schema(
  {
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
      type: String, // Keep as string for backward compatibility
      required: [true, "At least one application area is required"],
      validate: {
        validator: (value) => {
          if (!value) return false

          // Split the comma-separated string and check if each area is valid
          const areas = value.split(",").map((area) => area.trim())
          const validAreas = ["Flooring", "Countertops", "Walls", "Exterior", "Interior"]

          return areas.length > 0 && areas.every((area) => validAreas.includes(area))
        },
        message: "Invalid application area. Must be one of: Flooring, Countertops, Walls, Exterior, Interior",
      },
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
    quantityAvailable: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    // New field for Quality Availabhhhh
    qualityAvailabhhhh: {
      type: String,
      required: false,
      default: "",
    },
    // New fields
    size: {
      type: String,
      required: false,
      default: "",
    },
    numberOfPieces: {
      type: Number,
      required: false,
      default: null,
    },
    thickness: {
      type: String,
      required: false,
      default: "",
    },
    image: {
      type: [String],
      required: [true, "At least one image is required"],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one image is required",
      },
    },
    postId: {
      type: String,
      required: true,
      unique: true,
      default: () => Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Post", postSchema)

