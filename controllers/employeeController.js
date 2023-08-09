const asyncHandler = require("express-async-handler");
const Employee = require("../models/employeeModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const EmployeeToken = require("../models/employeeTokenModel");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

//create employee
const createEmployee = asyncHandler(async (req, res) => {
  // console.log("req from frontend -->",req.body);
  const {
    first_name,
    last_name,
    employee_code,
    department,
    designation,
    role,
    class_assigned,
    gender,
    blood_group,
    contact_number,
    date_of_birth,
    date_of_joining,
    email,
    address,
  } = req.body;

  //validation of request
  if (
    !first_name ||
    !last_name ||
    !department ||
    !designation ||
    !role ||
    !class_assigned ||
    !gender ||
    !blood_group ||
    !contact_number ||
    !date_of_birth ||
    !date_of_joining ||
    !email ||
    !address
  ) {
    res.status(400);
    throw new Error("Please fill in all fields!");
  }

  // check if employee email already exits
  const employeeExists = await Employee.findOne({ email });

  if (employeeExists) {
    res.status(400);
    throw new Error("An employee with same email is already registered");
  }

  // Generate password
  const generatePassword = () => {
    const randomNumbers = Math.floor(Math.random() * 9000) + 1000;
    return `${first_name.slice(0, 4)}${randomNumbers}`;
  };
  const password = generatePassword();

  // create employees
  const employee = await Employee.create({
    admin: req.admin.id,
    first_name,
    last_name,
    employee_code,
    department,
    designation,
    role,
    class_assigned,
    gender,
    blood_group,
    contact_number,
    date_of_birth,
    date_of_joining,
    email,
    address,
    password,
  });

  // Send email
  const message = `Your account for the HR management system has been created. Your password is ${password}.`;

  const subject =
    "Password For your registered Account at your xyz organization's portal";
  const send_to = email;
  const sent_from = process.env.EMAIL_ADMIN;

  try {
    await sendEmail(subject, message, send_to, sent_from);
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent please try again");
  }

  if (employee) {
    const {
      _id,
      first_name,
      last_name,
      employee_code,
      department,
      designation,
      role,
      class_assigned,
      gender,
      blood_group,
      contact_number,
      date_of_birth,
      date_of_joining,
      email,
      address,
      image,
    } = employee;
    res.status(201).json({
      _id,
      first_name,
      last_name,
      employee_code,
      department,
      designation,
      role,
      class_assigned,
      gender,
      blood_group,
      contact_number,
      date_of_birth,
      date_of_joining,
      email,
      address,
      image,
      message: "password Email Sent",
    });
  } else {
    res.status(400);
    throw new Error("Invalid employee data!");
  }
});

// Login employee
const loginEmployee = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // validate request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password!");
  }

  // check if employee exists
  const employee = await Employee.findOne({ email });
  if (!employee) {
    res.status(400);
    throw new Error("Employee not found please sign up!");
  }
  console.log(employee);
  // Employee exists , check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, employee.password);

  // Generate Token
  const token = generateToken(employee._id);

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

  if (employee && passwordIsCorrect) {
    const {
      _id,
      first_name,
      last_name,
      employee_code,
      department,
      designation,
      password,
      role,
      class_assigned,
      gender,
      blood_group,
      contact_number,
      date_of_birth,
      date_of_joining,
      email,
      address,
      image,
    } = employee;
    res.status(201).json({
      _id,
      first_name,
      last_name,
      employee_code,
      department,
      designation,
      password,
      role,
      class_assigned,
      gender,
      blood_group,
      contact_number,
      date_of_birth,
      date_of_joining,
      email,
      address,
      image,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password!");
  }
});

//logout Employee
const logoutEmployee = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none", // they are executed when deployed
    secure: true,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

//get employee login status
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

//get all employee
const getEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ admin: req.admin.id }).sort(
    "-createdAt"
  );
  res.status(200).json(employees);
});

//get single employee
const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  //if employee doesnot exist
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found!");
  }
  //match employee to its admin
  if (employee.admin.toString() != req.admin.id) {
    res.status(401);
    throw new Error("admin not authorized!");
  }
  res.status(200).json(employee);
});

// get a single employee by employeeitself
const getEmployeeItself = asyncHandler(async (req, res) => {
  if (!req.employee) {
    res.status(400);
    throw new Error("employee not found!");
  }

  const employee = await Employee.findById(req.employee.id);
  if (employee) {
    res.status(200).json(employee);
  } else {
    res.status(400);
    throw new Error("employee not found!");
  }
});

//delete a employee
const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  //if employee does not exist
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found!");
  }
  if (employee.admin.toString() != req.admin.id) {
    res.status(401);
    throw new Error("admin not authorized!");
  }
  await Employee.deleteOne({ _id: req.params.id });
  // console.log(employee.remove);
  // console.log(await employee.remove());
  res.status(200).json({ message: "Employee remove successfully!" });
});

