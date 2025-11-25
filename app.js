

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");

const Issue = require("./models/Issue");
const User = require("./models/User");

const app = express();


mongoose
  .connect("mongodb://127.0.0.1:27017/campusIssues")
  .then(() => {
    console.log("MongoDB connected!");
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));


app.use(
  session({
    secret: "super-secret-session-key-change-me", 
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/campusIssues"
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 
    }
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}


app.get("/", async (req, res) => {
  const issues = await Issue.find().sort({ createdAt: -1 });
  res.render("index", { issues });
});

app.get("/issues/create", (req, res) => {
  res.render("create");
});

app.post("/issues", async (req, res) => {
  await Issue.create(req.body);
  res.redirect("/");
});

app.get("/issues/:id", async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  res.render("show", { issue });
});

app.get("/issues/:id/edit", requireLogin, async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  res.render("edit", { issue });
});

app.put("/issues/:id", requireLogin, async (req, res) => {
  await Issue.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/");
});

app.delete("/issues/:id", requireLogin, async (req, res) => {
  await Issue.findByIdAndDelete(req.params.id);
  res.redirect("/");
});


app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  await User.create({ username, password: hashed });

  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.send("Invalid username or password");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.send("Invalid username or password");
  }

  req.session.userId = user._id;
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
