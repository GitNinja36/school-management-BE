import express from "express";
import { addCalendarEntry, getSpecificCalendar, getAllCalendar } from "../controllers/calendarController.js";

const router = express.Router();

router.post("/add", addCalendarEntry);
router.post("/specific", getSpecificCalendar);
router.get("/all", getAllCalendar);

export default router;