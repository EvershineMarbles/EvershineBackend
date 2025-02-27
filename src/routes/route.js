const express = require("express")
const router = express.Router()
const bodyParser = require("body-parser")
const multer = require("multer")

// Increase payload size limits
router.use(bodyParser.json({ limit: "50mb" }))
router.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }))
router.use(express.static("public"))

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

// Create new post
router.post("/create-post", upload.array("images", 4), (req, res, next) => {
  try {
    console.log("Received request body:", req.body)
    console.log("Received files:", req.files)
    postController.createPost(req, res)
  } catch (error) {
    next(error)
  }
})

// Get post by ID
router.get("/getPostDataById", (req, res, next) => {
  try {
    postController.getPostDataById(req, res)
  } catch (error) {
    next(error)
  }
})

// Get all posts
router.get("/getAllProducts", (req, res, next) => {
  try {
    postController.getAllProducts(req, res)
  } catch (error) {
    next(error)
  }
})

// Delete post by ID
router.delete("/deleteProduct/:id", (req, res, next) => {
  try {
    postController.deleteProduct(req, res)
  } catch (error) {
    next(error)
  }
})

// Update post by ID
router.put("/updateProduct/:id", upload.array("images", 4), (req, res, next) => {
  try {
    postController.updateProduct(req, res)
  } catch (error) {
    next(error)
  }
})

// Update post status
router.patch("/updateProductStatus/:id", (req, res, next) => {
  try {
    postController.updateProductStatus(req, res)
  } catch (error) {
    next(error)
  }
})

module.exports = router