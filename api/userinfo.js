const express = require("express");
const router = express.Router();
const useinfoController = require("../controllers/userinfo");

// Find the user info and if not save the user data
router.post("/api/v1/user", useinfoController.userFindSave);
router.post("/api/v1/update", useinfoController.userDataSave);
router.post("/api/v2/daily", useinfoController.getDailyData);
router.post("/api/v2/weekly", useinfoController.getWeeklyData);
router.post("/api/v2/weeklyforleardboard", useinfoController.getWeeklyDataForLeard);
router.post("/api/v2/total", useinfoController.getTotalData);
router.post("/api/v2/sessionCount", useinfoController.getUsersBySessionCount);
router.post("/api/v2/sessionStats", useinfoController.getSessionStats);
router.post("/api/v2/userMetrics", useinfoController.getUserMetrics);
router.post("/api/v2/frequently", useinfoController.getFrequentUsers);
module.exports = router;