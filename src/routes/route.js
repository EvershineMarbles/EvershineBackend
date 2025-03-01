const express = require("express")
const router = express.Router()
const bodyParser = require("body-parser")
const multer = require("multer")
const postController = require("../controllers/controller")

// Configure multer
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: {
    files: 10,
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only images are allowed"), false)
    }
    cb(null, true)
  },
})

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        msg: "File size too large. Maximum size is 5MB",
      })
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        msg: "Too many files. Maximum is 10 images",
      })
    }
    return res.status(400).json({
      success: false,
      msg: err.message,
    })
  }
  next(err)
}

// Validation middleware
const validateRequiredFields = (req, res, next) => {
  const requiredFields = ["name", "category", "applicationAreas", "price", "quantityAvailable"]
  const missingFields = requiredFields.filter((field) => !req.body[field])

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      msg: `Missing required fields: ${missingFields.join(", ")}`,
    })
  }
  next()
}

// Test route
router.get("/test", (req, res) => {
  res.json({
    message: "API routes are working",
    timestamp: new Date().toISOString(),
  })
})

// Create new post
router.post(
  "/create-post",
  (req, res, next) => {
    upload.array("images", 10)(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next)
      next()
    })
  },
  validateRequiredFields,
  async (req, res, next) => {
    try {
      console.log("Create post request received:", {
        body: {
          ...req.body,
          images: req.files?.length || 0,
        },
        timestamp: new Date().toISOString(),
      })
      await postController.createPost(req, res)
    } catch (error) {
      console.error("Error in create post route:", error)
      next(error)
    }
  },
)

// Get all products
router.get("/getAllProducts", async (req, res, next) => {
  try {
    console.log("Get all products request received:", {
      query: req.query,
      timestamp: new Date().toISOString(),
    })
    await postController.getAllProducts(req, res)
  } catch (error) {
    console.error("Error in get all products route:", error)
    next(error)
  }
})

// Get post by ID
router.get("/getPostDataById", async (req, res, next) => {
  try {
    console.log("Get post by ID request received:", {
      postId: req.query.postId, // Changed from id to postId
      timestamp: new Date().toISOString(),
    })
    if (!req.query.postId) {
      // Changed from id to postId
      return res.status(400).json({
        success: false,
        msg: "Post ID is required",
      })
    }
    await postController.getPostDataById(req, res)
  } catch (error) {
    console.error("Error in get post by ID route:", error)
    next(error)
  }
})

// Delete post - Modified to handle both DELETE and GET methods
router
  .route("/deleteProduct/:postId")
  .delete(async (req, res, next) => {
    try {
      console.log("Delete product request received (DELETE):", {
        postId: req.params.postId,
        timestamp: new Date().toISOString(),
      })
      await postController.deleteProduct(req, res)
    } catch (error) {
      console.error("Error in delete product route:", error)
      next(error)
    }
  })
  .get(async (req, res, next) => {
    try {
      console.log("Delete product request received (GET):", {
        postId: req.params.postId,
        timestamp: new Date().toISOString(),
      })
      await postController.deleteProduct(req, res)
    } catch (error) {
      console.error("Error in delete product route:", error)
      next(error)
    }
  })

// Update post route - Modified to handle both PUT and POST methods
router
  .route("/updateProduct/:postId") // Changed from :id to :postId
  .put(async (req, res, next) => {
    try {
      console.log("Update product request received (PUT):", {
        postId: req.params.postId, // Changed from id to postId
        body: req.body,
        timestamp: new Date().toISOString(),
      })
      await postController.updateProduct(req, res)
    } catch (error) {
      console.error("Error in update product route:", error)
      next(error)
    }
  })
  .post(async (req, res, next) => {
    try {
      console.log("Update product request received (POST):", {
        postId: req.params.postId, // Changed from id to postId
        body: req.body,
        timestamp: new Date().toISOString(),
      })
      await postController.updateProduct(req, res)
    } catch (error) {
      console.error("Error in update product route:", error)
      next(error)
    }
  })

// Update status
router.patch("/updateProductStatus/:postId", async (req, res, next) => {
  // Changed from :id to :postId
  try {
    console.log("Update status request received:", {
      postId: req.params.postId, // Changed from id to postId
      status: req.body.status,
      timestamp: new Date().toISOString(),
    })

    if (!req.params.postId) {
      // Changed from id to postId
      return res.status(400).json({
        success: false,
        msg: "Product ID is required",
      })
    }

    if (!req.body.status) {
      return res.status(400).json({
        success: false,
        msg: "Status is required",
      })
    }

    await postController.updateProductStatus(req, res)
  } catch (error) {
    console.error("Error in update status route:", error)
    next(error)
  }
})

// Global error handler
router.use((error, req, res, next) => {
  console.error("Global error handler:", error)
  res.status(500).json({
    success: false,
    msg: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  })
})

module.exports = router

