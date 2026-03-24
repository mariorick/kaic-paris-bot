const TelegramBot = require('node-telegram-bot-api');

const token = process.env.8657772002:AAHCDieDogeAHkfgH8XFZ2tGiwFi3MGK1b0;

if (!token) {
  console.error('ERRO: BOT_TOKEN não foi definido nas variáveis de ambiente.');
  process.exit(1);
}

console.log('Iniciando bot...');

const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error.message);
});

bot.onText(/\/start(?:\s+(.*))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const source = match && match[1] ? match[1] : 'direct';

  console.log('Recebido /start de:', {
    chatId,
    username: msg.from?.username,
    firstName: msg.from?.first_name,
    source
  });

  const welcomeMessage =
    `✨ Bem-vindo ao universo de Kaic Paris\n\n` +
    `Escolha uma das opções abaixo para continuar:`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔥 Prévias', url: 'https://t.me/+n9padkABd9Q1MDgx' }],
        [{ text: '💎 VIP', url: 'https://t.me/+MIzDfcW5GBBiOGJh' }],
        [{ text: '🔗 Privacy', url: 'https://privacy.com.br/profile/kaicparis' }],
        [{ text: '⭐ OnlyFans', url: 'https://onlyfans.com/kaicparis' }]
      ]
    }
  };

  bot.sendMessage(chatId, welcomeMessage, options)
    .then(() => {
      console.log('Mensagem enviada com sucesso para chatId:', chatId);
    })
    .catch((err) => {
      console.error('Erro ao enviar mensagem:', err.message);
    });
});

bot.on('message', (msg) => {
  console.log('Mensagem recebida:', {
    text: msg.text,
    chatId: msg.chat.id,
    username: msg.from?.username
  });
});

console.log('Bot iniciado com polling ativo.');
