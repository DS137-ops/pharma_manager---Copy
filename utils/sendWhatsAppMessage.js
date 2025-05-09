const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const port = 3000;


let currentQR = null;

const client = new Client();

client.on('qr', async (qr) => {
    console.log('QR received');
    currentQR = qr;
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});

client.initialize();

app.get('/qr', async (req, res) => {
    if (!currentQR) {
        return res.status(404).send('QR not available yet. Please wait...');
    }

    try {
        const qrImageData = await qrcode.toDataURL(currentQR);
        res.send(`
            <html>
                <body>
                    <h2>Scan this QR code with WhatsApp:</h2>
                    <img src="${qrImageData}" />
                </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send('Error generating QR code');
    }
});


