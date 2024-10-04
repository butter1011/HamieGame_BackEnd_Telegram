const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB using the environment variable
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));
