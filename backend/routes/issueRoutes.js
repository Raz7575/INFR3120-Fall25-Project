const express = require("express");
const Issue = require("../models/Issue");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all issues (public)
router.get("/", async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get single issue (public)
router.get("/:id", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create issue (protected)
router.post("/", auth, async (req, res) => {
  try {
    const issue = await Issue.create({
      ...req.body,
      createdBy: req.user.userId
    });
    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update issue (protected)
router.put("/:id", auth, async (req, res) => {
  try {
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete issue (protected)
router.delete("/:id", auth, async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    res.json({ message: "Issue deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
