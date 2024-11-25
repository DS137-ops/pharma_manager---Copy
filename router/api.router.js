const authmodel = require('../model/auth.model')
const router = require('express').Router()
const body = require('express').urlencoded({ extended: true })

router.post('/',body,(req,res)=>{
    authmodel.getRegisterPageForApi(req.body.name, req.body.email , req.body.password , req.body.age , req.body.address , req.body.job).then(()=>{
        res.json({error:false , message:'success'})
    }).catch((err)=>{
        res.json({error:true,message:err})
      })
})

router.post('/login',body,(req,res)=>{
    authmodel.LoginToAccountForApi(req.body.email , req.body.password).then((id)=>{
        req.session.userid = id
        console.log(111)
        res.json({error:false  ,  message:'success'})
    }).catch((err)=>{
        console.log(err)
        res.json({error:true,message:'Failed'})
    })
})
module.exports = router;