const express = require("express");
const jwt = require("jsonwebtoken");
const { db } = require("../db");
const { users } = require("../db/schema");
const { sendOTP } = require("../utils/email");
const { eq, and, gt } = require("drizzle-orm");
const router = express.Router();

router.post("/send-otp", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0 && existingUser[0].is_verified) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser.length > 0) {
      await db.update(users).set({ otp, otp_expiry: expiry, name }).where(eq(users.email, email));
    } else {
      await db.insert(users).values({ name, email, otp, otp_expiry: expiry });
    }

    const emailSent = await sendOTP(email, otp);
    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const userResult = await db.select().from(users).where(eq(users.email, email));
    if (userResult.length === 0) return res.status(400).json({ error: "User not found" });

    const user = userResult[0];
    if (user.is_verified) return res.status(400).json({ error: "User already verified" });
    if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
    if (new Date() > new Date(user.otp_expiry)) return res.status(400).json({ error: "OTP expired" });

    await db.update(users).set({ is_verified: true, password, otp: null, otp_expiry: null }).where(eq(users.id, user.id));

    res.json({ message: "Registration successful" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await db.select().from(users).where(eq(users.email, email));
    if (userResult.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = userResult[0];
    if (!user.is_verified) return res.status(401).json({ error: "Please verify your email first" });
    if (user.password !== password) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    
    res.cookie("token", token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
    });

    res.json({ name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

router.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ name: decoded.name, email: decoded.email, role: decoded.role });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
