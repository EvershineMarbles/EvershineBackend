const express = require("express")
const router = express.Router()
const { createPost } = require("../controllers/controller")
const upload = require("../common/helper")

// Debug route to test API
router.get('/test', (req, res) => {
  res.json({ message: 'API is working' })
})

// Log incoming requests
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers
  })
  next()
})

// Create post route with error handling
router.post("/create-post", upload.array("images", 4), async (req, res) => {
  try {
    console.log('Received create-post request:', {
      files: req.files?.length,
      body: req.body
    })
    
    // Call your existing controller
    await createPost(req, res)
  } catch (error) {
    console.error('Error in create-post:', error)
    res.status(500).json({
      success: false,
      msg: error.message || 'Internal server error'
    })
  }
})

module.exports = router