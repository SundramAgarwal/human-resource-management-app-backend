const asyncHandler = require("express-async-handler");
const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }
    //verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    //get the admin id from token
    const admin = await Admin.findById(verified.id).select("-password");

    if (!admin) {
      res.status(401);
      throw new Error("admin not found!");
    }
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});
module.exports = protect;
