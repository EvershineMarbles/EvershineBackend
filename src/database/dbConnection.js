const mongoose = require("mongoose")

const dbConnect = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables")
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }

    console.log("Connecting to MongoDB...")
    
    const connection = await mongoose.connect(process.env.MONGODB_URI, options)
    
    console.log("MongoDB Connected Successfully!")
    console.log("Connected to database:", connection.connection.name)

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err)
    })

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected")
    })

    return connection
  } catch (error) {
    console.error("MongoDB connection error:", {
      message: error.message,
      code: error.code,
      codeName: error.codeName
    })
    throw error // Re-throw the error to be caught by the caller
  }
}

module.exports = dbConnect
