const express = require("express")
const cors = require("cors")
const routes = require("./src/routes/route")
const dbConnect = require("./src/database/dbConnection")
const app = express()

// Updated CORS configuration with all possible Vercel domains
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
  allowedHeaders: [
    "Content-Type", 
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
}))

// Enhanced health check route
app.get("/", (req, res) => {
  res.json({ 
    status: "ok",
    message: "Evershine API Server is running",
    timestamp: new Date().toISOString(),
    cors: {
      enabled: true,
      origins: app.get('cors').origin
    }
  })
})

// Increased payload limits
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Database connection
dbConnect()

// API routes
app.use("/api", routes)

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error("Error details:", {
    message: err.message,
    stack: err.stack,
    name: err.name,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  res.status(err.status || 500).json({
    success: false,
    msg: err.message || "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    msg: "Route not found",
    path: req.path,
    method: req.method
  })
})

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(`Server is Running on port ${PORT}`)
  console.log(`Health check available at: http://localhost:${PORT}`)
  console.log(`API endpoints available at: http://localhost:${PORT}/api`)
})