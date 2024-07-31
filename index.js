const express = require('express') ;
const app = express() ;
const usermodel = require("./model/user") ;
const postmodel = require("./model/post") ;
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const path = require('path') ;
const { render } = require('ejs');
const post = require('./model/post');
const multerconfig = require('./utils/multer');

app.set("view engine" , "ejs") ;
app.use(express.json()) ;
app.use(express.urlencoded({extended: true})) ;
app.use(express.static(path.join(__dirname,"public"))) ;
app.use(cookieParser()) ;

app.get('/',(req,res)=>{

    res.render("login") ;

}) ;

app.get('/logout',(req,res)=>{
    res.cookie("token" , "") ;
    res.redirect("/") ;

}) ;

app.get('/register' , (req,res) =>{

    res.render("create") ;

}) ;

app.post('/login', async (req,res) =>{

    let {email ,password} = req.body ;

    let checkUser = await usermodel.findOne({email : email}) ;

    if(!checkUser){
        return res.status(500).send("user not exist") ;
    }
    
    bcrypt.compare(password, checkUser.password, function(err, result) {
        
        if(result)
        {
            let token = jwt.sign({ email : email, userid : checkUser._id }, 'justLearningBackened');
            res.cookie('token' , token ) ;
            res.redirect("/profile") ;
        }
        else{
            return res.status(500).send("something went wrong") ;
        }
    }); 
    

}) ;

app.post("/register" , async (req,res)=>{

    let {username , name , email , password , DOB} = req.body ;

    let checkUser = await usermodel.findOne({email : email}) ;

    if(checkUser)
    {
        return res.status(500).send("user already exists") ;
    }

    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(password, salt,async function(err, hash) {
            
            let user = await usermodel.create({
                username , 
                name , 
                email ,
                password : hash ,
                DOB
            }) ;

            let token = jwt.sign({ email : email, userid : user._id }, 'justLearningBackened');
            res.cookie('token' , token ) ;
            res.redirect("/profile") ;

        });
    });

    

}) ;

app.get("/profile" ,isLoggedIn ,async (req,res) => {

    let user = await usermodel.findOne({email : req.user.email}).populate("postId") ;

    res.render("profile",{user}) ;
})


app.post("/createPost" ,isLoggedIn , async (req,res)=>{

    let {email , userid } = req.user ;
    console.log(req.user) ;
    let user = await usermodel.findOne({_id:userid}) ;

    console.log(req.body) ;

    let {content} = req.body ;
    

    let post = await postmodel.create({
        user : userid ,  
        content : content
    }) ;

    user.postId.push(post._id) ;
    await user.save() ;

    res.redirect("/profile")

})

app.get("/edit/:id" ,isLoggedIn , async (req,res) => {
 
    let post = await postmodel.findOne({_id : req.params.id});

    res.render("edit",{post})

})
app.post("/update/:id" ,isLoggedIn , async (req,res) => {
 
    let post = await postmodel.findOneAndUpdate({_id : req.params.id},{content:req.body.content});

    res.redirect("/profile") ;

})
app.get("/like/:id" ,isLoggedIn , async (req,res) => {
 
    let post = await postmodel.findOne({_id : req.params.id}).populate("user") ;

    if(post.likes.indexOf(req.user.userid) === -1)
    {
        post.likes.push(req.user.userid) ;
    }else{

        post.likes.splice(post.likes.indexOf(req.user.userid) ,1) ;
    }

    await post.save() ;

    res.redirect("/profile") ;

})
app.get("/delete/:id" ,isLoggedIn , async (req,res) => {
 
    await postmodel.findOneAndDelete({_id : req.params.id}) ;
    res.redirect("/profile") ;

})

app.get('/profile/edit' , isLoggedIn , async (req,res)=>{
    let user = await usermodel.findOne({email:req.user.email}) ;
    res.render("upload",{user}) ;
});

app.post('/upload',isLoggedIn,multerconfig.single("image"),async (req,res)=>{
  
    let {username,name,DOB} = req.body ;
    if(!req.file)
    {
        await usermodel.findOneAndUpdate({email:req.user.email},{
            username:username,
            name:name,
            DOB:DOB,
           
        }) ;
        
    }else{  
        let imagename = req.file.filename ;
        await usermodel.findOneAndUpdate({email:req.user.email},{
            username:username,
            name:name,
            DOB:DOB,
            profileimage:imagename   
        }) ;
        
    }
    

    res.redirect("/profile") ;
} ) ;

function isLoggedIn(req,res,next){
    if(req.cookies.token === "")
        return  res.send("you are not loggedIn") ;
    else{
        let data = jwt.verify(req.cookies.token , "justLearningBackened") ;
        req.user = data ;
        next() ;
    }
}
app.listen(3000) ;