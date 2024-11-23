const mongoose = require('mongoose');
const { rejects } = require('node:assert');
const pharmaSchema = new mongoose.Schema({
    fullName:String,
    email:String,
    password:String,
    age:String,
    address:String,
    job:String,
    accountDate:Date,
    userid:String,
});
function enddate(){
    const thirtyDaysFromNow = new Date();
thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
const cronExpression = `0 0 0 ${thirtyDaysFromNow.getDate()} ${thirtyDaysFromNow.getMonth() + 1} *`
let EndDateAccount=cronExpression.slice(6,8) + '/' + cronExpression.slice(9,11)
return EndDateAccount

}
const { createHmac } = require('node:crypto');
var pharmaModel = mongoose.model('users', pharmaSchema), Global = "mongodb+srv://feadkaffoura:YcQJ6vJSgdBFwX9b@cluster0.v3b0sud.mongodb.net/pharma?retryWrites=true&w=majority&appName=Cluster0",
local = "mongodb://localhost:27017/pharma";
const secret = 'abcdefg'
 function hashCry(password) {
    return  createHmac('sha256', secret)
    .update(password)
    .digest('hex');
}
exports.createNewAccount = (name,email , password , age , address , job)=>{
    return new Promise((resolve, reject) => {
        mongoose.connect(Global).then(() => {
            return pharmaModel.findOne({ email: email })
        }).then((user) => {
            if (user) {
                mongoose.disconnect()
                resolve('email exists!')
            } else {
                
                return hashCry(password)
            }
        }).then((hpassword) => {
            let user = new pharmaModel({
                fullName:name,
                email:email,
                password:hpassword,
                age:age,
                address:address,
                job:job,
                accountDate:mongoose.now(),
              
            })
            return user.save()
        }).then((user) => {
            mongoose.disconnect()
            resolve(user)
        }).then((err) => {
            console.log(err)
        }).catch(err => { mongoose.disconnect() 
            reject(err) })
    })
}
exports.getRegisterPageForApi = (req,res)=>{
    console.log(1)
}
exports.LoginToAccount = (email, password) => {
    return new Promise((resolve, reject) => {
        mongoose.connect(Global).then(() => {
            var x = User.findOne({ email: email })
            return x
        }).then((user) => {
            if (user) {
                return hashCry(password).then((verif) => {
                    if (verif) {
                        mongoose.disconnect()
                        resolve(user._id)
                    }
                    else {
                        mongoose.disconnect()
                        reject("Invalid Password")
                    }
                })
            }
            else {
                mongoose.disconnect()
                reject("Invalid Email")
            }
        }).catch((err) => {
            reject(err)
        })
    })
}