const Attendance = require("../models/attendanceModel");
const asyncHandler = require("express-async-handler");

// Fetch employee name by id
const getEmployeeNameById = asyncHandler(async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      employeeId: req.params.id,
    }).populate("employeeId", "name");
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }
    res.json({ name: attendance.employeeId.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Mark attendance
const markAttendance = asyncHandler(async (req, res) => {
  try {
    const { employeeId, isPresent, date } = req.body;
    console.log("body is ", req.body);
    const data = await Attendance.findOne({ employeeId, date });
    if (data) {
      await updateEmployeeProfile(req, res);
      return res.status(200).json({ msg: "already present" });
    }
    const attendance = new Attendance({
      employeeId,
      date,
      isPresent: isPresent === "true" ? true : false,
    });
    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// update attendance
const updateEmployeeProfile = asyncHandler(async (req, res) => {
  try {
    const data = await Attendance.findOneAndUpdate(
      { employeeId: req.body.employeeId, date: req.body.date },
      {
        $set: {
          isPresent: req.body.isPresent,
        },
      }
    );
    // console.log("Attendence has been marked");
  } catch (error) {
    console.error("Error while updating attendance", error.message);
    res.status(500).json({ msg: error.message });
  }
});

const getAttendanceByEmployeeId = async (req, res) => {
  const employeeId = req.params.id;

  try {
    const attendanceRecords = await Attendance.find({ employeeId: employeeId });

    res.status(200).json({
      success: true,
      data: attendanceRecords, //it stores attendance record in form of array
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  markAttendance,
  getEmployeeNameById,
  getAttendanceByEmployeeId,
};