//change password
const changePassword = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.employee._id);
  const { oldPassword, password } = req.body;
  if (!employee) {
    res.status(400);
    throw new Error("Employee not found please signup");
  }
  //validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password!");
  }

  //check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(
    oldPassword,
    employee.password
  );

  // save new password
  if (employee && passwordIsCorrect) {
    employee.password = password;
    await employee.save();
    res.status(200).send("Password changed successfully!");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect!");
  }
});

//forget password for employee
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log(req.body);
  const employee = await Employee.findOne({ email });
  if (!employee) {
    res.status(404);
    throw new Error("employee does not exist");
  }

  //Delete token if it exists in DB
  let token = await EmployeeToken.findOne({
    employeeId: employee._id,
  });
  if (token) {
    await token.deleteOne();
  }

  // create reset token
  let resetToken = crypto.randomBytes(32).toString("hex") + employee._id;

  //hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // save token to DB
  await new EmployeeToken({
    employeeId: employee._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), //thirty minutes
  }).save();

  // reset url
  const resetUrl = `${process.env.FRONTEND_URL}/employeeresetpassword/${resetToken}`;

  //reset email
  const message = `
    <h2>Hello ${employee.first_name}</h2>
    <p>Please use the url below to reset your password</p>
    <p>This reset link is only available for 30 minutes.</p>

    <a href = ${resetUrl} clicktracking = off>
    ${resetUrl}</a>

    <p>Regards...</p>
    <p>HRM team</p>
    `;

  const subject = "Password Reset Request";
  const send_to = employee.email;
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

//reset password for employee
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // hash the token then compare to that one in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //find token in DB

  const employeeToken = await EmployeeToken.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!employeeToken) {
    res.status(404);
    throw new Error("Invalid or expired token!");
  }

  //find employee
  const employee = await Employee.findOne({ _id: employeeToken.employeeId });
  employee.password = password;
  await employee.save();
  res.status(200).json({
    message: "Password Reset successfully ,please login",
  });
});

//update a Employee details
const updateEmployee = asyncHandler(async (req, res) => {
  // console.log("update req from frontend -->",req.body);
  const { department, designation, role, class_assigned } = req.body;

  const employee = await Employee.findById(req.params.id);

  //if employee does not exist
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found!");
  }

  //match employee to its admin
  if (employee.admin.toString() != req.admin.id) {
    res.status(401);
    throw new Error("admin not authorized!");
  }

  // update employee
  const updatedEmployee = await Employee.findByIdAndUpdate(
    { _id: req.params.id },
    {
      department,
      designation,
      role,
      class_assigned,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedEmployee);
});

//update a Employee details
const updateEmployeeItself = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.employee._id);

  if (employee) {
    const {
      employee_code,
      first_name,
      last_name,
      department,
      designation,
      role,
      class_assigned,
      contact_number,
      email,
      address,
      date_of_joining,
      date_of_birth,
      gender,
      blood_group,
      image,
    } = employee;

    employee.employee_code = employee_code;
    employee.first_name = req.body.first_name || first_name;
    employee.last_name = req.body.last_name || last_name;
    employee.contact_number = req.body.contact_number || contact_number;
    employee.email = req.body.email || email;
    employee.address = req.body.address || address;
    employee.date_of_birth = req.body.date_of_birth || date_of_birth;
    employee.blood_group = req.body.blood_group || blood_group;
    employee.image = req.body.image || image;
    employee.department = department;
    employee.designation = designation;
    employee.role = role;
    employee.class_assigned = class_assigned;
    employee.gender = gender;
    employee.date_of_joining = date_of_joining;

    const updatedEmployee = await employee.save();
    res.status(200).json({
      // _id: updatedEmployee._id,
      employee_code: updatedEmployee.employee_code,
      first_name: updatedEmployee.first_name,
      last_name: updatedEmployee.last_name,
      department: updatedEmployee.department,
      designation: updatedEmployee.designation,
      role: updatedEmployee.role,
      class_assigned: updatedEmployee.class_assigned,
      contact_number: updatedEmployee.contact_number,
      email: updatedEmployee.email,
      address: updatedEmployee.address,
      date_of_joining: updatedEmployee.date_of_joining,
      date_of_birth: updatedEmployee.date_of_birth,
      gender: updatedEmployee.gender,
      blood_group: updatedEmployee.blood_group,
      image: updatedEmployee.image,
    });
  } else {
    res.status(404);
    throw new Error("Employee not found!");
  }
});

module.exports = {
  createEmployee,
  loginEmployee,
  logoutEmployee,
  loginStatus,
  getEmployees,
  getEmployee,
  getEmployeeItself,
  deleteEmployee,
  changePassword,
  forgotPassword,
  resetPassword,
  updateEmployee,
  updateEmployeeItself,
};
