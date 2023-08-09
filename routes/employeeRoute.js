const express = require("express");
const {
  createEmployee,
  loginEmployee,
  logoutEmployee,
  loginStatus,
  changePassword,
  getEmployees,
  getEmployee,
  getEmployeeItself,
  forgotPassword,
  resetPassword,
  deleteEmployee,
  updateEmployee,
  updateEmployeeItself,
} = require("../controllers/employeeController");
const protect = require("../middleWare/authMiddleware");
const EmployeeProtect = require("../middleWare/employeeMiddleware");
const { upload } = require("../utils/fileUpload");
const router = express.Router();

// this is for admin
router.post("/", protect, createEmployee);
router.get("/", protect, getEmployees);
router.get("/:id", protect, getEmployee);
router.delete("/:id", protect, deleteEmployee);
router.patch("/:id", protect, updateEmployee);

// this is for employee
router.post("/login", loginEmployee);
router.post("/logout", logoutEmployee);
router.post("/loggedin", loginStatus);
router.post("/forgotpassword", forgotPassword);
router.put("/employeeresetpassword/:resetToken", resetPassword);
router.post("/getEmployeeItself", EmployeeProtect, getEmployeeItself);
router.put("/changepassword", EmployeeProtect, changePassword);
router.put("/updateemployeeitself", EmployeeProtect, updateEmployeeItself);

module.exports = router;
