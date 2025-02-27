const express = require("express")
const cors = require("cors")
const routes = require("./src/routes/route")
const dbConnect = require("./src/database/dbConnection")
const app = express()

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://evershine-marbles.vercel.app",
    "https://evershine-marbles-git-main-sonalbaheti.vercel.app",
    "https://evershine-marbles-sonalbaheti.vercel.app",
    "https://evershine-two.vercel.app/"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}))

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