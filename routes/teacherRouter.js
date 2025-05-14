import express from "express";
import { getAssignments, getClassTeacher, getFilteredExams, getSpecificClassTeacher, getTeacherRoutine, insertAssignment, insertExam } from "../controllers/teacherController.js";

const router = express.Router();

router.get("/classteachers", getClassTeacher);
router.post("/classteacher", getSpecificClassTeacher);
router.post("/routine", getTeacherRoutine);
router.post("/exams/all", getFilteredExams);
router.post("/exams/add", insertExam);
router.post("/assignment/all", getAssignments);
router.post("/assignment/add", insertAssignment);
export default router;
