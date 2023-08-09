const asyncHandler = require("express-async-handler");
const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const Token = require("../models/tokenModel");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};
// Register Admin
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields!");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters!");
  }
  if (password.length > 23) {
    res.status(400);
    throw new Error("Password must not be more than 23 characters!");
  }
  // check if admin email already exits
  const adminExists = await Admin.findOne({ email });

  if (adminExists) {
    res.status(400);
    throw new Error("Email has already been registered!");
  }

  // Create new admin
  const admin = await Admin.create({
    name,
    email,
    password,
  });

  // Generate Token
  const token = generateToken(admin._id);

  // send HTTP only cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), //1 day
    sameSite: "none",
    secure: true,
  });

  if (admin) {
    const { _id, name, email, photo, phone, bio } = admin;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid admin data!");
  }
});

// Login admin
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // validate request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password!");
  }

  // check if admin exists
  const admin = await Admin.findOne({ email });
  if (!admin) {
    res.status(400);
    throw new Error("Admin not found please sign up!");
  }

  // Admin exists , check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, admin.password);

  // Generate Token
  const token = generateToken(admin._id);

  // send HTTP only cookie
  if (passwordIsCorrect) {
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), //1 day
      sameSite: "none",
      secure: true,
    });
  }

  if (admin && passwordIsCorrect) {
    const { _id, name, email, photo, phone, bio } = admin;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password!");
  }
});

//logout admin
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none", // they are executed when deployed
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

//get Admin data
const getAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  if (admin) {
    const { _id, name, email, photo, phone, bio } = admin;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
    });
  } else {
    res.status(400);
    throw new Error("admin not found!");
  }
});

//get login status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  // verify the token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

//update Admin
const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  if (admin) {
    const { name, email, photo, phone, bio } = admin;
    (admin.email = email), (admin.name = req.body.name || name);
    admin.phone = req.body.phone || phone;
    admin.bio = req.body.bio || bio;
    admin.photo = req.body.photo || photo;

    const updatedAdmin = await admin.save();
    res.status(200).json({
      _id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      photo: updatedAdmin.photo,
      phone: updatedAdmin.phone,
      bio: updatedAdmin.bio,
    });
  } else {
    res.status(404);
    throw new Error("Admin not Found!");
  }
});

//change password
const changePassword = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  const { oldPassword, password } = req.body;
  if (!admin) {
    res.status(400);
    throw new Error("Admin not found please signup");
  }
  //validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password!");
  }

  //check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, admin.password);

  // save new password
  if (admin && passwordIsCorrect) {
    admin.password = password;
    await admin.save();
    res.status(200).send("Password changed successfully!");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect!");
  }
});

//forget password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log(req.body);
  const admin = await Admin.findOne({ email });
  if (!admin) {
    res.status(404);
    throw new Error("admin does not exist");
  }

  //Delete token if it exists in DB
  let token = await Token.findOne({
    adminId: admin._id,
  });
  if (token) {
    await token.deleteOne();
  }

  // create reset token
  let resetToken = crypto.randomBytes(32).toString("hex") + admin._id;

  //hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // save token to DB
  await new Token({
    adminId: admin._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), //thirty minutes
  }).save();

  // reset url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  //reset email
  const message = `
    <h2>Hello ${admin.name}</h2>
    <p>Please use the url below to reset your password</p>
    <p>This reset link is only available for 30 minutes.</p>

    <a href = ${resetUrl} clicktracking = off>
    ${resetUrl}</a>

    <p>Regards...</p>
    <p>HRM team</p>
    `;

  const subject = "Password Reset Request";
  const send_to = admin.email;
  const sent_from = process.env.EMAIL_ADMIN;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({
      success: true,
      message: "Reset Email Sent",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent please try again");
  }
});

//reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // hash the token then compare to that one in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //find token in DB

  const adminToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!adminToken) {
    res.status(404);
    throw new Error("Invalid or expired token!");
  }

  //find admin
  const admin = await Admin.findOne({ _id: adminToken.adminId });
  admin.password = password;
  await admin.save();
  res.status(200).json({
    message: "Password Reset successfully ,please login",
  });
});

module.exports = {
  registerAdmin,
  loginAdmin,
  logout,
  getAdmin,
  loginStatus,
  updateAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
};
