const mongoose = require("mongoose");

function dbConnect() {
  mongoose
    .connect("mongodb+srv://laveshcharmteam:jT1zEfVfIaWhgOCs@cluster0.axazp.mongodb.net/product", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

module.exports = dbConnect;
