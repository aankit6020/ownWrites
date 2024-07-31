const mongoose = require('mongoose') ;

mongoose.connect("mongodb://localhost:27017/blogusers") ;

const userSchema = mongoose.Schema({
    username : String ,
    name : String ,
    DOB : String ,
    email : String ,
    password : String ,
    profileimage:{
        type:String,
        default:"user.png"
    } ,
    postId : [{
        type: mongoose.Schema.Types.ObjectId ,
        ref: 'post'
    }]
}) ;

module.exports = mongoose.model("user",userSchema) ;

