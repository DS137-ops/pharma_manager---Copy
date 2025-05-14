const express = require('express');
const app = express();
const { Client } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
let currentQR = null;

const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

let qrShown = false;

client.on('qr', (qr) => {
  currentQR = qr;

  if (!qrShown) {
    console.log('QR code generated. Waiting for scan...');
    qrShown = true;
  }

  qrcodeTerminal.generate(qr, { small: true });
});
client.on('authenticated', () => {
  console.log('WhatsApp Client is authenticated!');
});
client.on('auth_failure', () => {
  console.log('Authentication failed, resetting QR flag.');
  qrShown = false;
});


client.on('ready', () => {
  console.log('WhatsApp Client is ready!');
});

client.initialize();

app.get('/qr', (req, res) => {
  if (!currentQR) {
    return res.status(404).send('QR not available yet. Please wait...');
  }

  const qrImageURL = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(
    currentQR
  )}`;

  res.send(`
    <html>
      <body>
        <h2>Scan this QR code with WhatsApp:</h2>
        <img src="${qrImageURL}" alt="WhatsApp QR Code"/>
        <p>If the QR code doesn’t load, <a href="${qrImageURL}" target="_blank">click here</a></p>
      </body>
    </html>
  `);
});

module.exports = client;