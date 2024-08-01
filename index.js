require("dotenv").config()
const cloudinary = require('cloudinary').v2;
const methodoverride=require('method-override')
const multer = require('multer')
const { storage } = require("./cloudconfig")
const upload = multer({ storage })
const express = require('express');
const mongoose = require('mongoose');
flash = require('connect-flash')
path = require('path');
let ejsmate = require('ejs-mate');
let app = express();
app.use(methodoverride("_method"));
app.engine('ejs', ejsmate)
app.set("view engine", "ejs")
session = require('express-session')
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: true }))
let Users = require("./user");
const MongoStore = require('connect-mongo');
//session 
sessionobject = {
  secret: "adsdfve",
  resave: false,
  store: MongoStore.create({
    mongoUrl:process.env.ATLAS_URL,
    crypto: { secret: "adsdfve" },
    touchAfter: 24 * 60 * 60
  }),
  saveUninitialized: true,

  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}
app.use(session(sessionobject))
// passport 
const Passport = require('passport');
const Localstrategoy = require('passport-local');
const { log } = require("console");
app.use(Passport.initialize())
app.use(Passport.session())

Passport.use(new Localstrategoy(Users.authenticate()))
Passport.serializeUser(Users.serializeUser());
Passport.deserializeUser(Users.deserializeUser());

//mongoose
mongoose.connect(process.env.ATLAS_URL)
console.log(process.env.ATLAS_URL)

// / 
app.get("/", (req, res) => {
  res.render("index");
})
app.get("/all", async (req, res) => {
  let a = req.user;

  res.render("all", {a})
})

//login
app.post("/login", Passport.authenticate('local', { failureRedirect: '/', failureFlash: false }), async (req, res) => {
  const { username } = req.body;
  console.log(username);
  let a = await Users.findByUsername(username);
  console.log(a);
  if(a.length>0){
    // res.redirect('/')
  }
  res.render("all", { a});

})
//Signup
app.post("/signup", async (req, res, next) => {
  const { username, password } = req.body;

  const newUser = new Users({ username });
  try {
    const user = await Users.register(newUser, password);
    req.login(user, (err) => {
      if (err) return next(err);
      res.redirect("/")
    });
  } catch (e) {
    return next(e);
  }
});


//upload
app.post("/upload", upload.single("upload-file"), async (req, res) => {
  let d = req.user.id;
  // console.log(d);
  if (!req.file) {
    return res.status(400).render("success", { s: "no file uploaded" });
  }
  const filename = req.file.originalname;
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id:filename, 
      overwrite: true, 
      resource_type: 'auto' 
    });


    const url = result.secure_url;
    let q = await Users.updateOne({ _id: d }, { $push: { files: { filename, url } } });
    res.redirect("/all");
    // res.render("success", { s: "successfully uploaded" });



  } catch (error) {
    console.log(error);
  }
})
//signup
app.get("/signup", (req, res) => {
  res.render("signup");
})

app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err)
      return next(err)
    res.redirect("/")
  })

})
app.delete("/delete",async(req,res)=>{
  const {input}=req.body;
  let a=input.split(" ");

  let url=a[0];
  let filename=a[1];
  try {
    await cloudinary.uploader.destroy(`${filename}`, { resource_type: 'raw' });
  let q = await Users.updateOne({ _id:req.user._id }  , { $pull: { files: { url } } });
  res.redirect("/all");
    
  } catch (error) {
    console.log(error);
  }
})
app.get("/:var", (req, res) => {
  res.send("bad request")
})
app.listen(8000);