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

    // Find all documents
    const documents = await collection.find({}).toArray()
    console.log(`Found ${documents.length} documents to check`)

    // Count documents missing each field
    const missingSize = documents.filter((doc) => !("size" in doc)).length
    const missingNumberOfPieces = documents.filter((doc) => !("numberOfPieces" in doc)).length
    const missingThickness = documents.filter((doc) => !("thickness" in doc)).length

    console.log(`Documents missing 'size': ${missingSize}`)
    console.log(`Documents missing 'numberOfPieces': ${missingNumberOfPieces}`)
    console.log(`Documents missing 'thickness': ${missingThickness}`)

    // Update all documents to add the missing fields
    const result = await collection.updateMany(
      {}, // Match all documents
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

    // Verify the update
    const updatedDocs = await collection.find({}).toArray()
    const stillMissingSize = updatedDocs.filter((doc) => !("size" in doc)).length
    const stillMissingNumberOfPieces = updatedDocs.filter((doc) => !("numberOfPieces" in doc)).length
    const stillMissingThickness = updatedDocs.filter((doc) => !("thickness" in doc)).length

    console.log(`After update - Documents still missing 'size': ${stillMissingSize}`)
    console.log(`After update - Documents still missing 'numberOfPieces': ${stillMissingNumberOfPieces}`)
    console.log(`After update - Documents still missing 'thickness': ${stillMissingThickness}`)
  } catch (error) {
    console.error("Schema update error:", error)
  } finally {
    await mongoose.connection.close()
    console.log("Database connection closed")
  }
}

// Run the schema update
updateSchema()

