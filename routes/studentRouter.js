import express from "express";
import { createAttendance, getClassMonthlyAttendance, getStudentAttendance, getStudentProfile, getStudentRoutine } from "../controllers/studentController.js";

const router = express.Router();

router.get("/profile", getStudentProfile);
router.post("/routine", getStudentRoutine);
router.post("/attendance", getStudentAttendance);
router.post("/totalattendance", getClassMonthlyAttendance);
router.post("/attendance/add", createAttendance);

export default router;
