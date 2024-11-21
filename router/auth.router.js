const router = require('express').Router()
const authController = require('../controllers/auth.controller')
const body = require('express').urlencoded({ extended: true })
router.get('/', authController.getRegisterPage)
router.post('/' , body ,authController.postNewAccount)
module.exports = router