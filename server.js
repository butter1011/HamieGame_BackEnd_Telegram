const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// API
const userinfoApi = require("./api/userinfo");

// DB config
require("./libs/mongodb");

// Server configs
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors("*"));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html as the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//api
app.use(userinfoApi);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});