const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const RefreshToken = require('../model/RefreshToken.model');
const Favourite = require('../model/FavouriteAnalyst.model');
const Analyst = require('../model/analyst.model');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nabd142025@gmail.com',
    pass: 'nzxm wyky hapd xqsu', // firaskingsalha67  CX6EQ-VQ2H4-JKC2H-JLUFY-A5NYA   cpzz lnvy ldus tczj
  },
});
exports.createNewAnalyst = async (req, res) => {
  const {
    fullName,
    email,
    password,
    city,
    region,
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
    return res
      .status(404)
      .json({ success: false, message: 'All fields are required' });
  }
  try {
    const existingUser = await Analyst.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }
 const token = await jwt.sign({  role: 'analyst' }, process.env.JWT_SECRET);

    await RefreshToken.create({ token });
    newUser = new Analyst({
      fullName,
      email,
      password,
      city,
      region,
      address,
      phone,
      StartJob,
      EndJob,
    });
    // https://pharma-manager-copy-1.onrender.com
    await newUser.save();
    const approvalLink = `http://147.93.106.92/api/Analyst/approve/analyst/${newUser._id}`;
    const rejectLink = `http://147.93.106.92/api/Analyst/reject/analyst/${newUser._id}`;
    const mailOptions = {
      from: email,
      to: 'feadkaffoura@gmail.com',
      subject: 'Test Email with Hotmail',
      html: `
            <h3>New Registration Request</h3>
            <p>Name: ${fullName}</p>
            <p>Email: ${email}</p>
            <p>Role: ${newUser.role}</p>
            <p>City: ${city}</p>
            <p>Region: ${region}</p>
             <p>Phone: ${phone}</p>
             <p>StartJob: ${StartJob}</p>
             <p>EndJob: ${EndJob}</p>
            <p>Click below to approve or reject:</p>
            <a href="${approvalLink}" style="color:green">Approve</a> | <a href="${rejectLink}" style="color:red">Reject</a>
          `,
    };
    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ success: true, message: 'Registration request sent to admin' , token:token });

  } catch (err) {
    console.error('Error registering user:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(', ') });
    }

    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteAnalystAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = req.user;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    await Analyst.findByIdAndDelete(user._id);

    res.status(200).json({ message: "Account deleted successfully" , data:[] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}
exports.loginAna = async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(403).json({ message: 'email is required' });
  }
  if (!password) {
    return res.status(400).json({ message: 'password is required' });
  }
  try {
    const user = await Analyst.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Email is Not Correct' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'password is Not the same' });
    }
    const token = await jwt.sign({ id: user._id, role: 'analyst' }, '1001110');
    RefreshToken.create({ token });

    res
      .status(200)
      .json({ success: true, message: 'Login successful', token, user });
  } catch (err) {
    console.error('Error logging in:', err);
    res
      .status(500)
      .json({ success: false, message: `Internal server error ${err}` });
  }
};
exports.rateAnalyst = async (req, res) => {
  try {
    const  analystId  = req.params.AnalystId;
    const { userId, rating, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(analystId)) {
      return res.status(400).json({ message: 'Invalid Analyst ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: 'Rating must be between 1 and 5' });
    }

    const analyst = await Analyst.findById(analystId);
    if (!analyst) {
      return res.status(404).json({ message: 'Analyst not found' });
    }
    if (!analyst.rate) {
      analyst.rate = [];
    }
    const existingRatingIndex = analyst.rate.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingRatingIndex !== -1) {
      analyst.rate[existingRatingIndex].rating = rating;
      analyst.rate[existingRatingIndex].review = review;
      analyst.rate[existingRatingIndex].date = new Date();
    } else {
      analyst.rate.push({ userId, rating, review, date: new Date() });
    }

    await analyst.save();

    res
      .status(200)
      .json({ message: 'Rating submitted successfully', data: analyst.rate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.approveAnalyst = async (req, res) => {
  try {
    const user = await Analyst.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    user.approved = true;
    await user.save();

    res
      .status(200)
      .json({ success: true, user, message: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.rejectAnalyst = async (req, res) => {
  try {
    const user = await Analyst.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    await Analyst.deleteOne({ _id: req.params.id });

    res
      .status(200)
      .json({ success: true, message: 'User rejected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAnalyst = async (req, res) => {
  const { city, region } = req.params;
  const query = { role: 'analyst', city, region, approved: true };

  try {
    const findPharma = await Analyst.find(query);

    if (!findPharma || findPharma.length === 0) {
      return res.status(404).json({ status: false, message: 'No result' });
    }
    const pharmaciesWithRatings = findPharma.map((pharma) => {
      const ratings = pharma.rate?.map((r) => r.rating) || [];
      const total = ratings.reduce((sum, rating) => sum + rating, 0);
      const averageRating = ratings.length > 0 ? (total / ratings.length).toFixed(1) : 0;

      return {
        ...pharma.toObject(),
        finalRate: parseFloat(averageRating),
      };
    });

    pharmaciesWithRatings.sort((a, b) => b.finalRate - a.finalRate);

    return res.status(200).json({ status: true, findPharma: pharmaciesWithRatings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

function extractTime(timeString) {
  const match = timeString.match(/\((\d{2}:\d{2})\)/);

  return match ? `${match[1]}` : null;
}

exports.updateAnalystInfo = async (req, res) => {
  try {
    const {
      fullName,
      city,
      region,
      address,
      phone,
      StartJob,
      EndJob,
    } = req.body;
    const id = req.params.id;
    
  const startjob= await extractTime(StartJob);
  const endjob= await extractTime(EndJob);
  
    await Analyst.updateMany(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          fullName: fullName,
          city: city,
          region: region,
          address: address,
          phone: phone,
          StartJob: startjob,
          EndJob: endjob,
        },
      }
    );
    res.status(200).json({ success: true, message: 'UpdatedSuccesffuly' });
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(', ') });
    }

    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.forgetPassForAnalyst = async (req, res) => {
  const { email } = req.body;
  const user = await Analyst.findOne({ email });

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

exports.verifyCodeAnalyst = async (req, res) => {
  const { email, code } = req.body;
  const user = await Analyst.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired code" });
  }

  res.json({ message: "Code verified successfully" });
}


exports.resetAnalystPass = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await Analyst.findOne({ email });

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

exports.toggleAnalystFavourite = async (req, res) => {
  try {
    const { userId, analystId } = req.body;

    const pharma = await Analyst.findById(analystId);
    if (!pharma) {
      return res.status(404).json({ message: 'Analyst not found' });
    }

    const existingFavourite = await Favourite.findOne({ userId, analystId });

    if (existingFavourite) {
      existingFavourite.isFavourite = !existingFavourite.isFavourite;
      await existingFavourite.save();
      
      return res.status(200).json({
        message: existingFavourite.isFavourite ? 'Analyst added to favourites' : 'Analyst removed from favourites',
        isFavourite: existingFavourite.isFavourite
      });
    } else {
      const newFavourite = new Favourite({ userId, analystId, isFavourite: true });
      await newFavourite.save();

      return res.status(200).json({
        message: 'Analyst added to favourites',
        isFavourite: true
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getFavourites = async (req, res) => {
  try {
    const { userId } = req.params;

    const favourites = await Favourite.find({ userId, isFavourite: true })
      .populate('analystId')
      .exec();

    if (favourites.length === 0) {
      return res.status(404).json({ message: 'No favourite doctors found' });
    }

    res.status(200).json({ message: 'Favourite doctors retrieved successfully', favourites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

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

// exports.getAnalystInfo = async(req,res)=>{
//   try{
//     const id = req.params.id
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid User ID format' });
//     }
//     const pharma = await Analyst.findById(id)
//     if(!pharma){
//       return res.status(404).json({message:' user is not availble'})
//     }
//     return res.status(200).json({success:true , pharma })
//   }catch(err){
//     return res.status(500).json({message:'Server error'})
//   }
// }