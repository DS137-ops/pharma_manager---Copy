const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let latestQr = ''; 

const client = new Client();

client.initialize();

client.on('qr', (qr) => {
    latestQr = qr;
    console.log('QR Code updated!');
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

module.exports = {
    client,
    getLatestQr: () => latestQr,
    qrcode
};
