const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var nodemailer = require('nodemailer');
const RefreshToken = require('../model/RefreshToken.model');
const City = require('../model/cities.model');
const Favourite = require('../model/FavouriteAnalyst.model');
const Analyst = require('../model/analyst.model');
const Seek = require('../model/seek.model');
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
    city, // city ID
    region, // region ID
    address,
    phone,
    firebasetoken,
    StartJob,
    EndJob,
  } = req.body;

  // Check if all required fields are provided
  if (
    !fullName ||
    !email ||
    !password ||
    !city ||
    !region ||
    !address ||
    !phone ||
    !firebasetoken||
    !StartJob ||
    !EndJob
  ) {
    return res
      .status(404)
      .json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if the email already exists in the database
    const existingUser = await Analyst.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists' });
    }

    // Look up the city by ID and get its name
    const cityExists = await City.findById(city);
    if (!cityExists)
      return res
        .status(400)
        .json({ success: false, message: 'City not found' });

    // Look up the region by ID within the selected city
    const regionExists = cityExists.regions.find(
      (r) => r._id.toString() === region
    );
    if (!regionExists)
      return res.status(400).json({
        success: false,
        message: 'Region not found in the selected city',
      });

    // Create a JWT token for the new analyst

    // Create a new Analyst instance with the name of the city and region
    const newUser = new Analyst({
      fullName,
      email,
      password,
      city: cityExists.name,
      region: regionExists.name,
      address,
      phone,
      firebasetoken,
      StartJob,
      EndJob,
    });

    await newUser.save();
    const token = await jwt.sign(
      { _id: newUser._id, role: 'analyst' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    await RefreshToken.create({ token, userRef: newUser._id });
    const approvalLink = `http://147.93.106.92:8080/api/Analyst/approve/analyst/${newUser._id}`;
    const rejectLink = `http://147.93.106.92:8080/api/Analyst/reject/analyst/${newUser._id}`;

    const mailOptions = {
      from: email,
      to: 'feadkaffoura@gmail.com',
      subject: 'New Registration Request',
      html: `
        <h3>New Registration Request</h3>
        <p>Name: ${fullName}</p>
        <p>Email: ${email}</p>
        <p>Role: ${newUser.role}</p>
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

    // Send the email to the admin
    await transporter.sendMail(mailOptions);

    // Return the success response to the frontend
    res.status(200).json({
      success: true,
      message: 'Registration request sent to admin. Please wait for approval.',
      data: token,
    });
  } catch (err) {
    console.error('Error registering user:', err);

    // Handle validation errors and other types of errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(', ') });
    }

    // General error response
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


exports.sendAnalystNotification = async (req, res) => {
  try {
    const { userId, title, body } = req.body;

    const user = await Analyst.findById(userId);
    if (!user || !user.firebasetoken) {
      return res.status(404).json({ message: 'User or Firebase token not found' });
    }

    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: user.firebasetoken,
    };

    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);

    return res.status(200).json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Notification error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToFamousAnalysts = async (req, res) => {
  const { analystId } = req.body;

  try {
    const analyst = await Analyst.findByIdAndUpdate(
      analystId,
      { isFamous: true },
      { new: true }
    );

    if (!analyst) {
      return res.status(404).json({ message: 'analyst not found' });
    }

    res
      .status(200)
      .json({
        succes: true,
        message: 'analyst added to famous analysts menu',
        data: analyst,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFamousAnalysts = async (req, res) => {
  try {
    const famousAnalysts = await Analyst.find({ isFamous: true });

    if (famousAnalysts.length === 0) {
      return res
        .status(200)
        .json({ succes: true, message: 'No famous Analysts found', data: [] });
    }

    const analystswithRating = famousAnalysts.map((fam) => {
      let finalRate = 0;
      if (fam.rate && fam.rate.length > 0) {
        const totalRating = fam.rate.reduce((sum, r) => sum + r.rating, 0);
        finalRate = Math.round((totalRating / fam.rate.length).toFixed(1));
      }
      return {
        ...fam._doc,
        finalRate: finalRate,
      };
    });

    res
      .status(200)
      .json({ succes: true, message: '', data: analystswithRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchanalystByName = async (req, res) => {
  try {
    const { fullName } = req.query;
const userId = req.user?._id;
    if (!fullName || fullName.trim() === '') {
      return res
        .status(400)
        .json({ status: false, message: 'Please provide a valid name' });
    }

    const regex = new RegExp(fullName, 'i');

    const analysts = await Analyst.find({ fullName: regex });
    if (!analysts.length) {
      return res
        .status(200)
        .json({
          status: true,
          message: 'No matching analysts found',
          data: [],
        });
    }

const analystsWithRatings = await Promise.all(
  analysts.map(async (analyst) => {
    const ratings = analyst.rate?.map((r) => r.rating) || [];
    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    const averageRating =
      ratings.length > 0
        ? Math.round((total / ratings.length).toFixed(1))
        : 0;
console.log(userId)
    let isFavourite = false;
    if (userId) {
      const fav = await Favourite.findOne({
        userId,
        specId: analyst._id,
        isFavourite: true,
      });
      isFavourite = !!fav;
    }
console.log(isFavourite)
    const analystObj = analyst.toObject();
    delete analystObj.password;
    delete analystObj.resetCode;
    delete analystObj.resetCodeExpires;
    delete analystObj.rate;

    return {
      ...analystObj,
      finalRate: averageRating,
      isFavourite,
    };
  })
);
    
    return res.status(200).json({ status: true, data: analystsWithRatings });
  } catch (error) {
    console.error('Search error:', error);
    res
      .status(500)
      .json({ status: false, message: 'Server error', error: error.message });
  }
};

exports.deleteAnalystAccount = async (req, res) => {
  try {
    const user = req.user;

    if (!user._id)
      return res
        .status(404)
        .json({ succes: false, message: 'Invalid ID', data: [] });
    await Analyst.findByIdAndDelete(user._id);

    res
      .status(200)
      .json({
        succes: true,
        message: 'Account deleted successfully',
        data: [],
      });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
exports.loginAna = async (req, res) => {
  const { email, password, firebase_token } = req.body;

  if (!email) return res.status(403).json({ message: 'Email is required' });
  if (!password) return res.status(400).json({ message: 'Password is required' });
  if (!firebase_token) return res.status(400).json({ message: 'firebase_token is required' });

  try {
    const user = await Analyst.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email is not correct' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password is not correct' });
    }

    user.firebasetoken = firebase_token;
    await user.save();


    await RefreshToken.deleteMany({ userRef: user._id });


    const token = jwt.sign({ id: user._id, role: 'analyst' }, '1001110');
    await RefreshToken.create({ token, userRef: user._id });

    // تجهيز البيانات المسترجعة
    const data = user.toObject({ getters: true, versionKey: false });
    delete data.password;
    delete data.resetCode;
    delete data.resetCodeExpires;

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
exports.rateAnalyst = async (req, res) => {
  try {
    const analystId = req.params.AnalystId;
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
  const userId = req.user._id;

  const existCity = await City.findById(city);
  const existRegion = existCity.regions.find(
    (r) => r._id.toString() === region
  );

  if (!existRegion)
    return res.status(400).json({
      success: false,
      message: 'Region not found in the selected city',
    });

  const cityname = existCity.name;
  const regionname = existRegion.name;
  console.log(cityname, regionname);

  const query = {
    role: 'analyst',
    city: cityname,
    region: regionname,
    approved: true,
  };

  try {
    const findAnalyst = await Analyst.find(query).select('-password');

    if (!findAnalyst || findAnalyst.length === 0) {
      return res
        .status(200)
        .json({ succes: true, message: 'No result', data: [] });
    }
    const favouriteDocs = await Favourite.find({
      userId,
      isFavourite: true,
    }).select('specId');
    const userFavourites = favouriteDocs.map((fav) => fav.specId.toString());

    const analystsWithRatings = findAnalyst.map((pharma) => {
      const ratings = pharma.rate?.map((r) => r.rating) || [];
      const total = ratings.reduce((sum, rating) => sum + rating, 0);
      const averageRating = ratings.length
        ? Math.round((total / ratings.length).toFixed(1))
        : 0;
      return {
        ...pharma.toObject(),
        finalRate: averageRating,
        isfavourite: userFavourites.includes(pharma._id.toString()),
      };
    });

    analystsWithRatings.sort((a, b) => b.finalRate - a.finalRate);

    return res.status(200).json({ status: true, data: analystsWithRatings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

function extractTime(timeString) {
  if (!timeString) return null;

  // Match either (12:30) or 12:30 format
  const match = timeString.match(/(\d{2}:\d{2})/);

  return match ? match[1] : null;
}

exports.updateAnalystInfo = async (req, res) => {
  try {
    const { fullName, city, region, address, phone, StartJob, EndJob } =
      req.body;
    const id = req.params.id;

    const updateFields = {};

    if (fullName) updateFields.fullName = fullName;
    if (address) updateFields.address = address;
    if (phone) updateFields.phone = phone;

    if (StartJob) updateFields.StartJob = StartJob;
    if (EndJob) updateFields.EndJob = EndJob;

    if (city) {
      const existCity = await City.findById(city);
      if (!existCity) {
        return res
          .status(400)
          .json({ success: false, message: 'City not found' });
      }
      updateFields.city = existCity.name;

      if (region) {
        const existRegion = existCity.regions.find(
          (r) => r._id.toString() === region
        );
        if (!existRegion) {
          return res.status(400).json({
            success: false,
            message: 'Region not found in the selected city',
          });
        }
        updateFields.region = existRegion.name;
      }
    }

    await Analyst.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateFields }
    );

    res.status(200).json({
      success: true,
      message: 'Updated Successfully',
      data: updateFields,
    });
  } catch (err) {
    console.error('Error updating analyst info:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(', ') });
    }
    res
      .status(500)
      .json({ success: false, message: `Internal server error ${err} ` });
  }
};

exports.forgetPassForAnalyst = async (req, res) => {
  const { email } = req.body;
  const user = await Analyst.findOne({ email });

  if (!user) return res.status(400).json({ message: 'User not found' });

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 20 * 60 * 1000;
  await user.save();

  await transporter.sendMail({
    from: 'nabd142025@gmail.com',
    to: email,
    subject: 'Password Reset Code',
    html: `<h4>Your password reset code is:</h4> <h2>${resetCode}</h2>`,
  });

  res
    .status(200)
    .json({ succes: true, message: 'Reset code sent to your email' });
};

exports.verifyCodeAnalyst = async (req, res) => {
  const { email, code } = req.body;
  const user = await Analyst.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  res.status(200).json({ succes: true, message: 'Code verified successfully' });
};

exports.resetAnalystPass = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const user = await Analyst.findOne({ email });

  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();

  res
    .status(200)
    .json({ succes: true, message: 'Password reset successfully' });
};

exports.toggleAnalystFavourite = async (req, res) => {
  try {
    const { userId, specId } = req.body;

    const pharma = await Analyst.findById(specId);
    if (!pharma) {
      return res.status(404).json({ message: 'Analyst not found' });
    }

    const existingFavourite = await Favourite.findOne({ userId, specId });

    if (existingFavourite) {
      existingFavourite.isFavourite = !existingFavourite.isFavourite;
      await existingFavourite.save();

      return res.status(200).json({
        message: existingFavourite.isFavourite
          ? 'Analyst added to favourites'
          : 'Analyst removed from favourites',
        isFavourite: existingFavourite.isFavourite,
      });
    } else {
      const newFavourite = new Favourite({
        userId,
        specId,
        isFavourite: true,
      });
      await newFavourite.save();

      return res.status(200).json({
        message: 'Analyst added to favourites',
        isFavourite: true,
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
      .populate({
        path: 'specId',
        select: '-password -resetCode -resetCodeExpires -approved',
      })
      .exec();

    const favouritesWithRating = favourites.map((fav) => {
      const analyst = fav.specId;
      let finalRate = 0;

      if (analyst && analyst.rate && analyst.rate.length > 0) {
        const totalRating = analyst.rate.reduce((sum, r) => sum + r.rating, 0);
        finalRate = Math.round((totalRating / analyst.rate.length).toFixed(1));
      }

      return {
        ...analyst._doc,
        finalRate: finalRate,
        isFavourite:true
      };
    });

    res.status(200).json({
      message: 'Favourite analysts retrieved successfully',
      data: favouritesWithRating,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFromFavo = async (req, res) => {
  try {
    const { cardId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }
    const user = await Favourite.findByIdAndDelete(cardId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'Delete succesfully' });
  } catch (err) {
    return res.status(500).json({ message: `Server error ${err}` });
  }
};

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
