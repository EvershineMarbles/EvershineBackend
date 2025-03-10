const { putObject } = require("../common/s3CommonMethods")
const Post = require("../database/models/postModel")

// Create post
const createPost = async (req, res) => {
  try {
    console.log("Full request body:", req.body)

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

    // Get size and thickness from request body
    const size = req.body.size || ""
    const thickness = req.body.thickness || ""

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
    }

    console.log("Creating post with data:", postData)

    const post = new Post(postData)
    const savedPost = await post.save()

    console.log("Saved post:", savedPost)

    res.status(200).json({
      success: true,
      msg: "Post created successfully",
      data: savedPost,
    })
  } catch (error) {
    console.error("Error creating post:", error)
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
    // Accept both id and postId query parameters
    const postId = req.query.id || req.query.postId

    if (!postId) {
      return res.status(400).json({
        success: false,
        msg: "Post ID is required",
      })
    }

    console.log(`Fetching product with ID: ${postId}`)
    const post = await Post.find({ postId: postId })
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

    // Add missing fields to all products
    const processedPosts = posts.map((post) => {
      const postObj = post.toObject()

      if (!("size" in postObj)) {
        postObj.size = ""
      }

      if (!("numberOfPieces" in postObj)) {
        postObj.numberOfPieces = null
      }

      if (!("thickness" in postObj)) {
        postObj.thickness = ""
      }

      return postObj
    })

    res.status(200).json({
      success: true,
      data: processedPosts,
    })
  } catch (error) {
    console.error("Error in getAllProducts:", error)
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
    console.error("Error in deleteProduct:", error)
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
    })
  }
}

// Update product
const updateProduct = async (req, res) => {
  try {
    // Accept both id and postId parameters
    const postId = req.params.id || req.params.postId

    console.log(`Updating product with ID: ${postId}`)
    console.log("Update data:", req.body)

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

    // Ensure size and thickness are properly handled
    if (updates.size === undefined) {
      // Don't change if not provided
      updates.size = ""
    } else if (updates.size === "") {
      updates.size = ""
    }

    if (updates.thickness === undefined) {
      // Don't change if not provided
      updates.thickness = ""
    } else if (updates.thickness === "") {
      updates.thickness = ""
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

    console.log("Final update data:", updates)

    const post = await Post.findOneAndUpdate({ postId: postId }, updates, {
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

    // Add missing fields to the response if they don't exist
    const updatedProduct = post.toObject()

    if (!("size" in updatedProduct)) {
      updatedProduct.size = ""
    }

    if (!("numberOfPieces" in updatedProduct)) {
      updatedProduct.numberOfPieces = null
    }

    if (!("thickness" in updatedProduct)) {
      updatedProduct.thickness = ""
    }

    res.status(200).json({
      success: true,
      msg: "Product updated successfully",
      data: updatedProduct,
    })
  } catch (error) {
    console.error("Error in updateProduct:", error)
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
    // Accept both id and postId parameters
    const postId = req.params.id || req.params.postId
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
    console.error("Error in updateProductStatus:", error)
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

