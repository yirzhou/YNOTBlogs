var bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    expressSanitizer = require("express-sanitizer"),
    mongoose = require("mongoose"),
    express = require("express"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    Comment = require("./models/comment"),
    Blog = require("./models/blog"),
    User = require("./models/user"),
    middleware = require("./middleware"),
    flash = require('connect-flash'),
    app = express();

var api_key = 'key-3cfc8120ec2795aa1b75652288c14b96';
var domain = 'sandbox18cd3fe064f340d4baa8c4f40046c561.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(flash());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(expressSanitizer());

//  PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "i AM THE BIGGER MAN!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//  Middleware that applies currentUser to all routes
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/test1", {useMongoClient: true});

app.get("/", function(req, res){
   res.redirect("/blogs");
});

// INDEX ROUTE
app.get("/blogs", function(req, res){
      Blog.find({}, function(err, blogs){
      if(err){
         console.log(err);
      }else{
         res.render("index", {blogs: blogs, currentUser: req.user});
      }
   });
});

// NEW ROUTE
app.get("/blogs/new", middleware.isLoggedIn, function(req, res){
   res.render("new");
});

// CREATE ROUTE   
app.post("/blogs", middleware.isLoggedIn, function(req, res){
   // create blog
   var title = req.body.title;
   var image = req.body.image;
   var body = req.sanitize(req.body.body);
   var author = {
        id: req.user._id,
        username: req.user.username,
        portrait: req.user.portrait,
        description: req.user.description
    };
    
    console.log(req.body.title);
    console.log(req.body.image);
    console.log(body);
    
//   req.body.blog.body = req.sanitize(req.body.blog.body);
   var newBlog = {title: title, image: image, body: body, author: author};
   Blog.create(newBlog, function(err, newlyCreated){
      if(err){
         res.render("new");
      }else{
         res.redirect("/blogs");
      }
   });
});

// SHOW ROUTE
app.get("/blogs/:id", function(req, res){
   Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog){
      if(err){
          req.flash("error", "Blog not found!");
         res.redirect("/blogs");
      }else{
         res.render("show", {blog: foundBlog});
      }
   });
});

// EDIT ROUTE
app.get("/blogs/:id/edit", middleware.checkBlogOwnership, function(req, res){
   Blog.findById(req.params.id, function(err, foundBlog){
      if(err){
         res.redirect("/blogs");
      }else{
         console.log(foundBlog.id);
         res.render("edit", {blog: foundBlog});
      }
   });
});

// UPDATE ROUTE
app.put("/blogs/:id", middleware.checkBlogOwnership, function(req, res){
   req.body.blog.body = req.sanitize(req.body.blog.body);
   Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
      if(err){
         res.redirect("/blogs");
      }else{
         res.redirect("/blogs/" + req.params.id);
      }
   });
});

// DELETE ROUTE
app.delete("/blogs/:id", middleware.checkBlogOwnership, function(req, res){
   Blog.findByIdAndRemove(req.params.id, function(err){
      if(err){
         res.redirect("/blogs");
      }else{
         req.flash("success", "Post deleted!");
         res.redirect("/blogs");
      }
   });
});

//  show the register form
app.get("/user/register", function(req, res){
   res.render("register"); 
});

//  Handle Sign Up Logic
app.post("/user/register", function(req, res){
    var newUser = new User({username: req.body.username, portrait: req.body.portrait, description: req.body.description});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            
            return res.render("register", {"error": err.message});
        }
        passport.authenticate("local")(req, res, function(){
           console.log(newUser);
           req.flash("success", "Welcome to Yiren's blog, " + user.username + "!");
           res.redirect("/blogs"); 
        });
    });
});

//  Show login form
app.get("/user/login", function(req, res){
    res.render("login");    
});

//  Handling login logic
app.post("/user/login", passport.authenticate("local", 
    {
        successRedirect: "/blogs",
        failureRedirect: "/user/login",
        failureFlash: true,
        successFlash: true
    }), function(req, res){
      //  console.log(currentUser);
});

//  Logout route
app.get("/user/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/blogs");
});

// Comments New
app.get("/blogs/:id/comments/new", middleware.isLoggedIn, function(req, res){
    //  Find campground by id
    Blog.findById(req.params.id, function(err, blog){
        if(err){
            console.log(err);
        }else{
            res.render("newComment", {blog: blog});
        }
    });
});

//  Comments Create
app.post("/blogs/:id/comments", middleware.isLoggedIn, function(req, res){
    console.log(req.body.comment);
    var newComment = req.body.comment;
    console.log(newComment.text);
    console.log(newComment.author);
   //   lookup campground using ID
   Blog.findById(req.params.id, function(err, blog){
       if(err){
           req.flash("error", "Something went wrong!");
           console.log(err);
           res.redirect("/blogs");
       }else{
           Comment.create(req.body.comment, function(err, comment){
               if(err){
                  console.log(req.user.username);
                   console.log(err);
               }else{
                   //   Add username and id to comment
                   comment.author.id = req.user._id;
                   comment.author.username = req.user.username;
                   comment.author.portrait = req.user.portrait;
                   comment.author.description = req.user.description;
                   //   Save comment
                   console.log("username: " + comment.author.username);
                   console.log("ID: " + comment.author.id);
                   console.log(comment.author.portrait);
                   console.log(comment.text);
                   comment.save();
                   blog.comments.push(comment);
                   blog.save();
                   req.flash("success", "Successfully added comment!");
                   res.redirect('/blogs/' + blog._id);
               }
           });
       }
   });
});

//  Sending contact email
app.post('/blogs/contact/send', function(req, res){
   var data = {
      from: 'donotreply@Blog.zhouyiren.com',
      to: 'y442zhou@edu.uwaterloo.ca',
      subject: 'New Message from ' + req.body.name + ' from Yiren Blog',
      html: 'Email: ' + req.body.email + '<br>' + 'Name: ' + req.body.name + '<br><br>' + req.body.message
   };
   
   mailgun.messages().send(data, function(error, body){
      console.log(body);
      console.log(data.subject);
   });
});


app.listen(process.env.PORT, process.env.IP, function(){
   console.log("SERVER IS RUNNING!"); 
});
