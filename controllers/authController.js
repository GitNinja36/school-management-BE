import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';
import prisma from "../config/db.js";
import twilio from "twilio";
import jwt from "jsonwebtoken";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);


export const register = async (req, res) => {
  const { name, email, password, role, phone, address, photo } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        address,
        photo,
      },
    });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, role: user.role });
    res.setHeader("Authorization", `Bearer ${token}`);
    res.setHeader("User", user.role);
    res.setHeader("Name", user.name);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const sendOtp = async (req, res) => {
  const { phone } = req.body;

  try {
    const user = await prisma.users.findFirst({
      where: { phone },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: `+91${phone}`,
        channel: "sms",
      });

    res.status(200).json({
      message: "OTP sent successfully",
      sid: verification.sid,
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: `+91${phone}`,
        code: otp,
      });

    if (verificationCheck.status === 'approved') {
      const user = await prisma.users.findFirst({
        where: { phone },
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      const token = generateToken({ id: user.id, role: user.role });

      res.setHeader("Authorization", `Bearer ${token}`);
      res.setHeader("User", user.role);
      res.setHeader("Name", user.name);

      return res.status(200).json({
        message: "OTP verified successfully. Logged in.",
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
          phone: user.phone,
        },
      });
    } else {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ error: "OTP verification failed", details: err.message });
  }
};