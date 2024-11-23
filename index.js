const express = require('express')
const app = express()
const mongoose = require('mongoose')
const session = require('express-session')
const MongoStrore = require("connect-mongodb-session")(session)
const path = require('path');
app.use(express.static(path.join(__dirname,'assets')));
app.use(express.static(path.join(__dirname,'assests')));
let Global = "mongodb+srv://feadkaffoura:YcQJ6vJSgdBFwX9b@cluster0.v3b0sud.mongodb.net/pharma?retryWrites=true&w=majority&appName=Cluster0",
local = "mongodb://localhost:27017/pharma"
var Store = new MongoStrore({
    uri:Global,
    collection:"sessions"
})
app.use(session({
    secret:"asdkandlk",
    store:Store,
    resave:true,
    saveUninitialized:true
}))
app.set('view engine' , 'ejs');
app.set('views' , 'views');
app.use(express.urlencoded({ extended: true }))
const authRouter = require('./router/auth.router')
const loginRouter = require('./router/login.router')
const ApiRouter = require('./router/api.router')

 app.use('/',authRouter)
 app.use('/api',()=> ApiRouter)
 app.use('/postNewAccount',authRouter)
 app.use('/login' , loginRouter)
 app.use("/postLoginAccount" ,loginRouter)
 //app.listen(9090 , ()=>{
    // console.log('server is Running')
    //})

require('net')
    .createServer( function(socket) 
    {
           
    })
    .listen(9090, function()
     {
           console.log('Socket ON')
    })