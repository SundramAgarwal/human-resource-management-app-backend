const express = require("express");
const {
  registerAdmin,
  loginAdmin,
  logout,
  getAdmin,
  loginStatus,
  updateAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/adminController");
const protect = require("../middleWare/authMiddleware");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/logout", logout);
router.get("/getadmin", protect, getAdmin);
router.get("/loggedin", loginStatus);
router.patch("/updateadmin", protect, updateAdmin);
router.patch("/changepassword", protect, changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

module.exports = router;
