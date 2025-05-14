import express from "express";
import {
    getParentProfile, 
    getSpecificParentProfile,
    getStudents
} from "../controllers/principleController.js";
import { getTeachers } from "../controllers/teacherController.js";

const router = express.Router();

router.post("/students", getStudents);
router.get("/teachers", getTeachers);
router.get("/parents", getParentProfile);
router.post("/parent", getSpecificParentProfile);

export default router;