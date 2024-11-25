const authModel = require('../model/auth.model')
exports.getRegisterPage = (req,res)=>{
    res.render('register',{verifUser: req.session.userid})
}
exports.postNewAccount =(req,res)=>{
     authModel.createNewAccount(req.body.name, req.body.email , req.body.password , req.body.age , req.body.address , req.body.job).then((newuser)=>{
        console.log(newuser)
        res.redirect('/login')
     }).catch(()=>{
        res.redirect('/')
     })
}

exports.getLoginPage = (req,res)=>{
    res.render('register',{verifUser: req.session.userid})
}
exports.postLoginAccount = (req,res)=>{
    authModel.LoginToAccount(req.body.emaillog , req.body.pswd).then((id)=>{
        req.session.userid = id
        res.redirect('/home')
    }).catch((err)=>{
        console.log(err)
        res.redirect('/')
    })
}

exports.getHomePage = (req,res)=>{
    res.render('home',{verifUser: req.session.userid})
}