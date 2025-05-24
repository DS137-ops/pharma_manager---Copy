const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let latestQr = ''; 

const client = new Client({
    puppeteer: {
        executablePath: '/usr/bin/chromium-browser',  // تحقق من المسار الصحيح بكتابة `which chromium-browser`
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

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
