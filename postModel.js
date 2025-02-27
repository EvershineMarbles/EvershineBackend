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
    type: [String], // Changed to array of strings
    required: [true, "At least one application area is required"],
    validate: {
      validator: function(v) {
        // Check if it's an array and has at least one value
        if (!Array.isArray(v) || v.length === 0) {
          return false;
        }
        // Check if all values are valid application areas
        const validAreas = ["Flooring", "Countertops", "Walls", "Exterior", "Interior"];
        return v.every(area => validAreas.includes(area));
      },
      message: "Invalid application areas. Must include at least one valid area"
    }
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
  image: {
    type: [String],
    required: [true, "At least one image is required"],
    validate: [
      {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "At least one image is required"
      },
      {
        validator: function(v) {
          return Array.isArray(v) && v.length <= 10;
        },
        message: "Maximum 10 images are allowed"
      }
    ]
  },
  postId: {
    type: String,
    required: true,
    unique: true,
    default: () => Date.now().toString() + Math.floor(Math.random() * 1000).toString()
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'pending', 'approved'],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft'
  }
}, {
  timestamps: true
})

// Add index for better query performance
postSchema.index({ postId: 1 })
postSchema.index({ category: 1 })
postSchema.index({ status: 1 })
postSchema.index({ createdAt: -1 })

module.exports = mongoose.model("Post", postSchema)