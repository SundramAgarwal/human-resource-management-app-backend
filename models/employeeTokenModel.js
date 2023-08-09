const mongoose = require("mongoose");

const employeeTokenSchema = mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Employee",
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const EmployeeToken = mongoose.model("EmployeeToken", employeeTokenSchema);
module.exports = EmployeeToken;
