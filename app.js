require("dotenv").config();


const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;


app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(methodOverride('_method'));              // Support PUT & DELETE from forms
app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


mongoose.connect("mongodb://127.0.0.1:27017/campusIssues")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));


const issueSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  priority: String,
  status: { type: String, default: 'Open' },
  createdAt: { type: Date, default: Date.now }
});

const Issue = mongoose.model('Issue', issueSchema);

app.get('/', async (req, res) => {
  const issues = await Issue.find({});
  res.render('index', { issues });
});


app.get('/issues/create', (req, res) => {
  res.render('create');
});


app.post('/issues', async (req, res) => {
  const { title, description, location, priority } = req.body;
  const newIssue = new Issue({ title, description, location, priority });
  await newIssue.save();
  res.redirect('/');
});

app.get('/issues/:id', async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.send('Issue not found');
  res.render('show', { issue });
});


app.get('/issues/:id/edit', async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.send('Issue not found');
  res.render('edit', { issue });
});


app.put('/issues/:id', async (req, res) => {
  const { title, description, location, priority, status } = req.body;
  await Issue.findByIdAndUpdate(req.params.id, { title, description, location, priority, status });
  res.redirect('/');
});


app.delete('/issues/:id', async (req, res) => {
  await Issue.findByIdAndDelete(req.params.id);
  res.redirect('/');
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
