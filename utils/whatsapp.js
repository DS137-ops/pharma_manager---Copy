const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let latestQr = ''; 

const client = new Client({
    puppeteer: {
        executablePath: '/usr/bin/chromium-browser', // مسار Chromium المثبت
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
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
