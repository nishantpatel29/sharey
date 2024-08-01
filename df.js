if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
  }
  
  const multer = require('multer');
  const { storage } = require("./cloudconfig");
  const upload = multer({ storage });
  const express = require('express');
  const mongoose = require('mongoose');
  const flash = require('connect-flash');
  const path = require('path');
  const ejsMate = require('ejs-mate');
  const session = require('express-session');
  const MongoStore = require('connect-mongo');
  const passport = require('passport');
  const LocalStrategy = require('passport-local');
  const Users = require("./user");
  
  const app = express();
  
  // Set up EJS engine
  app.engine('ejs', ejsMate);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  
  // Middleware
  app.use(express.static(path.join(__dirname, "public")));
  app.use(express.urlencoded({ extended: true }));
  
  // Session configuration
  const sessionConfig = {
    secret: "adsdfve",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: 'mongodb://127.0.0.1:27017/sharey',
      crypto: { secret: "adsdfve" },
      touchAfter: 24 * 60 * 60
    }),
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true
    }
  };
  
  app.use(session(sessionConfig));
  app.use(flash());
  
  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(Users.authenticate()));
  passport.serializeUser(Users.serializeUser());
  passport.deserializeUser(Users.deserializeUser());
  
  // Mongoose connection
  mongoose.connect('mongodb://127.0.0.1:27017/sharey')
  
  // Routes
  app.get("/", (req, res) => {
    res.render("index");
  });
  
  app.get("/all", async (req, res) => {
    res.render("all");
  });
  
  // Login route
  app.post("/login", passport.authenticate('local', {
    failureRedirect: '/',
    failureFlash: false
  }), async (req, res) => {
    const { username } = req.body;
    let a = await Users.findByUsername(username);
    res.render("all", { a });
  });
  
  // Signup route
  app.post("/signup", async (req, res, next) => {
    const { username, password } = req.body;
    const newUser = new Users({ username });
    try {
      const user = await Users.register(newUser, password);
      req.login(user, (err) => {
        if (err) return next(err);
        res.redirect("/");
      });
    } catch (e) {
      return next(e);
    }
  });
  
  app.get("/signup", (req, res) => {
    res.render("signup");
  });
  
  app.get("/aboutus", (req, res) => {
    res.render("aboutus");
  });
  
  // Upload route
  app.post("/upload", upload.single("upload-file"), async (req, res) => {
    console.log(req.user); // Debugging log
    if (!req.file) {
      return res.status(400).render("success", { s: "No file uploaded" });
    }
    const filename = req.file.originalname;
    const url = req.file.path;
  
    res.render("success", { s: "Success" });
  });
  
  app.listen(8000, () => {
    console.log("Server started on port 8000");
  });
  