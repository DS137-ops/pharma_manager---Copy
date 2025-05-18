const admin = require("../firebase");

const sendNotification = async (req, res) => {
  const { title, body, token } = req.body;

  if (!title || !body || !token) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const message = {
    notification: {
      title,
      body,
    },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Notification Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  sendNotification,
};
