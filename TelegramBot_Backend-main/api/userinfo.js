const express = require("express");
const router = express.Router();
const useinfoController = require("../controllers/userinfo");
const setinfoController = require("../controllers/invite");

// Find the user info and if not save the user data
router.post("/api/v1/user", useinfoController.userFindSave);
router.post("/api/v1/update", useinfoController.userDataSave);
router.post("/api/v1/wallet", useinfoController.setWalletAddress);

// Invite API
router.post("/api/v2/invite", setinfoController.setInviteUser);


module.exports = router;