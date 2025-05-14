import express from "express";
import { getFinanceReport, insertFinanceRecord, getFinanceRecords, insertFinanceEntry } from "../controllers/financeController.js";

const router = express.Router();

router.post("/checkbook/create", insertFinanceRecord);
router.post("/all", getFinanceReport);
router.post("/checkbook/all", getFinanceRecords);
router.post("/create", insertFinanceEntry);

export default router;