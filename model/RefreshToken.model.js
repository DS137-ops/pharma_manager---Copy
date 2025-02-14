const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    token:{
        type:String,
        required:true,
        unique:true
    },
    userRef:{
        type:String,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
    }
})
const RefreshToken = mongoose.model('RefreshToken' , refreshTokenSchema )

module.exports = RefreshToken