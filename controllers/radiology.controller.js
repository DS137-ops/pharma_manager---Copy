const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const RefreshToken = require('../model/RefreshToken.model');
const City = require('../model/cities.model');
const Favourite = require('../model/FavouriteRadiology.model');
const Seek = require('../model/seek.model');
const Radiology = require('../model/radiology.model');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nabd142025@gmail.com',
    pass: 'nzxm wyky hapd xqsu', // firaskingsalha67  CX6EQ-VQ2H4-JKC2H-JLUFY-A5NYA   cpzz lnvy ldus tczj
  },
});



exports.searchradiologyByName = async (req, res) => {
  try {
    const { fullName } = req.query;

    if (!fullName) {
      return res.status(400).json({ status: false, message: 'Please provide a name' });
    }

    const radiology = await Radiology.find({
      fullName: { $regex: fullName, $options: 'i' }
    });

    if (radiology.length === 0) {
      return res.status(200).json({ status: true,data:[] });
    }

    return res.status(200).json({ status: true, data:radiology });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

exports.createNewRadiology = async (req, res) => {
  const {
    fullName,
    email,
    password,
    city,   // city ID
    region, // region ID
    address,
    phone,
    StartJob,
    EndJob,
  } = req.body;

  if (
    !fullName ||
    !email ||
    !password ||
    !city ||
    !region ||
    !address ||
    !phone ||
    !StartJob ||
    !EndJob
  ) {
    return res.status(404).json({ success: false, message: 'All fields are required' });
  }

  try {
    // التحقق من عدم وجود المستخدم مسبقًا
    const existingUser = await Radiology.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }


    const cityExists = await City.findById(city);
    if (!cityExists) return res.status(400).json({ success: false, message: 'City not found' });

    const regionExists = cityExists.regions.find(r => r._id.toString() === region);
    if (!regionExists) return res.status(400).json({ success: false, message: 'Region not found in the selected city' });

    

    // إنشاء مستخدم جديد مع تخزين اسم المدينة والمنطقة بدلاً من الـ ID
    const newUser = new Radiology({
      fullName,
      email,
      password,
      city: cityExists.name,    // تخزين اسم المدينة
      region: regionExists.name, // تخزين اسم المنطقة
      address,
      phone,
      StartJob,
      EndJob,
    });

    await newUser.save();
    const token = await jwt.sign({_id:newUser._id ,role: 'radiology' }, process.env.JWT_SECRET );
    await RefreshToken.create({ token , userRef:newUser._id });
    const approvalLink = `http://147.93.106.92/api/Radiology/approve/radiology/${newUser._id}`;
    const rejectLink = `http://147.93.106.92/api/Radiology/reject/radiology/${newUser._id}`;

    const mailOptions = {
      from: email,
      to: 'feadkaffoura@gmail.com',
      subject: 'طلب تسجيل جديد',
      html: `
        <h3>New Registration Request</h3>
        <p>Name: ${fullName}</p>
        <p>Email: ${email}</p>
        <p>Role: Radiology</p>
        <p>City: ${cityExists.name}</p>
        <p>Region: ${regionExists.name}</p>
        <p>Phone: ${phone}</p>
        <p>Start Job: ${StartJob}</p>
        <p>End Job: ${EndJob}</p>
        <p>Click below to approve or reject:</p>
        <a href="${approvalLink}" style="color:green">Approve</a> | 
        <a href="${rejectLink}" style="color:red">Reject</a>
      `,
    };

    await transporter.sendMail(mailOptions);

    // إرسال الاستجابة للفرونت إند
    res.status(200).json({
      success: true,
      message: 'Registration request sent to admin. Please wait for approval.',
      token: token,
    });

  } catch (err) {
    console.error('Error registering user:', err);

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }

    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
exports.addToFamousRadiologies = async (req, res) => {
  const { radiologyId } = req.body;

  try {
    const radiology = await Radiology.findByIdAndUpdate(radiologyId, { isFamous: true }, { new: true });
    
    if (!radiology) {
      return res.status(404).json({ message: 'radiology not found' });
    }

    res.status(200).json({ message: 'radiology added to famous radiologies menu', radiology });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getFamousRadiologies = async (req, res) => {
  try {

    const famousRadiologies = await Radiology.find({ isFamous: true });
    
    if (famousRadiologies.length === 0) {
      return res.status(200).json({succes:true  ,data:[] });
    }

    const RadiologieswithRating = famousRadiologies.map((fam)=>{
      let finalRate =0
      if(fam.rate && fam.rate.length>0){
        const totalRating = fam.rate.reduce((sum,r)=> sum+r.rating,0)
        finalRate = Math.round((totalRating / fam.rate.length).toFixed(1))
      }
      return{
        ...fam._doc,
        finalRate:finalRate
      }
    })
   
    res.status(200).json({succes:true , data:RadiologieswithRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteRadiologyAccount = async (req, res) => {
  try {
    const user = req.user;
    if(!user._id)return res.status(404).json({succes:false , message:'Invalid ID' , data:[]})

    await Radiology.findByIdAndDelete(user._id);

    res.status(200).json({ message: "Account deleted successfully" , data:[] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}

exports.approveRadiology = async (req, res) => {
  try {
    const user = await Radiology.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    user.approved = true;
    await user.save();
    const mailOptions = {
      from: 'nabd142025@gmail.com',
      to: user.email,
      subject: 'الرد على طلب التسجيل',
      html: `
          <h3>بعد مراجعة حالة طلبك التالي:</h3>
          <p>Name: ${user.fullName}</p>
          <p>Email: ${user.email}</p>
          <p>Role: ${user.role}</p>
          <p>City: ${user.city}</p>
          <p>Region: ${user.region}</p>
           <p>Phone: ${user.phone}</p>
           <p>StartJob: ${user.StartJob}</p>
           <p>EndJob: ${user.EndJob}</p>
          <h3>تمت الموافقة على طلبك بنجاح </h3>
          <h5>مع أطيب التمنيات</h5>
        `,
    };
    await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json({ success: true, user, message: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.rejectRadiology = async (req, res) => {
  try {
    const user = await Radiology.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    const mailOptions = {
      from: 'nabd142025@gmail.com',
      to: user.email,
      subject: 'الرد على طلب التسجيل',
      html: `
                  <h3>بعد مراجعة حالة طلبك التالي:</h3>
                  <p>Name: ${user.fullName}</p>
                  <p>Email: ${user.email}</p>
                  <p>Role: ${user.role}</p>
                  <p>City: ${user.city}</p>
                  <p>Region: ${user.region}</p>
                   <p>Phone: ${user.phone}</p>
                   <p>StartJob: ${user.StartJob}</p>
                   <p>EndJob: ${user.EndJob}</p>
                  <h3>لم تتم الموافقة على طلبك يرجى إعادة تفقد البيانات وإرسال الطلب مجددا </h3>
                  <h5>مع أطيب التمنيات</h5>
                `,
    };
    await transporter.sendMail(mailOptions);
    await Radiology.deleteOne({ _id: req.params.id });

    res
      .status(200)
      .json({ success: true, message: 'User rejected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};




exports.getradiology = async (req, res) => {
  const { city, region } = req.params;
  const userId = req.user._id;

  const existCity = await City.findById(city);
  const existRegion = existCity.regions.find(r => r._id.toString() === region);
  
  if (!existRegion) return res.status(400).json({ success: false, message: 'Region not found in the selected city' });

  const cityname = existCity.name;
  const regionname = existRegion.name;
  console.log(cityname, regionname);

  const query = { role: 'radiology', city: cityname, region: regionname, approved: true };

  try {
    const findRadiology = await Radiology.find(query);

    if (!findRadiology || findRadiology.length === 0) {
      return res.status(200).json({ succes: true, message: 'No result',data:[] });
    }
   const favouriteDocs = await Favourite.find({ userId, isFavourite: true }).select('specId');
   const userFavourites = favouriteDocs.map(fav => fav.specId.toString());
   
   const radiologiesWithRatings = findRadiology.map((pharma) => {
     const ratings = pharma.rate?.map((r) => r.rating) || [];
     const total = ratings.reduce((sum, rating) => sum + rating, 0);
     const averageRating = (ratings.length ? Math.round((total / ratings.length).toFixed(1)) : 0);
     return {
       ...pharma.toObject(),
       finalRate: averageRating,
       isfavourite: userFavourites.includes(pharma._id.toString()),
     };
   });

    radiologiesWithRatings.sort((a, b) => b.finalRate - a.finalRate);

    return res.status(200).json({ succes: true, data: radiologiesWithRatings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


exports.getFavourites = async (req, res) => {
  try {
    const { userId } = req.params;

    const favourites = await Favourite.find({ userId, isFavourite: true })
    .populate({
      path:'specId',
      select:'-password -resetCode -resetCodeExpires -approved'
    })
      .exec();

    const favouritesWithRating = favourites.map((fav) => {
      const radiology = fav.specId;
      let finalRate = 0;

      if (radiology && radiology.rate && radiology.rate.length > 0) {
        const totalRating = radiology.rate.reduce((sum, r) => sum + r.rating, 0);
        finalRate = Math.round((totalRating / radiology.rate.length).toFixed(1))
      }

      return {
          ...radiology._doc,
          finalRate: finalRate, 
      };
    });

    res.status(200).json({
      succes:true,
      message: 'Favourite radiologies retrieved successfully',
      data: favouritesWithRating,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};




exports.rateRadiology = async (req, res) => {
  try {
    const { radiologyId } = req.params;
    const { userId, rating, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(radiologyId)) {
      return res.status(400).json({ message: 'Invalid Radiologist ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: 'Rating must be between 1 and 5' });
    }

    const radiology = await Radiology.findById(radiologyId);
    if (!radiology) {
      return res.status(404).json({ message: 'Pharmacist not found' });
    }

    // تأكد من أن rate هو مصفوفة
    if (!radiology.rate) {
      radiology.rate = [];
    }

    // التحقق مما إذا كان المستخدم قد قيم سابقًا
    const existingRatingIndex = radiology.rate.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingRatingIndex !== -1) {
      // تحديث التقييم الحالي
      radiology.rate[existingRatingIndex].rating = rating;
      radiology.rate[existingRatingIndex].review = review;
      radiology.rate[existingRatingIndex].date = new Date();
    } else {
      // إضافة تقييم جديد
      radiology.rate.push({ userId, rating, review, date: new Date() });
    }

    await radiology.save();

    res
      .status(200)
      .json({ message: 'Rating submitted successfully', data: radiology.rate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFinalRateForRadiology = async (req, res) => {
  try {
    const radiologyId = req.params.radiologyId;
    const radiology = await Radiology.findById(radiologyId);
    if (!radiology) {
      return res.status(404).json({ message: 'Radiology not found' });
    }

    // Get all ratings
    const ratings = radiology.rate.map((r) => r.rating);

    if (ratings.length === 0) {
      return res.json({
        radiologyId,
        finalRate: 0,
        message: 'No ratings available',
      });
    }

    // Calculate average rating
    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    const averageRating = Math.round((total / ratings.length).toFixed(1));

    res.status(200).json({succes:true , radiologyId, finalRate: averageRating });
  } catch (error) {
    console.error('Error calculating rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.loginRadio = async (req, res) => {
  const { email, password } = req.body;
  
    if (!email) {
      return res.status(403).json({ message: 'Email is required' });
    }
  
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
  
    try {
      const user = await Radiology.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'Email is not correct' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: 'Password is not correct' });
      }
  
      await RefreshToken.deleteMany({ userRef: user._id });
  
      const data = user.toObject({ getters: true, versionKey: false });
      delete data.password;
      delete data.resetCode;
      delete data.resetCodeExpires;
  
  
      const token = jwt.sign(
        { _id: user._id, role: 'doctor' },
        '1001110'
      );
  
      await RefreshToken.create({ token, userRef: user._id });
  
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        data,
      });
    } catch (err) {
      console.error('Error logging in:', err);
      return res.status(500).json({
        success: false,
        message: `Internal server error: ${err.message}`,
      });
    }
};
function extractTime(timeString) {
  const match = timeString.match(/\((\d{2}:\d{2})\)/);
  
  return match ? `${match[1]}` : null;
}


exports.updateRadiologyInfo = async (req, res) => {
  try {
    const { fullName, city, region, address, phone, StartJob, EndJob } = req.body;
    const id = req.params.id;

    const updateFields = {};

    if (fullName) updateFields.fullName = fullName;
    if (address) updateFields.address = address;
    if (phone) updateFields.phone = phone;
    
    if (StartJob) updateFields.StartJob =StartJob;
    if (EndJob) updateFields.EndJob = EndJob;

    if (city) {
      const existCity = await City.findById(city);
      if (!existCity) {
        return res.status(400).json({ success: false, message: 'City not found' });
      }
      updateFields.city = existCity.name;

      if (region) {
        const existRegion = existCity.regions.find(r => r._id.toString() === region);
        if (!existRegion) {
          return res.status(400).json({ success: false, message: 'Region not found in the selected city' });
        }
        updateFields.region = existRegion.name;
      }
    }

    await Radiology.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: updateFields });

    res.status(200).json({ success: true, message: 'Updated Successfully' });
  } catch (err) {
    console.error('Error updating analyst info:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    res.status(500).json({ success: false, message: `Internal server error ${err} `});
  }
};

exports.forgetPassForRadiology = async (req, res) => {
  const { email } = req.body;
  const user = await Radiology.findOne({ email });

  if (!user) return res.status(400).json({ message: "User not found" });

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 20 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
      from: 'nabd142025@gmail.com',
      to: email,
      subject: "Password Reset Code",
      html: `<h4>Your password reset code is:</h4> <h2>${resetCode}</h2>`,
  });

  res.json({ message: "Reset code sent to your email" });
}

exports.verifyCodeRadiology = async (req, res) => {
  const { email, code } = req.body;
  const user = await Radiology.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired code" });
  }

  res.json({ message: "Code verified successfully" });
}


exports.resetRadiologyPass = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await Radiology.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired code" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();

  res.json({ message: "Password reset successfully" });
}


exports.toggleRadiologyFavourite = async (req, res) => {
  try {
    const { userId,specId } = req.body;

    const pharma = await Radiology.findById(specId);
    console.log(pharma)
    if (!pharma) {
      return res.status(404).json({ message: 'Radiology not found' });
    }

    const existingFavourite = await Favourite.findOne({ userId, specId });

    if (existingFavourite) {
      existingFavourite.isFavourite = !existingFavourite.isFavourite;
      await existingFavourite.save();
      
      return res.status(200).json({
        message: existingFavourite.isFavourite ? 'radiology added to favourites' : 'radiology removed from favourites',
        isFavourite: existingFavourite.isFavourite
      });
    } else {
      const newFavourite = new Favourite({ userId, specId, isFavourite: true });
      await newFavourite.save();

      return res.status(200).json({
        message: 'radiology added to favourites',
        isFavourite: true
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports.getFavourites = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const favourites = await Favourite.find({ userId, isFavourite: true })
//       .populate('radiologyId')
//       .exec();

//     if (favourites.length === 0) {
//       return res.status(200).json({succes:true , message: 'No favourite doctors found',data:[] });
//     }

//     res.status(200).json({succes:true , message: 'Favourite doctors retrieved successfully', data:favourites });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
exports.deleteFromFavo = async (req,res)=>{
  try{
    const {cardId} = req.params
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
          return res.status(400).json({ message: 'Invalid User ID format' });
    }
    const user = await Favourite.findByIdAndDelete(cardId)
    if(!user){
      return res.status(404).json({message:'User not found'})
    }
    return res.status(200).json({message:'Delete succesfully'})
  }catch(err){
    return res.status(500).json({message:`Server error ${err}`})
  }
}
// exports.getRadiologyInfo = async(req,res)=>{
//   try{
//     const id = req.params.id
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid User ID format' });
//     }
//     const pharma = await Radiology.findById(id)
//     if(!pharma){
//       return res.status(404).json({message:' user is not availble'})
//     }
//     return res.status(200).json({success:true , pharma })
//   }catch(err){
//     return res.status(500).json({message:'Server error'})
//   }
// }