// require("dotenv").config();
// const cookieParser = require("cookie-parser");
// const userModel = require("./models/user");
// const postModel = require("./models/post");
// const express = require("express");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const mongoose = require("mongoose");
// const app = express();

// const PORT = process.env.PORT || 3001;

// mongoose
//   .connect(process.env.MONGODB_URI)
//   .then(() => {
//     console.log("Connected to MongoDB");
//   })
//   .catch((err) => {
//     console.error("Failed to connect to MongoDB", err);
//   });

// app.set("view engine", "ejs");
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));

// app.get("/login", (req, res) => {
//   res.render("login");
// });
// app.get("/register", (req, res) => {
//   res.render("index");
// });
// app.get("/", (req, res) => {
//   res.render("index");
// });
// app.post("/register", async (req, res) => {
//   let { username, email, password, age } = req.body;

//   let user = await userModel.findOne({ email });
//   if (user) {
//     return res.status(500).send("user already registered");
//   }

//   bcrypt.genSalt(10, (err, salt) => {
//     bcrypt.hash(password, salt, async (err, hash) => {
//       let user = await userModel.create({
//         username,
//         email,
//         age,
//         password: hash,
//       });
//       let token = jwt.sign({ email: email, userid: user._id }, "secret");
//       res.cookie("token", token);
//       res.redirect("/profile");
//     });
//   });
// });
// app.post("/login", async (req, res) => {
//   let { email, password } = req.body;

//   let user = await userModel.findOne({ email });
//   if (!user) {
//     return res.status(500).send("something went wrong");
//   }
//   //if password doesnt matches
//   bcrypt.compare(password, user.password, (err, result) => {
//     if (result) {
//       let token = jwt.sign({ email: email, userid: user._id }, "secret");
//       res.cookie("token", token);
//       res.status(200).redirect("/profile");
//     } else res.redirect("/login");
//   });
// });

// app.get("/logout", (req, res) => {
//   res.cookie("token", "");
//   res.redirect("/login");
// });
// app.get("/profile", isLoggedIn, async (req, res) => {
//   let user = await userModel
//     .findOne({ email: req.user.email })
//     .populate("posts");

//   res.render("profile", { user });
//   //   console.log(user);
// });

// app.post("/post", isLoggedIn, async (req, res) => {
//   let user = await userModel.findOne({ email: req.user.email });
//   let post = await postModel.create({
//     user: user._id,
//     content: req.body.content,
//   });
//   user.posts.push(post._id);
//   await user.save();
//   res.redirect("/profile");
// });

// app.get("/like/:id", isLoggedIn, async (req, res) => {
//   let post = await postModel.findOne({ _id: req.params.id }).populate("user");
//   if (post.likes.indexOf(req.user.userid) === -1) {
//     post.likes.push(req.user.userid);
//   } else {
//     post.likes.splice(post.likes.indexOf(req.user.userid), 1);
//   }
//   await post.save();
//   res.redirect("/profile");
// });

// app.get("/edit/:id", isLoggedIn, async (req, res) => {
//   let post = await postModel.findOne({ _id: req.params.id }).populate("user");
//   res.render("edit", { post });
// });
// app.post("/update/:id", isLoggedIn, async (req, res) => {
//   try {
//     await postModel.findOneAndUpdate(
//       { _id: req.params.id },
//       { content: req.body.content }
//     );
//     res.redirect("/profile");
//   } catch (error) {
//     res.status(500).send("Error updating post");
//   }
// });

// //a middleware for protected route - and only if we are logged in it will perform according to that
// function isLoggedIn(req, res, next) {
//   const token = req.cookies.token;

//   if (!token) {
//     // If the token is missing or empty, send a "please login first" message
//     return res.send("please login first");
//   }

//   try {
//     let data = jwt.verify(token, "secret");
//     req.user = data;
//     next();
//   } catch (err) {
//     return res.status(401).send("Invalid token, please login again.");
//   }
// }

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
require("dotenv").config();
const path = require("path");
const fs = require("fs"); // Add this line
const express = require("express");
const cookieParser = require("cookie-parser");

// Log current directory
console.log("Current directory:", process.cwd());

// Log and check the existence of the user model file
const userModelPath = path.join(__dirname, "models", "user.js");
console.log("User Model Path:", userModelPath);

fs.access(userModelPath, fs.constants.F_OK, (err) => {
  if (err) {
    console.error("User model file does not exist:", userModelPath);
  } else {
    console.log("User model file exists:", userModelPath);
  }
});

// Continue requiring models as usual
const userModel = require("./models/user");
const postModel = require("./models/post");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 10000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("index");
});

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/register", async (req, res) => {
  let { username, email, password, age } = req.body;

  let user = await userModel.findOne({ email });
  if (user) {
    return res.status(500).send("User already registered");
  }

  bcrypt.genSalt(10, async (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        email,
        age,
        password: hash,
      });

      let token = jwt.sign(
        { email: email, userid: user._id },
        process.env.JWT_SECRET
      );
      res.cookie("token", token);
      res.redirect("/profile");
    });
  });
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) {
    return res.status(500).send("User not found");
  }

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign(
        { email: email, userid: user._id },
        process.env.JWT_SECRET
      );
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else {
      res.redirect("/login");
    }
  });
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
    res.status(500).send("Error liking post");
  }
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  try {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");
    res.render("edit", { post });
  } catch (error) {
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

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
