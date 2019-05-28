var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
   text: String,
   created: {type: Date, default: Date.now},
   author: {
      id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Comment"
      },
      username: String,
      portrait: String,
      description: String
   }
});


module.exports = mongoose.model("Comment", commentSchema);