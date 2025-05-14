import express from "express";
import { addNotice, getNotice } from "../controllers/noticeController.js";

const router = express.Router();

router.post("/new", addNotice);
router.get("/all", getNotice);

export default router;