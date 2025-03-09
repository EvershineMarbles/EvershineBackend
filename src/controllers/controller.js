// Only modifying the getPostDataById function for brevity
const Post = require("../models/Post") // Import the Post model

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

    if (!post || post.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "Post not found",
      })
    }

    // Add missing fields to the response if they don't exist
    if (post[0]) {
      const productData = post[0].toObject()
      console.log("Raw product data from database:", JSON.stringify(productData, null, 2))

      // FORCE add these fields to the response regardless of whether they exist in the database
      productData.size = productData.size || ""
      productData.thickness = productData.thickness || ""
      productData.numberOfPieces = productData.numberOfPieces !== undefined ? productData.numberOfPieces : null

      console.log("Modified product data with forced fields:", JSON.stringify(productData, null, 2))

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

