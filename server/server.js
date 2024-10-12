import express from 'express'
import mongoose from 'mongoose';
import 'dotenv/config';
import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid'; //generates random string
import jwt from 'jsonwebtoken';

// Schema's
import User from './Schema/User.js';


const server = express();
let PORT = 3000;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json())


mongoose.connect(process.env.DB_LOCATION , {
    autoIndex:true
})


const formatDatatoSend = (user) => {

    const access_token = jwt.sign({ id: user._id } , process.env.SECRET_ACCESS_KEY)

    return {
        access_token,
        profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname
    }
}


const generateUsrname = async (email) => {
    let username = email.split("@")[0]
    let usernameExists = await User.exists({"personal_info.username": username}).then((result) => result)

    usernameExists ? username += nanoid().substring(0 , 6) : "";
    
    return username
}



server.post("/signup", (req ,res) => {

    // console.log(req.body)
    // res.json(req.body)

    let {fullname , email , password} = req.body

    //validating the data from frontend
    if(fullname.length < 3){
        return res.status(403).json({"error": "Please enter the valid fullname"})
        //403 invalidation error code
    }
    if(!email.length){
        return res.status(403).json({"error": "Enter email!"})
    }
    if(!emailRegex.test(email)){
        return res.status(403).json({"error": "Invalid email!"})
    }
    if(!passwordRegex.test(password)){
        return res.status(403).json({"error":"Password must be 6 to 20 character long with a numeric, 1 lowercase and 1 uppercase "})
    }

bcrypt.hash(password, 10 , async (err , hashed_password)=>{

    // let username = email.split("@")[0];
let username = await generateUsrname(email);
// ex= as@gmail.com -> [as , gmail] (0 index) -> as

let user = new User({
    personal_info: { fullname, email , password: hashed_password}
})

user.save().then((u) =>{

    return res.status(200).json(formatDatatoSend(u))

})
.catch(err => {

    if(err.code == 11000){
        console.log("Duplication Error")
        return res.status(500).json({"error" : "Email already exist"})
    }


    return res.status(500).json({ "error": err.message })
})



// console.log(hashed_password)
})

    // return res.status(200).json({ "status": "okay" })




})

server.post("/sigin" , (req , res)=>{
    let {email,password} = req.body;

    User.findOne({"personal_info.email" : email})
    .then((user)=>{
        if(!user) {
            // throw 'error' or
            return res.res(403).json({"error" : "email not found!!!"})
        }

        bcrypt.compare(password , user.personal_info.password , (err , result) => {
            if (err){
                return res.staus(403).json({"error" : "Error occured while login please try again later"})
            }
            if(!result){
                return res.staus(403).json({"error" : "Incorrect password"})

            }else{
                return res.status(200).json(formatDatatoSend(user))
            }
        })

        
        console.log(user)
        return res.json({"staus" : "got the user document"})
    }).catch(err => {
        console.log(err);
        return res.res(500).json({"error" : err.message})
    })
})


server.listen(PORT, ()=>{
    console.log(`listining ${PORT}`)
});


