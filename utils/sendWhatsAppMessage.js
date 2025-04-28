// const axios = require('axios');

// exports.sendWhatsAppMessage = async(phone, message)=> {
//     const token = process.env.WHATSAPP_TOKEN;
//     const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

//     await axios.post(
//         `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
//         {
//             messaging_product: "whatsapp",
//             to: phone,
//             text: { body: message },
//         },
//         {
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 "Content-Type": "application/json",
//             },
//         }
//     );
// }

