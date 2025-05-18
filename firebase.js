
const admin = require("firebase-admin");
const serviceAccount = require("./path-to-your-firebase-adminsdk.json"); // 👈 Replace with your file path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
