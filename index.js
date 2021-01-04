//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const nodemailer = require("nodemailer");
require('dotenv').config();
const port = process.env.PORT || 4000;



const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret:"Our Little Secret",
  resave:false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//Database Connection or Creation
const MONGODB_URL = 'mongodb+srv://sushant959:Roziloves959@blogdb.ttykp.mongodb.net/<dbname>?retryWrites=true&w=majority'
mongoose.connect(MONGODB_URL || "mongodb://localhost:27017/blogDB", { useNewUrlParser: true , useUnifiedTopology: true, useFindAndModify: false });
mongoose.set("useCreateIndex",true);

mongoose.connection.on('connected',() => {
  console.log('Mongoose Connected!!!')
})
const Schema = mongoose.Schema;

//Schema For Post
const postSchema = new Schema({
  title : String,
  content: String
});
  

//Schema for Admin
const adminSchema = new Schema({
  Username : String,
  password: String
});

adminSchema.plugin(passportLocalMongoose);

const Post =  mongoose.model("Post",postSchema);
const Admin = mongoose.model("Admin",adminSchema);

//Serialize or deserilize user

// passport.serializeUser(function(admin,done){
//   done(null,admin.id);
// });

// passport.deserializeUser(function(id,done){
//   Admin.findById(id,function(err,admin){
//     done(err,admin);
//   });
// });

passport.use(Admin.createStrategy());
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

//Admin Registration(you just have to do the admin registration once after that you can remove this code.)

// Admin.register({username: "sushant959"},"Sushant959@",function(err,admin){
//   if(err){
//     console.log(err);
//     res.redirect("/");
//   }else{
//     passport.authenticate("local")(req,res,function(){
//       res.redirect("/admin-post");
//     });
//   }
// });


//Home Page Section
app.get("/",function(req,res){

  Post.find({},function(err,posts){
    res.render("home",{posts : posts , pageTitle : "Sushant"});    
    });

});

//About Section
app.get("/about",function(req,res){
  res.render("about",{pageTitle : "About Me"});
});

//Failure Section
app.post("/failure",function(req,res){

  res.redirect("/contact");
});

//Sucess Section
app.post("/sucess",function(req,res){

  res.redirect("/");
});

//Single Post Section for visitors.
app.get("/posts/:postname",function(req,res){

  let requestedTitle = req.params.postname;

  Post.findOne({title:requestedTitle},function(err,post){
    res.render("Post",{
      title: post.title,
      content:post.content
    });
  });
  
});


//Contact Section
app.get("/contact",function(req,res){
  res.render("contact",{pageTitle : "Contact Me"});
});
app.post("/contact",function(req,res){

  var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'sushantsinghrajput959@gmail.com',
      pass: process.env.USER_PASS
    }
  });
  
  var mailOptions = {
    //from: req.body.email,
    to: 'sushantkumarsingh098@gmail.com',
    subject: req.body.name,
    html: `<p>${req.body.name}</p>
           <p>${req.body.email}</p>
           <p>${req.body.textContent}</p>`
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      res.render("failure");
      console.log(error);
      
    } else {
      res.render("sucess");
    }
  });

});



//ADMIN SECTION

//Admin Home Page

app.get("/admin-post",function(req,res){
  if(req.isAuthenticated()){
    Post.find(function(err,posts){
      res.render("admin-post",{posts : posts , pageTitle : "Admin"});    
      });
  
  }else{
    res.redirect("/");
  }
 
});

//Admin Compose Section
app.route("/compose")
.get(function(req,res){
  if (req.isAuthenticated()) {
    res.render("compose",{pageTitle : "Create Post"});
  } else {
    res.redirect("/");
  }
})
.post(function(req,res){
  const post = new Post({
    title : req.body.postHeading,
    content : req.body.postContent    
  });
  post.save();
  res.redirect("/admin-post");
});



//Admin post Edit Section

app.route("/admin-post/post-edit/:postId")
.get(function(req,res){
  if(req.isAuthenticated()){
    Post.find({_id : req.params.postId},function(err,posts){
      posts.forEach(post => {
        res.render("post-edit",{ title: post.title , content: post.content ,id : post._id, pageTitle : "Post Edit"});    
      });
        
      });
    }else{
      res.redirect("/");
    }
      
})
.post(function(req,res){

  let newTitle = req.body.newTitle;
  let newContent = req.body.newContent;
  

  Post.updateOne({_id:req.params.postId},{title: newTitle , content: newContent},function(err){
    if (err) {
      console.log(err);
      
    } else {
      res.redirect("/admin-post");
    }
    
  });

});

//Admin post Delete Section

app.route("/post-delete/:postId")
.get(function(req,res){
    if (req.isAuthenticated()) {
      Post.deleteOne({_id:req.params.postId},function(err){
        if (!err) {
          res.redirect("/admin-post");
        } else {
          res.send(err);
        }
      });
    } else {
      res.redirect("/");
    }
});




//Admin Login Section

app.route("/admin-login")
.get(function(req,res){
  res.render("login");
 })
.post(function(req,res){
  const admin = new Admin({
     username : req.body.username,
     password : req.body.password
 });

req.login(admin , function(err){
 if(err){
   console.log(err);
     
 }else{
   passport.authenticate("local")(req,res,function(){
     res.redirect("/admin-post")
   });
 }
})
});

//Admin LogOut ection
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});





app.listen(port, function() {
  console.log(`Server started on port  ${port}`);
});
