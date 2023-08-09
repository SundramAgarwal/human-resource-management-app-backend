const express = require("express");
const EmployeeProtect = require("../middleWare/employeeMiddleware");
const {
    createLeave,
    getLeaveByEmployee,
    getLastLeave,
    getLeaveApplicationByEmployeeId,
    getAllLeaveApplicationsByAdmin,
    updateLeaveApplication,
    deleteLeave,
  } = require("../controllers/leaveApplicationController");
const protect = require("../middleWare/authMiddleware");
const router = express.Router();


router.post("/", EmployeeProtect, createLeave);
router.delete("/:id",EmployeeProtect,deleteLeave)
router.get("/",EmployeeProtect,getLastLeave)
router.get("/leaves",EmployeeProtect,getLeaveByEmployee);


router.get("/leaves/:id",protect,getLeaveApplicationByEmployeeId)
router.get("/allLeaves",protect,getAllLeaveApplicationsByAdmin)
router.patch("/updateLeave/:id",protect,updateLeaveApplication)


module.exports = router;