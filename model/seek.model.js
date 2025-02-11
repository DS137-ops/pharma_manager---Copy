require('dotenv').config();
var mongoose = require('mongoose')
    const SeekSchema = new mongoose.Schema({
        fullName:{
            type:String,
            required:true,
            trim:true
        },
        phone:{
            type:String,
            required:true,
            match: [/^(\+20|0)1[0-9]{9}$/, "Please enter a valid Egyptian phone number"]
        },
        role:{
            type:String,
            default:"user",
            enum:["user"]
        },
        city:{
            type:String,
            default:null
        },
        address:{
            type:String,
            default:null
        },
        accountDate: {
            type: Date,
          },
        notifications: {
            type: Array,
            default: null,
          },
    })
 module.exports = mongoose.model('Seek', SeekSchema);