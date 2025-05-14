import express from "express";
import { getClassRepresentatives, insertClassRepresentative } from "../controllers/classRepresentativeController.js";

const router = express.Router();

router.post("/create",insertClassRepresentative);
router.get("/all", getClassRepresentatives);

export default router;