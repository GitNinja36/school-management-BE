import express from "express";
import { addStudent, addTeacher, insertRoutine } from "../controllers/adminController.js";

const router = express.Router();

router.post("/student",addStudent);
router.post("/teacher", addTeacher);
router.post("/routine/create", insertRoutine);

export default router;