const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });

    res.json({ message: "User registered successfully", userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful", token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;