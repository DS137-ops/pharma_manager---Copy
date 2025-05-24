const admin = require('firebase-admin');
const serviceAccount = require('./healix-3a2fe-firebase-adminsdk-fbsvc-10172aefee.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
