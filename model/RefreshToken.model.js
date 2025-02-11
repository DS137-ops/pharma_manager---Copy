const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    token:{
        type:String,
        required:true,
        unique:true
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:'10min'
    }
})
const RefreshToken = mongoose.model('RefreshToken' , refreshTokenSchema )

module.exports = RefreshToken