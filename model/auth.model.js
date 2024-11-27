const mongoose = require('mongoose');
const pharmaSchema = new mongoose.Schema({
    fullName:String,
    email:String,
    password:String,
    age:String,
    address:String,
    job:String,
   accountDate: Date
});
// function enddate(){
//     const thirtyDaysFromNow = new Date();
// thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
// const cronExpression = `0 0 0 ${thirtyDaysFromNow.getDate()} ${thirtyDaysFromNow.getMonth() + 1} *`
// let EndDateAccount=cronExpression.slice(6,8) + '/' + cronExpression.slice(9,11)
// return EndDateAccount
// }
var User = mongoose.model('users', pharmaSchema), Global = "mongodb+srv://feadkaffoura:YcQJ6vJSgdBFwX9b@cluster0.v3b0sud.mongodb.net/pharmatic?retryWrites=true&w=majority&appName=Cluster0",
local = "mongodb://localhost:27017/pharmatic";
let bcrypt = require("bcryptjs")
let jwt = require("jsonwebtoken")
exports.postnewuser = (name , emailpar , passwordpar , agepar , addresspar , jobpar )=>{
    return new Promise((resolve, reject) => {
        mongoose.connect(local).then(()=>{
            return User.findOne({email : emailpar})
        }).then((doc)=>{
            if(doc){
                mongoose.disconnect()
                reject("email is used")
            }else{
                bcrypt.hash(passwordpar , 10).then((hashpass)=>{
                    let newUser = new User({
                        fullName:name ,
                        email : emailpar ,
                        password: hashpass ,
                        age : agepar ,
                        address : addresspar ,
                        job : jobpar,
                       accountDate : new Date()
                    })
                   return newUser.save().then((user)=>{
                        mongoose.disconnect()
                        resolve(user)
                    }).catch((err)=>{
                        mongoose.disconnect()
                        reject(err)
                    })
                }).catch((err)=>{
                    mongoose.disconnect()
                    reject(err)
                })
            }
        })
    })
}
let privateKey = "fmmmffmmffffsfmfss"
exports.postloginuser = (email , password)=>{
    return new Promise((resolve, reject) => {
        mongoose.connect(local).then(()=>{
            return User.findOne({email : email})
        }).then((user)=>{
            if(!user){
                mongoose.disconnect()
                reject("email is not exist")
            }
            else{
                bcrypt.hash(password , user.password).then((same)=>{
                    if(same){
                      let token =  jwt.sign({id:user._id , name:user.fullName},privateKey,{
                            algorithm:'HS384',
                            expiresIn:"1d"
                        })
                        mongoose.disconnect()
                        resolve(token)
                    }else{
                        mongoose.disconnect()
                        reject("password oops")
                    }
                }).catch((err)=>{
                    mongoose.disconnect()
                    reject(err)
                })
            }
        })
    })
}