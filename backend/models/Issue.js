const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  location: { type: String, required: true },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
  status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Issue", IssueSchema);
