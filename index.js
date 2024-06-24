require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("./models/user");
const postModel = require("./models/post");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

// Routes
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  let { username, email, password, age } = req.body;

  try {
    let user = await userModel.findOne({ email });
    if (user) {
      return res.status(500).send("User already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    user = await userModel.create({
      username,
      email,
      age,
      password: hash,
    });

    const token = jwt.sign(
      { email: email, userid: user._id },
      process.env.JWT_SECRET
    );
    res.cookie("token", token);
    res.redirect("/profile");
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).send("Error in user registration");
  }
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  try {
    let user = await userModel.findOne({ email });
    if (!user) {
      return res.status(500).send("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(500).send("Invalid password");
    }

    const token = jwt.sign(
      { email: email, userid: user._id },
      process.env.JWT_SECRET
    );
    res.cookie("token", token);
    res.redirect("/profile");
  } catch (error) {
    console.error("Error in user login:", error);
    res.status(500).send("Error in user login");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel
      .findOne({ email: req.user.email })
      .populate("posts");
    res.render("profile", { user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).send("Error fetching user profile");
  }
});

app.post("/post", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email });
    let post = await postModel.create({
      user: user._id,
      content: req.body.content,
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Error creating post");
  }
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
  try {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");
    if (post.likes.includes(req.user.userid)) {
      post.likes = post.likes.filter((id) => id !== req.user.userid);
    } else {
      post.likes.push(req.user.userid);
    }
    await post.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).send("Error liking post");
  }
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  try {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");
    res.render("edit", { post });
  } catch (error) {
    console.error("Error fetching post for editing:", error);
    res.status(500).send("Error fetching post for editing");
  }
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  try {
    await postModel.findOneAndUpdate(
      { _id: req.params.id },
      { content: req.body.content }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).send("Error updating post");
  }
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send("Please login first");
  }

  try {
    let data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data;
    next();
  } catch (err) {
    return res.status(401).send("Invalid token, please login again.");
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
