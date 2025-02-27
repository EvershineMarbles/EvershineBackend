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

    await mongoose.connect(process.env.MONGODB_URI, options)
    
    console.log("MongoDB connected successfully!")
    
    // Add error handlers
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err)
    })

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected")
    })

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close()
        console.log("MongoDB connection closed through app termination")
        process.exit(0)
      } catch (err) {
        console.error("Error during MongoDB connection closure:", err)
        process.exit(1)
      }
    })

  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

module.exports = dbConnect