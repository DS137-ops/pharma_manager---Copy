const admin = require('firebase-admin');
const serviceAccount = require('./healix-84b99-firebase-adminsdk-fbsvc-6bb7495c53.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
