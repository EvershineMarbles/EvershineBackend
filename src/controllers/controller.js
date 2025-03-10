const { putObject } = require("../common/s3CommonMethods")
const Post = require("../database/models/postModel")

// Create post
const createPost = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "You must upload at least one image",
      })
    }

    const price = Number.parseFloat(req.body.price)
    const quantityAvailable = Number.parseFloat(req.body.quantityAvailable)

    // Parse numberOfPieces if provided
    let numberOfPieces = null
    if (req.body.numberOfPieces) {
      numberOfPieces = Number.parseInt(req.body.numberOfPieces)
      if (isNaN(numberOfPieces) || numberOfPieces < 0) {
        return res.status(400).json({
          success: false,
          msg: "Number of pieces must be a valid non-negative number",
        })
      }
    }

    // Get size, thickness, and qualityAvailabhhhh from request body
    const size = req.body.size || ""
    const thickness = req.body.thickness || ""
    const qualityAvailabhhhh = req.body.qualityAvailabhhhh || ""

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
          throw new Error(`Failed to upload image: ${error.message}`)
        }
      }),
    )

    // Create post with explicit handling of optional fields
    const postData = {
      name: req.body.name,
      price: price,
      category: req.body.category,
      applicationAreas: req.body.applicationAreas,
      description: req.body.description || "",
      quantityAvailable: quantityAvailable,
      image: s3UploadLinks,
      status: req.body.status || "draft",
      // Always include these fields with default values if not provided
      size: size,
      thickness: thickness,
      numberOfPieces: numberOfPieces,
      qualityAvailabhhhh: qualityAvailabhhhh,
    }

    const post = new Post(postData)
    const savedPost = await post.save()

    res.status(200).json({
      success: true,
      msg: "Post created successfully",
      data: savedPost,
    })
  } catch (error) {
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

    if (!id) {
      return res.status(400).json({
        success: false,
        msg: "Post ID is required",
      })
    }

    console.log(`Fetching product with ID: ${id}`)
    const post = await Post.find({ postId: id })
    console.log("Raw database result:", JSON.stringify(post, null, 2))

    if (!post || post.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "Post not found",
      })
    }

    // Add missing fields to the response if they don't exist
    if (post[0]) {
      const productData = post[0].toObject()
      console.log("Before adding missing fields:", JSON.stringify(productData, null, 2))

      // Ensure these fields exist in the response
      if (!("size" in productData)) {
        console.log("Adding missing 'size' field")
        productData.size = ""
      }

      if (!("numberOfPieces" in productData)) {
        console.log("Adding missing 'numberOfPieces' field")
        productData.numberOfPieces = null
      }

      if (!("thickness" in productData)) {
        console.log("Adding missing 'thickness' field")
        productData.thickness = ""
      }

      if (!("qualityAvailabhhhh" in productData)) {
        console.log("Adding missing 'qualityAvailabhhhh' field")
        productData.qualityAvailabhhhh = ""
      }

      console.log("After adding missing fields:", JSON.stringify(productData, null, 2))

      return res.status(200).json({
        success: true,
        data: [productData],
      })
    }

    res.status(200).json({
      success: true,
      data: post,
    })
  } catch (error) {
    console.error("Error in getPostDataById:", error)
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

    res.status(200).json({
      success: true,
      msg: "Product deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
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

    // Parse numberOfPieces if provided
    if (updates.numberOfPieces) {
      const numberOfPieces = Number.parseInt(updates.numberOfPieces)
      if (isNaN(numberOfPieces) || numberOfPieces < 0) {
        return res.status(400).json({
          success: false,
          msg: "Number of pieces must be a valid non-negative number",
        })
      }
      updates.numberOfPieces = numberOfPieces
    } else if (updates.numberOfPieces === "") {
      // Handle empty string case for numberOfPieces
      updates.numberOfPieces = null
    }

    // Ensure size, thickness, and qualityAvailabhhhh are properly handled
    if (updates.size === undefined) {
      // Don't change if not provided
    } else if (updates.size === "") {
      updates.size = ""
    }

    if (updates.thickness === undefined) {
      // Don't change if not provided
    } else if (updates.thickness === "") {
      updates.thickness = ""
    }

    if (updates.qualityAvailabhhhh === undefined) {
      // Don't change if not provided
    } else if (updates.qualityAvailabhhhh === "") {
      updates.qualityAvailabhhhh = ""
    }

    // Handle images
    let finalImages = []

    // Handle existing images
    if (updates.existingImages) {
      try {
        const existingImages = JSON.parse(updates.existingImages)
        finalImages = [...existingImages]
      } catch (error) {
        // Error parsing existing images
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

    // Always include the optional fields in the update
    if (!("size" in updates)) {
      updates.size = ""
    }

    if (!("numberOfPieces" in updates)) {
      updates.numberOfPieces = null
    }

    if (!("thickness" in updates)) {
      updates.thickness = ""
    }

    if (!("qualityAvailabhhhh" in updates)) {
      updates.qualityAvailabhhhh = ""
    }

    const post = await Post.findOneAndUpdate({ postId: id }, updates, {
      new: true,
      runValidators: true,
      // This option ensures that if the document doesn't have these fields, they will be added
      upsert: false,
      setDefaultsOnInsert: true,
    })

    if (!post) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      })
    }

    res.status(200).json({
      success: true,
      msg: "Product updated successfully",
      data: post,
    })
  } catch (error) {
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

