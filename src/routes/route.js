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

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "API routes are working" })
})

// Create new post
router.post("/create-post", upload.array("images", 4), async (req, res, next) => {
  try {
    console.log("Create post request received:", {
      body: req.body,
      files: req.files?.length
    })
    await postController.createPost(req, res)
  } catch (error) {
    next(error)
  }
})

// Get all products
router.get("/getAllProducts", async (req, res, next) => {
  try {
    console.log("Get all products request received")
    await postController.getAllProducts(req, res)
  } catch (error) {
    next(error)
  }
})

// Get post by ID
router.get("/getPostDataById", async (req, res, next) => {
  try {
    console.log("Get post by ID request received:", req.query.id)
    await postController.getPostDataById(req, res)
  } catch (error) {
    next(error)
  }
})

// Delete post
router.delete("/deleteProduct/:id", async (req, res, next) => {
  try {
    console.log("Delete product request received:", req.params.id)
    await postController.deleteProduct(req, res)
  } catch (error) {
    next(error)
  }
})

// Update post
router.put("/updateProduct/:id", upload.array("images", 4), async (req, res, next) => {
  try {
    console.log("Update product request received:", {
      id: req.params.id,
      body: req.body,
      files: req.files?.length
    })
    await postController.updateProduct(req, res)
  } catch (error) {
    next(error)
  }
})

// Update status
router.patch("/updateProductStatus/:id", async (req, res, next) => {
  try {
    console.log("Update status request received:", {
      id: req.params.id,
      status: req.body.status
    })
    await postController.updateProductStatus(req, res)
  } catch (error) {
    next(error)
  }
})

module.exports = router