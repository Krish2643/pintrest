var express = require('express');
var router = express.Router();
const userModel = require("./users.js");
const postModel = require("./post.js");
const passport = require('passport');
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

const upload = require('./multer.js');

const authenticate = passport.authenticate('local');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/login', function(req, res, next) {
  console.log(req.flash('error'))
  res.render('login', { title: req.flash('error') });
});

router.get('/profile', isLoggedIn , async function(req, res, next) {
  let username = req.user.username
  let user = await userModel.findOne({username}).populate("posts")
  console.log(user);
  //  console.log(user.username, "this is user name");
  res.render("profile", {user});
});

router.get('/feed', isLoggedIn ,function(req, res, next) {
  res.render("feed");
});

router.post('/upload', isLoggedIn, upload.single("file") ,async function(req, res, next) {
  if(!req.file){
    return res.status(404).send("no files were given");
  }  
    // jp file upload hui h use save kro as a post and uski postid user ko do or post ko userid do

     let username = req.user.username;
     let user = await userModel.findOne({username});
    let post = await postModel.create({
      image: req.file.filename,
      imageText: req.body.filecaption,
      user: user._id,   // isses post me user ki id insert hogyi
     })

    user.posts.push(post._id);   // isse post me user ki id insert hogyi
    await user.save();
    res.redirect(302,"/profile");

});

router.post('/register', function(req, res){
   const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname
   });

   userModel.register(userData, req.body.password) // isse new account bn rha h
.then(function (registereduser) {
  authenticate(req, res, function () {
    // console.log("user Logedin");
    res.redirect('/profile');
  });
})
.catch(function (err) {
  console.error(err);
  res.status(500).send('Error registering user');
});
});


router.post('/login', passport.authenticate("local", {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}), function (req, res) {})

router.get('/logout', function(req, res, next){
  req.logout(function(err){
    if(err) {return next(err); }
    res.redirect('/');
    })
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
}


module.exports = router;
