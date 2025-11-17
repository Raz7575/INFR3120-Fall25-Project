
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');

const app = express();
const PORT = 3000;


app.use(express.urlencoded({ extended: true })); // Read form data
app.use(methodOverride('_method'));              // Support PUT & DELETE
app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


let issues = [];
let nextId = 1;


app.get('/', (req, res) => {
  res.render('index', { issues });
});


app.get('/issues/create', (req, res) => {
  res.render('create');
});


app.post('/issues', (req, res) => {
  const { title, description, location, priority } = req.body;

  const newIssue = {
    id: nextId++,
    title,
    description,
    location,
    priority,
    status: 'Open',
    createdAt: new Date()
  };

  issues.push(newIssue);
  res.redirect('/');
});


app.get('/issues/:id', (req, res) => {
  const issue = issues.find(i => i.id === parseInt(req.params.id));
  if (!issue) return res.send('Issue not found');
  res.render('show', { issue });
});


app.get('/issues/:id/edit', (req, res) => {
  const issue = issues.find(i => i.id === parseInt(req.params.id));
  if (!issue) return res.send('Issue not found');
  res.render('edit', { issue });
});


app.put('/issues/:id', (req, res) => {
  const issue = issues.find(i => i.id === parseInt(req.params.id));
  if (!issue) return res.send('Issue not found');

  const { title, description, location, priority, status } = req.body;

  issue.title = title;
  issue.description = description;
  issue.location = location;
  issue.priority = priority;
  issue.status = status;

  res.redirect('/');
});


app.delete('/issues/:id', (req, res) => {
  issues = issues.filter(i => i.id !== parseInt(req.params.id));
  res.redirect('/');
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
