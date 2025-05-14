// whatsappClient.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'pharma-client',
    dataPath: './whatsapp-session'
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
});

client.on('auth_failure', msg => {
  console.error('❌ Auth failure:', msg);
});

client.on('disconnected', reason => {
  console.log('🔌 Client disconnected:', reason);
});

client.initialize();

module.exports = client;
