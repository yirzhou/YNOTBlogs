//  All the middleware goes here
var middlewareObj = {};

var Blog = require("../models/blog");
var Comment = require("../models/comment");

middlewareObj.checkBlogOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            req.flash("error", "Blog not found!");
            res.redirect("/blogs");
        }else{
            //  Does the user own the Blog?
            if(foundBlog.author.id.equals(req.user.id)){
                next();
            } else {
                req.flash("error", "You don't have permission to do that!");
                res.redirect("back");
            }
        }
     });
    }else{
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back")
        }else{
            //  Does the user own the comment?
            if(foundComment.author.id.equals(req.user.id)){
                next();
            } else {
                req.flash("error", "You don't have permission to do that!");
                res.redirect("back");
            }
        }
     });
    }else{
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
}


middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that!")
    res.redirect("/user/login");
}

module.exports = middlewareObj;