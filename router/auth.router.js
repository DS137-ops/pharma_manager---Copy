const router = require('express').Router()
const authModel = require('../model/auth.model')
const body = require('express').urlencoded({ extended: true })
router.post('/' ,body, (req,res)=>{
    authModel.postnewuser(req.body.name ,req.body.email ,req.body.password ,req.body.age ,req.body.address ,req.body.job)
    .then((user)=> res.status(200).json({user , msg:'success'}))
    .catch((err)=> res.status(400).json({err , msg:'Failed'}))
})

router.post('/login' ,body, (req,res)=>{
    authModel.postloginuser(req.body.email ,req.body.password)
    .then((token)=> res.status(200).json({token , msg:'success'}))
    .catch((err)=> res.status(400).json({err , msg:'Failed'}))
})

module.exports = router