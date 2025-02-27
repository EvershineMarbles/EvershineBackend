const mongoose = require("mongoose");

function dbConnect() {
  mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

module.exports = dbConnect;