const { putObject } = require("../common/s3CommonMethods")
const Post = require("../database/models/postModel")

// Create post
const createPost = async (req, res) => {
  try {
    console.log("Full request:", {
      body: req.body,
      files: req.files,
      headers: req.headers,
    })

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "You must upload at least one image",
      })
    }

    const price = Number.parseFloat(req.body.price)
    const quantityAvailable = Number.parseFloat(req.body.quantityAvailable)

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        msg: "Price must be a valid positive number",
      })
    }

    if (isNaN(quantityAvailable) || quantityAvailable < 0) {
      return res.status(400).json({
        success: false,
        msg: "Quantity must be a valid non-negative number",
      })
    }

    const requiredFields = ["name", "category", "applicationAreas"]

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          msg: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
        })
      }
    }

    // Handle application areas
    let applicationAreas
    try {
      // Check if applicationAreas is already an array or needs to be split
      applicationAreas = Array.isArray(req.body.applicationAreas)
        ? req.body.applicationAreas
        : req.body.applicationAreas.split(",").map((area) => area.trim())

      const validAreas = ["Flooring", "Countertops", "Walls", "Exterior", "Interior"]
      const invalidAreas = applicationAreas.filter((area) => !validAreas.includes(area))

      if (invalidAreas.length > 0) {
        return res.status(400).json({
          success: false,
          msg: `Invalid application areas: ${invalidAreas.join(", ")}. Valid areas are: ${validAreas.join(", ")}`,
        })
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        msg: "Invalid application areas format",
      })
    }

    console.log("Attempting to upload images to S3...")
    const s3UploadLinks = await Promise.all(
      req.files.map(async (image) => {
        const uploadParams = {
          Bucket: "evershine-product",
          Key: `${Date.now()}-${image.originalname}`,
          Body: image.buffer,
          ContentType: image.mimetype,
        }

        try {
          return await putObject(uploadParams)
        } catch (error) {
          console.error("S3 upload error:", error)
          throw new Error(`Failed to upload image: ${error.message}`)
        }
      }),
    )

    console.log("S3 upload successful:", s3UploadLinks)

    const post = new Post({
      name: req.body.name,
      price: price,
      category: req.body.category,
      applicationAreas: applicationAreas, // Now passing the array
      description: req.body.description || "",
      quantityAvailable: quantityAvailable,
      image: s3UploadLinks,
      status: req.body.status || "draft",
    })

    console.log("Attempting to save post:", post)
    const postData = await post.save()
    console.log("Post saved successfully:", postData)

    res.status(200).json({
      success: true,
      msg: "Post created successfully",
      data: postData,
    })
  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}

// Get post by ID - Updated to use query parameter
const getPostDataById = async (req, res) => {
  try {
    const { postId } = req.query // Using query parameter
    console.log("Searching for post with ID:", postId)

    if (!postId) {
      return res.status(400).json({
        success: false,
        msg: "Post ID is required",
      })
    }

    const post = await Post.find({ postId: postId })
    console.log("Found post:", post)

    if (!post || post.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "Post not found",
      })
    }

    res.status(200).json({
      success: true,
      data: post,
    })
  } catch (error) {
    console.error("Error fetching post:", error)
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
    })
  }
}

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { status } = req.query
    const query = status && status !== "all" ? { status } : {}

    const posts = await Post.find(query).sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      data: posts,
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
    })
  }
}

// Update the deleteProduct function
const deleteProduct = async (req, res) => {
  try {
    const { postId } = req.params
    console.log("Attempting to delete product with ID:", postId)

    if (!postId) {
      return res.status(400).json({
        success: false,
        msg: "Product ID is required",
      })
    }

    const post = await Post.findOneAndDelete({ postId: postId })

    if (!post) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      })
    }

    console.log("Product deleted successfully:", post)

    res.status(200).json({
      success: true,
      msg: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
    })
  }
}

// Update product
const updateProduct = async (req, res) => {
  try {
    const { postId } = req.params // Changed from id to postId
    const updates = { ...req.body }

    // Parse and validate numeric fields
    if (updates.price) {
      const price = Number.parseFloat(updates.price)
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          msg: "Price must be a valid positive number",
        })
      }
      updates.price = price
    }

    if (updates.quantityAvailable) {
      const quantityAvailable = Number.parseFloat(updates.quantityAvailable)
      if (isNaN(quantityAvailable) || quantityAvailable < 0) {
        return res.status(400).json({
          success: false,
          msg: "Quantity must be a valid non-negative number",
        })
      }
      updates.quantityAvailable = quantityAvailable
    }

    // Handle application areas if they're being updated
    if (updates.applicationAreas) {
      try {
        // Check if applicationAreas is already an array or needs to be split
        updates.applicationAreas = Array.isArray(updates.applicationAreas)
          ? updates.applicationAreas
          : updates.applicationAreas.split(",").map((area) => area.trim())

        const validAreas = ["Flooring", "Countertops", "Walls", "Exterior", "Interior"]
        const invalidAreas = updates.applicationAreas.filter((area) => !validAreas.includes(area))

        if (invalidAreas.length > 0) {
          return res.status(400).json({
            success: false,
            msg: `Invalid application areas: ${invalidAreas.join(", ")}. Valid areas are: ${validAreas.join(", ")}`,
          })
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          msg: "Invalid application areas format",
        })
      }
    }

    // Handle images
    let finalImages = []

    // Handle existing images
    if (updates.existingImages) {
      try {
        const existingImages = JSON.parse(updates.existingImages)
        finalImages = [...existingImages]
      } catch (error) {
        console.error("Error parsing existing images:", error)
      }
      delete updates.existingImages // Remove from updates object
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const s3UploadLinks = await Promise.all(
        req.files.map(async (image) => {
          const uploadParams = {
            Bucket: "evershine-product",
            Key: `${Date.now()}-${image.originalname}`,
            Body: image.buffer,
            ContentType: image.mimetype,
          }
          return await putObject(uploadParams)
        }),
      )
      finalImages = [...finalImages, ...s3UploadLinks]
    }

    // Update images array if we have any images
    if (finalImages.length > 0) {
      updates.image = finalImages
    }

    // Validate required fields if they are being updated
    const requiredFields = ["name", "category", "applicationAreas"]
    for (const field of requiredFields) {
      if (updates[field] === "") {
        return res.status(400).json({
          success: false,
          msg: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
        })
      }
    }

    console.log("Updating product with data:", updates)

    const post = await Post.findOneAndUpdate({ postId: postId }, updates, { new: true, runValidators: true })

    if (!post) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      })
    }

    console.log("Product updated successfully:", post)

    res.status(200).json({
      success: true,
      msg: "Product updated successfully",
      data: post,
    })
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}

// Update product status
const updateProductStatus = async (req, res) => {
  try {
    const { postId } = req.params // Changed from id to postId
    const { status } = req.body

    if (!["pending", "approved", "draft"].includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid status value",
      })
    }

    const post = await Post.findOneAndUpdate({ postId: postId }, { status }, { new: true })

    if (!post) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      })
    }

    res.status(200).json({
      success: true,
      msg: "Product status updated successfully",
      data: post,
    })
  } catch (error) {
    console.error("Error updating product status:", error)
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
    })
  }
}

module.exports = {
  createPost,
  getPostDataById,
  getAllProducts,
  deleteProduct,
  updateProduct,
  updateProductStatus,
}

