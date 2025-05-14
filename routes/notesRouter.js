import express from "express";
import { insertNote, getNotes } from "../controllers/notesController.js";

const router = express.Router();

router.post("/add", insertNote);
router.post("/all", getNotes);

export default router;
