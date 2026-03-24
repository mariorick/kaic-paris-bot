const { Telegraf, Markup } = require('telegraf')
const { createClient } = require('@supabase/supabase-js')

const bot = new Telegraf(process.env.BOT_TOKEN)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const LINKS = {
  preview: 'https://t.me/+n9padkABd9Q1MDgx',
  vip: 'https://t.me/+MIzDfcW5GBBiOGJh',
  privacy: 'https://privacy.com.br/profile/kaicparis',
  onlyfans: 'https://onlyfans.com/kaicparis'
}

async function saveLead(ctx, extra = {}) {
  try {
    const user = ctx.from || {}
    const text = ctx.message && ctx.message.text ? ctx.message.text : ''
    const source = text.startsWith('/start ') ? text.replace('/start ', '').trim() : null

    await supabase.from('telegram_leads').upsert({
      telegram_id: String(user.id),
      username: user.username || null,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      language_code: user.language_code || null,
      source: source,
      last_interaction_at: new Date().toISOString(),
      ...extra
    }, {
      onConflict: 'telegram_id'
    })
  } catch (error) {
    console.error('Erro ao salvar lead:', error.message)
  }
}

function mainMenu() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✨ Prévias', 'go_preview'),
      Markup.button.callback('👑 VIP', 'go_vip')
    ],
    [
      Markup.button.url('📲 Privacy', LINKS.privacy),
      Markup.button.url('🌐 OnlyFans', LINKS.onlyfans)
    ]
  ])
}

bot.start(async (ctx) => {
  await saveLead(ctx)

  await ctx.reply(
    '✨ Bem-vindo ao universo de Kaic Paris.\n\nEscolha abaixo para onde você quer ir:',
    mainMenu()
  )
})

bot.action('go_preview', async (ctx) => {
  await ctx.answerCbQuery()
  await saveLead(ctx, { clicked_preview: true })

  await ctx.reply(
    `Entre nas prévias por aqui:\n${LINKS.preview}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'back_home')]
    ])
  )
})

bot.action('go_vip', async (ctx) => {
  await ctx.answerCbQuery()
  await saveLead(ctx, { clicked_vip: true })

  await ctx.reply(
    `Acesse a área VIP por aqui:\n${LINKS.vip}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Voltar', 'back_home')]
    ])
  )
})

bot.action('back_home', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.reply('Escolha uma opção:', mainMenu())
})

bot.launch()
console.log('Bot rodando.')