require('dotenv').config();
var mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
    const medicalSchema = new mongoose.Schema({
      fullName: {
        type: String,
        required: [true, 'Full name is required'],
        minlength: [3, 'Full name must be at least 3 characters'],
      },
      email: {
        type: String,
        unique: true,
        match: [/.+@.+\..+/, 'Please provide a valid email address'],
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
      },
      role:{
        type:String,
        required:true,
        enum:['admin','pharmatic','doctor','radiology' , 'Analyst'  ]
      },
      specilizate:{
        type:String,
        trim:true,
        enum:['teeth','internal','baby','Gynecologist','eyes' , 'Orthopedic','surgeon','heart','Neurologist' , 'Urologist'  ]
      },
        address: {
          type: String,
          required: [true, 'address is required']
        },
        phone:{
          type:String,
          required: [true, 'phone is required'],
          match: [/^(\+20|0)1[0-9]{9}$/, "Please enter a valid Egyptian phone number"]

        },
        approved: { type: Boolean, default: false },
        accountDate: {
          type: Date,
        },
        notifications: {
          type: Array,
          default: null,
        },
      });


      medicalSchema.methods.verifyPassword = async function(password){
        return bcrypt.compare(password,this.password)
    }
    
    medicalSchema.pre('save', async function (next) {
        if (!this.isModified('password')) return next();
    
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (err) {
            next(err);
        }
    });
    
    module.exports = mongoose.model('User', medicalSchema);

// // function enddate(){
// //     const thirtyDaysFromNow = new Date();
// // thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
// // const cronExpression = `0 0 0 ${thirtyDaysFromNow.getDate()} ${thirtyDaysFromNow.getMonth() + 1} *`
// // let EndDateAccount=cronExpression.slice(6,8) + '/' + cronExpression.slice(9,11)
// // return EndDateAccount
// // }
// var User = mongoose.model('users',pharmaSchema);
// var Global =
//     process.env.GLOBAL,
//   local = process.env.LOCAL;
// let bcrypt = require("bcryptjs");
// let jwt = require("jsonwebtoken");
// exports.postnewuser = (
//   name,
//   emailpar,
//   passwordpar,
//   agepar,
//   addresspar,
//   jobpar
// ) => {
//   return new Promise((resolve, reject) => {
//     mongoose
//       .connect(Global)
//       .then(() => {
//         var newUser = User.findOne({ email: emailpar });
//         return newUser;
//       })
//       .then((doc) => {
//         console.log(doc);
//         if (doc) {
//           mongoose.disconnect();
//           reject("email is used");
//         } else {
//           bcrypt
//             .hash(passwordpar, 10)
//             .then((hashpass) => {
//               let newUser = new User({
//                 fullName: name,
//                 email: emailpar,
//                 password: hashpass,
//                 age: agepar,
//                 address: addresspar,
//                 job: jobpar,
//                 accountDate: new Date(),
//               });
//               return newUser
//                 .save()
//                 .then((user) => {
//                   mongoose.disconnect();
//                   resolve(user);
//                 })
//                 .catch((err) => {
//                   mongoose.disconnect();
//                   reject(err);
//                 });
//             })
//             .catch((err) => {
//               mongoose.disconnect();
//               reject(err);
//             });
//         }
//       });
//   });
// };
// let privateKey = process.env.PRIVATEKEY;
// exports.postloginuser = (email, password) => {
//   return new Promise((resolve, reject) => {
//     mongoose
//       .connect(Global)
//       .then(() => {
//         return User.findOne({ email: email });
//       })
//       .then((user) => {
//         if (!user) {
//           mongoose.disconnect();
//           reject("email is not exist");
//         } else {
//           bcrypt
//             .hash(password, user.password)
//             .then((same) => {
//               if (same) {
//                 let token = jwt.sign(
//                   { id: user._id, name: user.fullName },
//                   privateKey,
//                   {
//                     algorithm: "HS384",
//                     expiresIn: "1d",
//                   }
//                 );
//                 mongoose.disconnect();
//                 resolve(token);
//               } else {
//                 mongoose.disconnect();
//                 reject("password oops");
//               }
//             })
//             .catch((err) => {
//               mongoose.disconnect();
//               reject(err);
//             });
//         }
//       })
//       .catch((err) => {
//         mongoose.disconnect();
//         reject(err);
//       });
//   });
// };
// exports.getUserInfo = (id) => {
//   return new Promise((resolve, reject) => {
//     mongoose
//       .connect(Global)
//       .then(() => {
//         return User.findById(id);
//       })
//       .then((userinfo) => {
//         if (userinfo) {
//           mongoose.disconnect();
//           resolve(userinfo);
//         } else {
//           mongoose.disconnect();
//           reject("can not find info");
//         }
//       })
//       .catch((err) => console.log(err));
//   });
// };
// exports.getUserInfobyemail = (email) => {
//   return new Promise((resolve, reject) => {
//     mongoose
//       .connect(Global)
//       .then(() => {
//         return User.findOne({email:email});
//       })
//       .then((userinfo) => {
//         if (userinfo) {
//           mongoose.disconnect();
//           resolve(userinfo);
//         } else {
//           mongoose.disconnect();
//           reject("can not find info");
//         }
//       })
//       .catch((err) => console.log(err));
//   });
// };
// exports.setNewNotify = (id, message, date) => {
//   return new Promise((resolve, reject) => {
//     mongoose
//       .connect(Global)
//       .then(() => {
//         return User.findById(id);
//       })
//       .then((user) => {
//         return User.updateOne(
//           { _id: new mongoose.Types.ObjectId(id) },
//           { $push: { notifications: { id, message, date } } }
//         );
//       })
//       .then(() => {
//         mongoose.disconnect();
//         resolve("Ok updated");
//       })
//       .catch((err) => {
//         mongoose.disconnect();
//         reject(err);
//       });
//   });
// };
// exports.getNotifies = (id)=>{
//   return new Promise((resolve, reject) => {
//     mongoose.connect(Global)
//     .then(()=>{
//       return User.findById(id)
//     })
//     .then((user)=>{
//       if(user.notifications){
//         mongoose.disconnect()
//         resolve(user)
//       }else {
//         mongoose.disconnect()
//         reject("user has not any notifies")
//       }
//     }).catch((err)=>{
//       mongoose.disconnect()
//       reject(err)
//     })
//   }).catch((err)=>{
//     mongoose.disconnect()
//     reject(err)
//   })
// }
// exports.updateuserinfo = (id, updatedData) => {
//   return new Promise(async (resolve, reject) => {
//    await mongoose.connect(Global)
//     try {
//       if (updatedData.password) {
//         updatedData.password = await bcrypt.hash(updatedData.password, 10);
//       }
//       const fieldsToUpdate = {};
//       for (const key in updatedData) {
//         if (updatedData[key] !== undefined) {
//           fieldsToUpdate[key] = updatedData[key];
//         }
//       }
//       console.log(fieldsToUpdate)
//       const updatedUser = await User.findByIdAndUpdate(
//         id,
//         { $set: fieldsToUpdate },
//         { new: true, runValidators: true }
//       );

//       if (!updatedUser) {
//         throw new Error("User not found");
//       }

//       resolve(updatedUser);
//     } catch (err) {
//       reject(err || "Failed to update user");
//     }
//   });
// };
