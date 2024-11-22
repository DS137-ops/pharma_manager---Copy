const authmodel = require('../model/auth.model')
const router = require('express').Router()
const body = require('express').urlencoded({ extended: true })

router.get('/',(req,res)=>{
    authmodel.getRegisterPageForApi().then(()=>{
        res.json({error:false , message:'success'})
    }).catch((err)=>{
        res.json({error:true,data:{}})
      })
})