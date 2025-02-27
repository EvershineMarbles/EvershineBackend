const express = require("express")
const router = express.Router()
const bodyParser = require("body-parser")
const multer = require("multer")

// Increase payload size limits
router.use(bodyParser.json({ limit: "50mb" }))
router.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }))
router.use(express.static("public"))

// Configure multer for file uploads
const storage = multer.memoryStorage()

const upload = multer({
  storage: storage,
  limits: {
    files: 4,
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only images are allowed"), false)
    }
    cb(null, true)
  },
})

const postController = require("../controllers/controller")

// Health check route
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" })
})

// Create new post
router.post("/create-post", upload.array("images", 4), (req, res, next) => {
  try {
    console.log("Request received at /create-post")
    console.log("Headers:", req.headers)
    console.log("Body:", req.body)
    console.log("Files:", req.files?.map(f => ({ 
      fieldname: f.fieldname,
      originalname: f.originalname,
      size: f.size,
      mimetype: f.mimetype 
    })))
    
    postController.createPost(req, res)
  } catch (error) {
    console.error("Error in create-post route:", error)
    next(error)
  }
})

// Get post by ID
router.get("/getPostDataById", (req, res, next) => {
  try {
    console.log("Getting post by ID:", req.query.id)
    postController.getPostDataById(req, res)
  } catch (error) {
    console.error("Error in getPostDataById route:", error)
    next(error)
  }
})

// Get all posts
router.get("/getAllProducts", (req, res, next) => {
  try {
    console.log("Getting all products")
    postController.getAllProducts(req, res)
  } catch (error) {
    console.error("Error in getAllProducts route:", error)
    next(error)
  }
})

// Delete post by ID
router.delete("/deleteProduct/:id", (req, res, next) => {
  try {
    console.log("Deleting product:", req.params.id)
    postController.deleteProduct(req, res)
  } catch (error) {
    console.error("Error in deleteProduct route:", error)
    next(error)
  }
})

// Update post by ID
router.put("/updateProduct/:id", upload.array("images", 4), (req, res, next) => {
  try {
    console.log("Updating product:", req.params.id)
    console.log("Update data:", req.body)
    console.log("Update files:", req.files)
    postController.updateProduct(req, res)
  } catch (error) {
    console.error("Error in updateProduct route:", error)
    next(error)
  }
})

// Update post status
router.patch("/updateProductStatus/:id", (req, res, next) => {
  try {
    console.log("Updating product status:", req.params.id)
    console.log("New status:", req.body.status)
    postController.updateProductStatus(req, res)
  } catch (error) {
    console.error("Error in updateProductStatus route:", error)
    next(error)
  }
})

// Error handling middleware
router.use((err, req, res, next) => {
  console.error("Route error:", err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {}
  })
})

module.exports = router