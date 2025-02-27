const mongoose = require("mongoose");

function dbConnect() {
  mongoose
  .connect("mongodb+srv://osomeblosome:sTrQNC1gFqNL9BCE@cluster0.0omkg.mongodb.net/evershine?retryWrites=true&w=majority&appName=Cluster0", {

     useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

module.exports = dbConnect;
