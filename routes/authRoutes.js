import express from "express";
import { register, login, sendOtp, verifyOTP } from "../controllers/authController.js";

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOTP);

export default router;