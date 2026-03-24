// index.js
// Bot Telegram Kaic Paris
// Node 18+ / 20+ / 22+
// Sem dependências externas

const BOT_TOKEN = process.env.BOT_TOKEN;
const BRAND_NAME = process.env.BRAND_NAME || "Kaic Paris";

const SITE_URL = process.env.SITE_URL || "https://kaicparis.com.br";
const VIP_URL = process.env.VIP_URL || "https://kaicparis.com.br/vip";
const PREVIEW_CHANNEL_URL =
  process.env.PREVIEW_CHANNEL_URL || "https://t.me/seu_canal_de_previas";
const REQUIRED_CHANNEL_USERNAME =
  process.env.REQUIRED_CHANNEL_USERNAME || ""; // exemplo: @seu_canal_de_previas
const SUPPORT_URL = process.env.SUPPORT_URL || "https://t.me/seu_suporte";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || ""; // seu chat id pessoal

if (!BOT_TOKEN) {
  console.error("ERRO: BOT_TOKEN não foi definido.");
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function api(method, payload = {}) {
  const response = await fetch(`${API_BASE}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.description || `Falha ao chamar ${method}`);
  }

  return data.result;
}

async function sendMessage(chatId, text, extra = {}) {
  return api("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

async function answerCallbackQuery(callbackQueryId, text = "", showAlert = false) {
  return api("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  });
}

function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🔥 Entrar no canal de prévias", url: PREVIEW_CHANNEL_URL }],
      [{ text: "💎 Liberar acesso VIP", callback_data: "vip_access" }],
      [
        { text: "🌐 Site oficial", url: SITE_URL },
        { text: "🆘 Suporte", url: SUPPORT_URL },
      ],
    ],
  };
}

function vipKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "💎 Abrir VIP", url: VIP_URL }],
      [{ text: "🌐 Site oficial", url: SITE_URL }],
    ],
  };
}

function joinFirstKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🔥 Entrar no canal de prévias", url: PREVIEW_CHANNEL_URL }],
      [{ text: "✅ Já entrei, liberar agora", callback_data: "vip_access" }],
    ],
  };
}

async function notifyAdminNewLead(user, origin = "start") {
  if (!ADMIN_CHAT_ID) return;

  const nome = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const username = user.username ? `@${user.username}` : "(sem username)";
  const text =
    `🚨 <b>Novo lead no bot</b>\n\n` +
    `Origem: <b>${escapeHtml(origin)}</b>\n` +
    `Nome: <b>${escapeHtml(nome || "Sem nome")}</b>\n` +
    `Username: <b>${escapeHtml(username)}</b>\n` +
    `User ID: <code>${user.id}</code>`;

  try {
    await sendMessage(ADMIN_CHAT_ID, text);
  } catch (error) {
    console.error("Erro ao avisar admin sobre lead:", error.message);
  }
}

async function notifyAdminVipAccess(user) {
  if (!ADMIN_CHAT_ID) return;

  const nome = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const username = user.username ? `@${user.username}` : "(sem username)";
  const text =
    `💎 <b>Acesso VIP liberado</b>\n\n` +
    `Nome: <b>${escapeHtml(nome || "Sem nome")}</b>\n` +
    `Username: <b>${escapeHtml(username)}</b>\n` +
    `User ID: <code>${user.id}</code>`;

  try {
    await sendMessage(ADMIN_CHAT_ID, text);
  } catch (error) {
    console.error("Erro ao avisar admin sobre VIP:", error.message);
  }
}

async function getMemberStatus(userId) {
  if (!REQUIRED_CHANNEL_USERNAME) return null;

  try {
    const result = await api("getChatMember", {
      chat_id: REQUIRED_CHANNEL_USERNAME,
      user_id: userId,
    });

    return result?.status || null;
  } catch (error) {
    console.error("Erro ao consultar membro do canal:", error.message);
    return null;
  }
}

async function hasVipEligibility(userId) {
  if (!REQUIRED_CHANNEL_USERNAME) {
    return true;
  }

  const status = await getMemberStatus(userId);

  // statuses comuns válidos
  return ["creator", "administrator", "member", "restricted"].includes(status);
}

async function sendWelcome(chatId, firstName = "") {
  const saudacao = firstName ? `Oi, ${escapeHtml(firstName)} ✨` : "Oi ✨";

  const text =
    `${saudacao}\n\n` +
    `Bem-vindo(a) ao <b>${escapeHtml(BRAND_NAME)}</b>.\n\n` +
    `Aqui você pode acessar o canal de prévias, entrar no VIP e encontrar os links oficiais com segurança.\n\n` +
    `Escolha uma opção abaixo:`;

  await sendMessage(chatId, text, {
    reply_markup: mainMenuKeyboard(),
  });
}

async function sendVip(chatId, user) {
  const eligible = await hasVipEligibility(user.id);

  if (!eligible) {
    await sendMessage(
      chatId,
      `Para liberar o acesso VIP, entre primeiro no <b>canal de prévias</b> e depois toque novamente em <b>Liberar acesso VIP</b>.`,
      {
        reply_markup: joinFirstKeyboard(),
      }
    );
    return;
  }

  await sendMessage(
    chatId,
    `Acesso liberado ✨\n\nToque no botão abaixo para continuar:`,
    {
      protect_content: true,
      reply_markup: vipKeyboard(),
    }
  );

  await notifyAdminVipAccess(user);
}

async function handleMessage(message) {
  const chatId = message.chat?.id;
  const text = (message.text || "").trim();
  const user = message.from || {};

  if (!chatId) return;

  // Mantém o fluxo principal só no privado
  if (message.chat?.type !== "private") {
    return;
  }

  // /start com parâmetro também cai aqui
  if (text.startsWith("/start")) {
    await sendWelcome(chatId, user.first_name);
    await notifyAdminNewLead(user, text === "/start" ? "start" : "start_param");
    return;
  }

  const command = text.split(" ")[0].toLowerCase();

  switch (command) {
    case "/menu":
      await sendWelcome(chatId, user.first_name);
      break;

    case "/vip":
      await sendVip(chatId, user);
      break;

    case "/canal":
      await sendMessage(
        chatId,
        `Aqui está o canal de prévias do <b>${escapeHtml(BRAND_NAME)}</b>:`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔥 Abrir canal de prévias", url: PREVIEW_CHANNEL_URL }],
            ],
          },
        }
      );
      break;

    case "/ajuda":
      await sendMessage(
        chatId,
        `Comandos disponíveis:\n` +
          `/start - iniciar o bot\n` +
          `/menu - abrir o menu principal\n` +
          `/vip - tentar liberar o acesso VIP\n` +
          `/canal - abrir o canal de prévias\n` +
          `/id - ver seu chat id`
      );
      break;

    case "/id":
      await sendMessage(
        chatId,
        `Seu chat_id é: <code>${chatId}</code>\nSeu user_id é: <code>${user.id}</code>`
      );
      break;

    default:
      await sendMessage(
        chatId,
        `Não entendi essa mensagem. Toque em /menu para abrir o painel principal.`,
        {
          reply_markup: mainMenuKeyboard(),
        }
      );
      break;
  }
}

async function handleCallback(callbackQuery) {
  const callbackId = callbackQuery.id;
  const data = callbackQuery.data;
  const user = callbackQuery.from || {};
  const chatId = callbackQuery.message?.chat?.id;

  try {
    if (!chatId) {
      await answerCallbackQuery(callbackId);
      return;
    }

    if (data === "vip_access") {
      await answerCallbackQuery(callbackId, "Verificando acesso...");
      await sendVip(chatId, user);
      return;
    }

    await answerCallbackQuery(callbackId);
  } catch (error) {
    console.error("Erro no callback:", error.message);

    try {
      await answerCallbackQuery(
        callbackId,
        "Ocorreu um erro. Tente novamente.",
        true
      );
    } catch (_) {}
  }
}

async function processUpdate(update) {
  if (update.message) {
    await handleMessage(update.message);
    return;
  }

  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }
}

async function bootstrap() {
  console.log("Iniciando bot...");

  // Garante que não haja webhook ativo, já que estamos usando long polling
  try {
    await api("deleteWebhook", { drop_pending_updates: false });
  } catch (error) {
    console.warn("Aviso ao deletar webhook:", error.message);
  }

  const me = await api("getMe");
  console.log(`Bot autenticado com sucesso: @${me.username}`);

  let offset = 0;

  while (true) {
    try {
      const updates = await api("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message", "callback_query"],
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        await processUpdate(update);
      }
    } catch (error) {
      console.error("Erro no polling:", error.message);
      await sleep(3000);
    }
  }
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

bootstrap().catch((error) => {
  console.error("Erro fatal ao iniciar o bot:", error.message);
  process.exit(1);
});
