const express = require("express");
const Issue = require("../models/Issue");
const auth = require("../middleware/auth");

const router = express.Router();

// GET ALL
router.get("/", async (req, res) => {
  const issues = await Issue.find();
  res.json(issues);
});

// GET ONE
router.get("/:id", async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  res.json(issue);
});

// CREATE
router.post("/", auth, async (req, res) => {
  const issue = await Issue.create({
    ...req.body,
    createdBy: req.user.userId
  });
  res.json(issue);
});

// UPDATE
router.put("/:id", auth, async (req, res) => {
  const updated = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
  await Issue.findByIdAndDelete(req.params.id);
  res.json({ message: "Issue deleted" });
});

module.exports = router;
