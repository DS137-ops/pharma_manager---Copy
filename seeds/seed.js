const mongoose = require('mongoose');
const seedDoctors = require('../seeds/doctorseed');
const seedAnalysts = require('../seeds/analystseed');
const pharmaseed = require('../seeds/pharmaseed');
const seedRadiologies = require('../seeds/radiologyseed');
mongoose.connect('mongodb://localhost:27017/medicalapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  await seedDoctors();
  await seedAnalysts();
  await pharmaseed();
  await seedRadiologies()
  console.log('Seeding finished');
  mongoose.disconnect();
})
.catch((err) => {
  console.error('Connection or Seeding error:', err.message);
});
