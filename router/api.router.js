const authmodel = require('../model/auth.model')
const router = require('express').Router()
const body = require('express').urlencoded({ extended: true })

router.get('/',(req,res)=>{
    authmodel.getRegisterPageForApi(req.body.name, req.body.email , req.body.password , req.body.age , req.body.address , req.body.job).then(()=>{
        res.json({error:false , message:'success'})
    }).catch((err)=>{
        res.json({error:true,message:err})
      })
})
module.exports = router;