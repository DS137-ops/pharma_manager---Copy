const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'pharma-client',
    dataPath: './whatsapp-session',
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', qr => {
  console.log('📷 QR code received, scan it using WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
});

client.on('authenticated', () => {
  console.log('🔐 WhatsApp client authenticated.');
});

client.on('auth_failure', msg => {
  console.error('❌ Authentication failure:', msg);
});

client.on('disconnected', reason => {
  console.log('🔌 Client disconnected:', reason);
});

client.initialize();

module.exports = client;
