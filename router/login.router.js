const router = require('express').Router()
const authController = require('../controllers/auth.controller')
const body = require('express').urlencoded({ extended: true })
router.get('/' , authController.getLoginPage)
router.post('/',body,authController.postLoginAccount)
module.exports = router