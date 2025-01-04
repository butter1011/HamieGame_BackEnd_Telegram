const express = require("express");
const router = express.Router();
const useinfoController = require("../controllers/userinfo");

// Find the user info and if not save the user data
router.post("/api/v1/user", useinfoController.userFindSave);
router.post("/api/v1/update", useinfoController.userDataSave);
router.post("/api/v2/userlist", useinfoController.userList);
router.get("/api/v2/admin", useinfoController.getUsersByNameAndScore);

module.exports = router;