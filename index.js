const express = require("express")
const cors = require("cors")
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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  optionsSuccessStatus: 200
}))

// Body parser middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Route logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Health check route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Evershine API Server is running",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  })
})

// API routes
app.use("/api", routes)

// 404 handler
app.use((req, res) => {
  console.log(`404 - Not Found: ${req.method} ${req.path}`)
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  })

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    timestamp: new Date().toISOString()
  })
})

// Initialize server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await dbConnect()
    
    // Start Express server
    const PORT = process.env.PORT || 8000
    app.listen(PORT, () => {
      console.log(`
Server is running!
==================
- Port: ${PORT}
- Environment: ${process.env.NODE_ENV}
- Health Check: http://localhost:${PORT}/
- API Base URL: http://localhost:${PORT}/api
==================
      `)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

// Start the server
startServer()