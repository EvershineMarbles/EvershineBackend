const mongoose = require("mongoose")
require("dotenv").config()

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("Connected to MongoDB for migration")
    return mongoose.connection
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

// Migration function to add missing fields to existing documents
async function migrateProducts() {
  const db = await connectToDatabase()

  try {
    // Get the Post collection
    const collection = db.collection("posts")

    // Find all documents that don't have the new fields
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
    )

    console.log(`Migration completed. Modified ${result.modifiedCount} documents.`)
  } catch (error) {
    console.error("Migration error:", error)
  } finally {
    await mongoose.connection.close()
    console.log("Database connection closed")
  }
}

// Run the migration
migrateProducts()

