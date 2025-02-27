const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const routes = require("./src/routes/route")
const dbConnect = require("./src/database/dbConnection")

const app = express()

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://evershine-two.vercel.app",
    "https://evershine-two-git-main-evershines-projects.vercel.app",
    "https://evershine-two-evershines-projects.vercel.app",
    "https://evershine-git-main-evershines-projects.vercel.app",
    "https://evershine-qaq7so0sm-evershines-projects.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}))

// Middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check
app.get("/", (req, res) => {
  res.json({ 
    status: "ok",
    message: "Server is running",
    dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  })
})

// Routes
app.use("/api", routes)

// Start server
const PORT = process.env.PORT || 8000

const startServer = async () => {
  try {
    await dbConnect()
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error("Server startup failed:", error.message)
    process.exit(1)
  }
}

startServer()