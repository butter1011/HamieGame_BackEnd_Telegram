const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// API
const userinfoApi = require("./api/userinfo");

// DB config
require("./libs/mongodb");

// Sever configs
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://bitcoin-millionaire-html-5.vercel.app",
      "https://frog-nut-test.vercel.app/"
    ]
  })
);

//api
app.use(userinfoApi);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
