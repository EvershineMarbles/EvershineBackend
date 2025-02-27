const mongoose = require("mongoose")

const dbConnect = async () => {
  try {
    // Hardcoded MongoDB URI for testing
    const MONGODB_URI = "mongodb+srv://osomeblosome:sTrQNC1gFqNL9BCE@cluster0.axazp.mongodb.net/product?retryWrites=true&w=majority"

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }

    console.log("Connecting to MongoDB...")
    
    const connection = await mongoose.connect(MONGODB_URI, options)
    
    console.log("MongoDB Connected Successfully!")
    console.log("Connected to database:", connection.connection.name)

    return connection
  } catch (error) {
    console.error("MongoDB connection error:", {
      message: error.message,
      code: error.code,
      codeName: error.codeName
    })
    throw error
  }
}

module.exports = dbConnect