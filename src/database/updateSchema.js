const mongoose = require("mongoose")
require("dotenv").config()

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("Connected to MongoDB for schema update")
    return mongoose.connection
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

// Update schema for existing documents
async function updateSchema() {
  const db = await connectToDatabase()

  try {
    // Get the posts collection
    const collection = db.collection("posts")

    // Update all documents to add the missing fields
    const result = await collection.updateMany(
      {
        $or: [{ size: { $exists: false } }, { numberOfPieces: { $exists: false } }, { thickness: { $exists: false } }],
      },
      {
        $set: {
          size: "",
          thickness: "",
          numberOfPieces: null,
        },
      },
      { upsert: false },
    )

    console.log(`Schema update completed. Modified ${result.modifiedCount} documents.`)
  } catch (error) {
    console.error("Schema update error:", error)
  } finally {
    await mongoose.connection.close()
    console.log("Database connection closed")
  }
}

// Run the schema update
updateSchema()

