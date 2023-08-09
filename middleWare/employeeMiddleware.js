const asyncHandler = require("express-async-handler");
const Employee = require("../models/employeeModel");
const jwt = require("jsonwebtoken");

const EmployeeProtect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }
    //verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    //get the employee id from token
    const employee = await Employee.findById(verified.id).select("-password");

    if (!employee) {
      res.status(401);
      throw new Error("employee not found!");
    }
    req.employee = employee;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});
module.exports = EmployeeProtect;
