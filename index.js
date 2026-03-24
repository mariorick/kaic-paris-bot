const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('ERRO: BOT_TOKEN não foi definido.');
  process.exit(1);
}

console.log('Iniciando bot...');

const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '✨ Bot funcionando!');
});

console.log('Bot iniciado com sucesso.');
