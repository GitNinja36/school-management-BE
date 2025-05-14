import express from "express";
import {createPerformance, insertStudentPerformance, getStudentPerformance} from "../controllers/performanceController.js"

const router = express.Router();

router.post("/create", insertStudentPerformance);
router.post("/create/all", createPerformance);
router.post("/all", getStudentPerformance);

export default router;
