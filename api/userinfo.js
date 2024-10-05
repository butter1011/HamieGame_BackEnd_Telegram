const express = require("express");
const router = express.Router();
const useinfoController = require("../controllers/userinfo");

// Find the user info and if not save the user data
router.post("/api/v1/user", useinfoController.userFindSave);
router.post("/api/v1/update", useinfoController.userDataSave);


module.exports = router;