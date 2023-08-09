const asyncHandler = require("express-async-handler");
const LeaveApplication = require("../models/leaveApplicationModel");
const sendEmail = require("../utils/sendEmail");
const Employee = require("../models/employeeModel");

//apply for leave
const createLeave = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, reason } = req.body;
  const adminId = req.employee.admin;
  const employeeId = req.employee.id; //is jagha hum jo employee id hai vo employeeprotect se mil rahi hai jo token se employee id nikal raha hai
  try {
    const currentDateTime = new Date().toISOString();

    // Update status of pending leave applications whose end date has passed
    const expiredLeaves = await LeaveApplication.updateMany(
      {
        employeeId,
        status: "pending",
        endDate: { $lt: currentDateTime },
      },
      { status: "expired" }
    );
    console.log(
      `Number of expired leaves set to 'expired': ${expiredLeaves.nModified}`
    );

    // Update status of any existing pending leave applications for this employee to 'expired'
    const existingLeaves = await LeaveApplication.updateMany(
      {
        employeeId,
        status: "pending",
      },
      { status: "expired" }
    );
    console.log(
      `Number of existing leaves set to 'expired': ${existingLeaves.nModified}`
    );

    // Create new leave application
    const leaveApplication = await LeaveApplication.create({
      employeeId,
      adminId,
      startDate,
      endDate,
      type,
      reason,
    });
    return res.status(201).json({ leaveApplication });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

const deleteLeave = asyncHandler(async (req, res) => {
  const employeeId = req.employee.id;
  const leaveId = req.params.id;

  try {
    // Find the leave application to be deleted
    const leaveApplication = await LeaveApplication.findOne({
      _id: leaveId,
      employeeId: employeeId,
    });
    if (!leaveApplication) {
      res.status(404);
      throw new Error("Leave application not found.");
    }
    if (leaveApplication.status === "pending") {
      // Delete the leave application if its status is pending
      await LeaveApplication.deleteOne({ _id: req.params.id });
      // await leaveApplication.remove();
      res.status(200).json({
        success: true,
        message: "Leave application removed successfully.",
      });
    } else {
      // Send error response if the leave application is not pending
      res.status(400);
      throw new Error(
        "This leave application cannot be removed as it has already been processed."
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// get last leave applied by employee
const getLastLeave = asyncHandler(async (req, res) => {
  const employeeId = req.employee.id;
  try {
    // Find the last leave application for the employee
    const lastLeaveApplication = await LeaveApplication.findOne({
      employeeId: employeeId,
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!lastLeaveApplication) {
      res.status(404);
      throw new Error("Leave application not found.");
    }
    // Check if the status of the last leave application is "pending" and its start date is less than the current date
    const currentDateTime = new Date().toISOString();
    if (
      lastLeaveApplication.status === "pending" &&
      lastLeaveApplication.startDate < currentDateTime
    ) {
      // Update the status of the last leave application to "expired"
      lastLeaveApplication.status = "expired";
      await lastLeaveApplication.save();
      console.log(
        `Leave application ${lastLeaveApplication._id} set to 'expired'.`
      );
    }
    res.status(200).json({
      success: true,
      data: lastLeaveApplication,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// get all leaves applied by employee on employee panel
const getLeaveByEmployee = asyncHandler(async (req, res) => {
  const employeeId = req.employee.id;
  const leaveApplication = await LeaveApplication.find({ employeeId });
  if (leaveApplication) {
    res.status(200).json({
      success: true,
      data: leaveApplication,
    });
  } else {
    res.status(400);
    throw new Error("leaveApplication not found!");
  }
});

//get all leaves applied by employee on admin panel
const getLeaveApplicationByEmployeeId = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;
  try {
    const LeaveApplicationRecords = await LeaveApplication.find({
      employeeId: employeeId,
    });
    res.status(200).json({
      success: true,
      data: LeaveApplicationRecords,
    });
  } catch (error) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// get all leave applications with status "pending" under specific admin and employee
const getAllPendingLeaveApplications = asyncHandler(
  async (adminId, employeeId) => {
    const currentDateTime = new Date().toISOString();
    const LeaveApplicationRecords = await LeaveApplication.updateMany(
      {
        adminId: adminId,
        employeeId: employeeId,
        status: "pending",
        startDate: { $lt: currentDateTime },
      },
      {
        status: "expired",
      }
    );

    // console.log(
    //   `Number of expired leaves set to 'expired': ${LeaveApplicationRecords.nModified}`
    // );

    const pendingLeaveApplications = await LeaveApplication.find({
      adminId: adminId,
      employeeId: employeeId,
      status: "pending",
      startDate: { $gte: currentDateTime },
    })
      .sort({ createdAt: -1 })
      .limit(1);

    return pendingLeaveApplications;
  }
);

// get all leaves applied by employees under specific admin on admin panel
const getAllLeaveApplicationsByAdmin = asyncHandler(async (req, res) => {
  const adminId = req.admin.id;

  try {
    // Get all employees under the admin
    const employees = await Employee.find({ admin: adminId });

    // Collect all pending leave applications from each employee
    const leaveApplications = [];
    for (let i = 0; i < employees.length; i++) {
      const employeeId = employees[i]._id.toString();
      const pendingLeaveApplications = await getAllPendingLeaveApplications(
        adminId,
        employeeId
      );
      if (pendingLeaveApplications.length > 0) {
        // populate the employee details based on the employeeId field
        const populatedApplication = await LeaveApplication.findOne({
          _id: pendingLeaveApplications[0]._id,
        }).populate({
          path: "employeeId",
          select: [
            "first_name",
            "last_name",
            "department",
            "role",
            "designation",
            "email",
          ],
        });
        leaveApplications.push(populatedApplication);
      }
    }

    res.status(200).json({
      success: true,
      data: leaveApplications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// update a specific leave application for an employee
const updateLeaveApplication = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const leaveId = req.params.id;
  const admin_mail_Id = process.env.EMAIL_ADMIN;

  try {
    // Find the leave application to be updated
    const leaveApplication = await LeaveApplication.findOne({
      _id: leaveId,
      // status: "pending",
    });

    if (!leaveApplication) {
      res.status(404);
      throw new Error("Pending leave application not found!");
    }

    // Update the leave application with the given status
    leaveApplication.status = status;
    await leaveApplication.save();

    // Send email notification to the employee only if status is approved
    if (status === "approved") {
      const employee = await Employee.findById(leaveApplication.employeeId);
      const subject = "Leave Application Approved";
      const message = `Dear ${employee.first_name},\n\nYour leave application from ${leaveApplication.startDate} to ${leaveApplication.endDate} has been approved by your admin.\n\nBest regards,\nThe HR Team`;
      const send_to = employee.email;
      const sent_from = admin_mail_Id;
      try {
        await sendEmail(subject, message, send_to, sent_from);
      } catch (error) {
        res.status(500);
        throw new Error("Email not sent please try again");
      }
    }

    if (status === "rejected") {
      const employee = await Employee.findById(leaveApplication.employeeId);
      const subject = "Leave Application Rejected";
      const message = `Dear ${employee.first_name},\n\nYour leave application from ${leaveApplication.startDate} to ${leaveApplication.endDate} has been Rejected by your admin.For more information please contact to the HR team of your organization.\n\nBest regards,\nThe HR Team`;
      const send_to = employee.email;
      const sent_from = admin_mail_Id;
      try {
        await sendEmail(subject, message, send_to, sent_from);
      } catch (error) {
        res.status(500);
        throw new Error("Email not sent please try again");
      }
    }

    res.status(200).json({
      success: true,
      message: `Leave application ${status}.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = {
  createLeave,
  deleteLeave,
  getLastLeave,
  getLeaveByEmployee,
  getLeaveApplicationByEmployeeId,
  getAllLeaveApplicationsByAdmin,
  updateLeaveApplication,
};
