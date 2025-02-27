const express = require("express")
const cors = require("cors")
const routes = require("./src/routes/route")
const dbConnect = require("./src/database/dbConnection")
const app = express()

// Updated CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://evershine-two.vercel.app",
    "https://evershine-two-git-main-evershines-projects.vercel.app",
    "https://evershine-two-evershines-projects.vercel.app",
    "https://evershine-git-main-evershines-projects.vercel.app",
    "https://evershine-qaq7so0sm-evershines-projects.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
}))

// Add a health check route
app.get("/", (req, res) => {
  res.json({ message: "Server is running" })
})

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Connect to database
dbConnect()

// Routes
app.use("/api", routes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error details:", {
    message: err.message,
    stack: err.stack,
    name: err.name
  })

  res.status(err.status || 500).json({
    success: false,
    msg: err.message || "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(`Server is Running on port ${PORT}`)
})