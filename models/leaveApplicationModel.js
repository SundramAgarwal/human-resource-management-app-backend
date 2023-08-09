const mongoose = require("mongoose");
const leaveApplicationSchema = mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Employee",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Admin",
    },
    startDate: {
      type: String,
      required: true,
      trim: true,
    },
    endDate: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Add a pre-save hook to update the status automatically
leaveApplicationSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("startDate")) {
    const currentDate = new Date();
    const startDate = new Date(this.startDate);
    if (currentDate > startDate) {
      this.status = "expired";
    }
  }
  next();
});

const LeaveApplication = mongoose.model(
  "LeaveApplication",
  leaveApplicationSchema
);
module.exports = LeaveApplication;
