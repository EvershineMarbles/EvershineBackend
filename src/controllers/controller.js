const { putObject } = require("../common/s3CommonMethods")
const Post = require("../database/models/postModel")

const MAX_IMAGES = 10

// Create post
const createPost = async (req, res) => {
  try {
    console.log("Full request:", {
      body: req.body,
      files: req.files,
      headers: req.headers
    })

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        msg: "You must upload at least one image" 
      })
    }

    if (req.files.length > MAX_IMAGES) {
      return res.status(400).json({
        success: false,
        msg: `Maximum ${MAX_IMAGES} images are allowed`
      })
    }

    const price = parseFloat(req.body.price)
    const quantityAvailable = parseFloat(req.body.quantityAvailable)

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        msg: "Price must be a valid positive number"
      })
    }

    if (isNaN(quantityAvailable) || quantityAvailable < 0) {
      return res.status(400).json({
        success: false,
        msg: "Quantity must be a valid non-negative number"
      })
    }

    // Parse application areas
    let applicationAreas = []
    try {
      applicationAreas = typeof req.body.applicationAreas === 'string' 
        ? JSON.parse(req.body.applicationAreas)
        : req.body.applicationAreas
    } catch (error) {
      return res.status(400).json({
        success: false,
        msg: "Invalid application areas format"
      })
    }

    if (!Array.isArray(applicationAreas) || applicationAreas.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "At least one application area is required"
      })
    }

    const requiredFields = ['name', 'category']
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          msg: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
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
      applicationAreas: applicationAreas,
      description: req.body.description || "",
      quantityAvailable: quantityAvailable,
      image: s3UploadLinks,
      status: req.body.status || "draft"
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
      name: error.name
    })

    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      const price = parseFloat(updates.price)
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          msg: "Price must be a valid positive number"
        })
      }
      updates.price = price
    }

    if (updates.quantityAvailable) {
      const quantityAvailable = parseFloat(updates.quantityAvailable)
      if (isNaN(quantityAvailable) || quantityAvailable < 0) {
        return res.status(400).json({
          success: false,
          msg: "Quantity must be a valid non-negative number"
        })
      }
      updates.quantityAvailable = quantityAvailable
    }

    // Parse application areas
    if (updates.applicationAreas) {
      try {
        updates.applicationAreas = typeof updates.applicationAreas === 'string'
          ? JSON.parse(updates.applicationAreas)
          : updates.applicationAreas

        if (!Array.isArray(updates.applicationAreas) || updates.applicationAreas.length === 0) {
          return res.status(400).json({
            success: false,
            msg: "At least one application area is required"
          })
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          msg: "Invalid application areas format"
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
        return res.status(400).json({
          success: false,
          msg: "Invalid existing images format"
        })
      }
      delete updates.existingImages
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      // Check total number of images
      if (finalImages.length + req.files.length > MAX_IMAGES) {
        return res.status(400).json({
          success: false,
          msg: `Maximum ${MAX_IMAGES} images are allowed`
        })
      }

      const s3UploadLinks = await Promise.all(
        req.files.map(async (image) => {
          const uploadParams = {
            Bucket: "evershine-product",
            Key: `${Date.now()}-${image.originalname}`,
            Body: image.buffer,
            ContentType: image.mimetype,
          }
          return await putObject(uploadParams)
        })
      )
      finalImages = [...finalImages, ...s3UploadLinks]
    }

    // Update images array if we have any images
    if (finalImages.length > 0) {
      if (finalImages.length > MAX_IMAGES) {
        return res.status(400).json({
          success: false,
          msg: `Maximum ${MAX_IMAGES} images are allowed`
        })
      }
      updates.image = finalImages
    }

    // Validate required fields if they are being updated
    const requiredFields = ['name', 'category']
    for (const field of requiredFields) {
      if (updates[field] === '') {
        return res.status(400).json({
          success: false,
          msg: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
        })
      }
    }

    console.log("Updating product with data:", updates)

    const post = await Post.findOneAndUpdate(
      { postId: id },
      updates,
      { new: true, runValidators: true }
    )

    if (!post) {
      return res.status(404).json({
        success: false,
        msg: "Product not found"
      })
    }

    console.log("Product updated successfully:", post)

    res.status(200).json({
      success: true,
      msg: "Product updated successfully",
      data: post
    })
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({
      success: false,
      msg: error.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// Other functions remain the same...

module.exports = {
  createPost,
  getPostDataById,
  getAllProducts,
  deleteProduct,
  updateProduct,
  updateProductStatus
}