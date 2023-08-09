const express = require("express");
const {
  markAttendance,
  getAttendanceByEmployeeId,
} = require("../controllers/attendanceController");
const protect = require("../middleWare/authMiddleware");

const router = express.Router();

router.post("/", protect, markAttendance);
router.get("/getAttendance/:id", getAttendanceByEmployeeId);

module.exports = router;
