const { putObject, deleteObject } = require("../common/s3CommonMethods")
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
      applicationAreas: req.body.applicationAreas,
      description: req.body.description || "",
      quantityAvailable: quantityAvailable,
      image: s3UploadLinks,
      status: req.body.status || "draft", // Default status is draft
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

// Get post by ID
const getPostDataById = async (req, res) => {
  try {
    const { id } = req.query
    console.log("Searching for post with ID:", id)

    if (!id) {
      return res.status(400).json({
        success: false,
        msg: "Post ID is required",
      })
    }

    const post = await Post.find({ postId: id })
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

// Get all products with optional status filter
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

// Delete product - Updated with proper error handling
const deleteProduct = async (req, res) => {
  try {
    const { postId } = req.params

    // Find the product first to get image URLs
    const product = await Post.findOne({ postId })

    if (!product) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      })
    }

    // Delete images from S3 if they exist
    if (product.image && product.image.length > 0) {
      try {
        await Promise.all(
          product.image.map(async (imageUrl) => {
            // Extract the key from the S3 URL
            const key = imageUrl.split("/").pop()
            const deleteParams = {
              Bucket: "evershine-product",
              Key: key,
            }

            try {
              await deleteObject(deleteParams)
              console.log(`Successfully deleted image: ${key}`)
            } catch (error) {
              console.error(`Error deleting image ${key} from S3:`, error)
              // Continue with product deletion even if image deletion fails
            }
          }),
        )
      } catch (error) {
        console.error("Error in bulk image deletion:", error)
      }
    }

    // Delete the product from the database
    const deletedProduct = await Post.findOneAndDelete({ postId })

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        msg: "Failed to delete product",
      })
    }

    console.log("Product deleted successfully:", deletedProduct)

    res.status(200).json({
      success: true,
      msg: "Product and associated images deleted successfully",
      data: deletedProduct,
    })
  } catch (error) {
    console.error("Error in deleteProduct:", error)
    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: error.message,
    })
  }
}

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
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

    const post = await Post.findOneAndUpdate({ postId: id }, updates, { new: true, runValidators: true })

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
    const { id } = req.params
    const { status } = req.body

    if (!["pending", "approved", "draft"].includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid status value",
      })
    }

    const post = await Post.findOneAndUpdate({ postId: id }, { status }, { new: true })

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

