require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const Issue = require("./models/Issue");
const User = require("./models/User");

const app = express();

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/campusIssues";
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const PORT = process.env.PORT || 3000;

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Allow CORS for Angular frontend origin(s)
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:4200",
  credentials: true
}));

/* -----------------------
   Authentication helpers
   ----------------------- */
function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
}

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.user = payload; // { id, username, iat, exp }
    next();
  });
}

/* -----------------------
   API Routes
   ----------------------- */

/* AUTH */
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: "username already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, username: user.username, profileImage: user.profileImage } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "register failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "username and password required" });
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "invalid credentials" });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, username: user.username, profileImage: user.profileImage } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "login failed" });
  }
});

/* ISSUES (public read, protected mutate) */
// GET all
app.get("/api/issues", async (req, res) => {
  try {
    const issues = await Issue.find().populate("createdBy", "username").sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch issues" });
  }
});

// GET single
app.get("/api/issues/:id", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate("createdBy", "username");
    if (!issue) return res.status(404).json({ error: "not found" });
    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch issue" });
  }
});

// POST create (authenticated)
app.post("/api/issues", authenticateJWT, async (req, res) => {
  try {
    const { title, description, location, priority } = req.body;
    if (!title || !description || !location) return res.status(400).json({ error: "title, description, location required" });
    const issue = await Issue.create({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      priority: priority || "Low",
      createdBy: req.user.id
    });
    const populated = await Issue.findById(issue._id).populate("createdBy", "username");
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to create issue" });
  }
});

// PUT update (authenticated + owner)
app.put("/api/issues/:id", authenticateJWT, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "not found" });
    if (!issue.createdBy || issue.createdBy.toString() !== req.user.id) return res.status(403).json({ error: "forbidden" });
    const { title, description, location, priority, status } = req.body;
    issue.title = title || issue.title;
    issue.description = description || issue.description;
    issue.location = location || issue.location;
    issue.priority = priority || issue.priority;
    issue.status = status || issue.status;
    await issue.save();
    const populated = await Issue.findById(issue._id).populate("createdBy", "username");
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "update failed" });
  }
});

// DELETE (authenticated + owner)
app.delete("/api/issues/:id", authenticateJWT, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "not found" });
    if (!issue.createdBy || issue.createdBy.toString() !== req.user.id) return res.status(403).json({ error: "forbidden" });
    await issue.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "delete failed" });
  }
});

/* USER profile (get logged-in user) */
app.get("/api/me", authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "could not load user" });
  }
});

/* Serve nothing else (front-end is separate) */
app.get("/", (req, res) => res.json({ message: "API running" }));

app.listen(PORT, () => console.log(`API listening on ${PORT}`));
