require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// Load konfigurasi dari .env
const token = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_ID;

// Validasi token
if (!token) {
    console.error('❌ Error: BOT_TOKEN tidak ditemukan di file .env!');
    process.exit(1);
}

const bot = new TelegramBot(token, { 
    polling: {
        interval: 1,          // 0ms INSTANT: Check every 1ms (minimum possible!)
        autoStart: true,
        params: { 
            timeout: 1,       // Ultra-instant: 1ms timeout
            limit: 100,       
            allowed_updates: ['message', 'callback_query']
        }
    },
    filepath: false,
    baseApiUrl: 'https://api.telegram.org',
    request: {
        agentOptions: {
            keepAlive: true,
            keepAliveMsecs: 1000,
            maxSockets: Infinity,
            maxFreeSockets: 1024,        // Maximum sockets!
            scheduling: 'lifo'
        },
        timeout: 5000,                   // Ultra-fast timeout
        forever: true,
        pool: { maxSockets: Infinity }
    },
    onlyFirstMatch: true
});

// Activity Monitor - Ultra-minimal (inline only)
let activityCount = 0;
let lastActivity = Date.now();

// Database produk
const products = [
    { id: 1, name: 'VCC WISE', stock: 3, price: 25000, category: 'Digital' },
    { id: 2, name: 'GITHUB STUDENT', stock: 1, price: 15000, category: 'Account' },
    { id: 3, name: 'GMAIL', stock: 0, price: 5000, category: 'Account' },
    { id: 4, name: 'DIGITALOCEAN', stock: 3, price: 50000, category: 'VPS' },
    { id: 5, name: 'AWS ACCOUNT', stock: 2, price: 75000, category: 'Cloud' },
    { id: 6, name: 'AZURE CREDITS', stock: 5, price: 100000, category: 'Cloud' },
    { id: 7, name: 'SPOTIFY PREMIUM', stock: 10, price: 20000, category: 'Streaming' },
    { id: 8, name: 'NETFLIX PREMIUM', stock: 8, price: 35000, category: 'Streaming' },
    { id: 9, name: 'DISNEY+ HOTSTAR', stock: 5, price: 30000, category: 'Streaming' },
    { id: 10, name: 'CANVA PRO', stock: 7, price: 15000, category: 'Design' },
    { id: 11, name: 'ADOBE CC', stock: 2, price: 150000, category: 'Design' },
    { id: 12, name: 'VPN PREMIUM', stock: 15, price: 25000, category: 'Tools' }
];

// User data
const users = {};
const ITEMS_PER_PAGE = 4;

// Helper functions
function formatRupiah(amount) {
    return `IDR ${amount.toLocaleString('id-ID')}`;
}

function getUser(chatId) {
    if (!users[chatId]) {
        users[chatId] = { saldo: 0, usdt: 0, cart: [] };
    }
    return users[chatId];
}

function generateMainMenu(chatId) {
    const user = getUser(chatId);
    
    let message = `🏪 *RAYZELL STORE - MENU UTAMA*\n\n`;
    message += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `┣➜ Saldo: ${formatRupiah(user.saldo)}\n`;
    message += `┣➜ USDT: U ${user.usdt}\n`;
    message += `┣➜ ID: ${chatId}\n`;
    message += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Silakan pilih menu di bawah ini:`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: '🛒 Lihat Produk', callback_data: 'menu_products' },
                { text: '💰 Cek Saldo', callback_data: 'menu_balance' }
            ],
            [
                { text: '🎁 Promo', callback_data: 'menu_promo' },
                { text: '📊 Statistik', callback_data: 'menu_stats' }
            ],
            [
                { text: '⚙️ Pengaturan', callback_data: 'menu_settings' },
                { text: 'ℹ️ Bantuan', callback_data: 'menu_help' }
            ]
        ]
    };
    
    return { message, keyboard };
}

function generateBalanceMenu(chatId) {
    const user = getUser(chatId);
    
    let message = `💰 *INFORMASI SALDO*\n\n`;
    message += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `┣➜ Saldo IDR: ${formatRupiah(user.saldo)}\n`;
    message += `┣➜ Saldo USDT: U ${user.usdt}\n`;
    message += `┣➜ Total Transaksi: 0\n`;
    message += `┣➜ ID Anda: ${chatId}\n`;
    message += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Pilih aksi:`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: '➕ Top Up Saldo', callback_data: 'action_topup' },
                { text: '💱 Tukar USDT', callback_data: 'action_exchange' }
            ],
            [
                { text: '📜 Riwayat', callback_data: 'action_history' }
            ],
            [
                { text: '◀️ Kembali ke Menu Utama', callback_data: 'back_to_main' }
            ]
        ]
    };
    
    return { message, keyboard };
}

function generatePromoMenu(chatId) {
    const user = getUser(chatId);
    
    let message = `🎁 *PROMO & DISKON*\n\n`;
    message += `Promo bulan ini:\n\n`;
    message += `🔥 Buy 2 Get 1 Free - SPOTIFY\n`;
    message += `💥 Diskon 20% - VCC WISE\n`;
    message += `⚡ Cashback 10% - Min. 100k\n\n`;
    message += `Saldo Anda: ${formatRupiah(user.saldo)}`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: '🛒 Lihat Produk Promo', callback_data: 'menu_products' }
            ],
            [
                { text: '🎯 Klaim Voucher', callback_data: 'action_voucher' }
            ],
            [
                { text: '◀️ Kembali ke Menu Utama', callback_data: 'back_to_main' }
            ]
        ]
    };
    
    return { message, keyboard };
}

function generateSettingsMenu(chatId) {
    let message = `⚙️ *PENGATURAN*\n\n`;
    message += `Atur preferensi akun Anda:\n\n`;
    message += `• Notifikasi: ✅ Aktif\n`;
    message += `• Bahasa: 🇮🇩 Indonesia\n`;
    message += `• Mode: 🌙 Gelap`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔔 Notifikasi', callback_data: 'setting_notif' },
                { text: '🌐 Bahasa', callback_data: 'setting_lang' }
            ],
            [
                { text: '🎨 Tema', callback_data: 'setting_theme' }
            ],
            [
                { text: '◀️ Kembali ke Menu Utama', callback_data: 'back_to_main' }
            ]
        ]
    };
    
    return { message, keyboard };
}

function generateProductList(chatId, page = 1) {
    const user = getUser(chatId);
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageProducts = products.slice(startIndex, endIndex);
    
    let message = `🛒 *DAFTAR PRODUK* - Page ${page}/${totalPages}\n\n`;
    message += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `┣➜ Saldo: ${formatRupiah(user.saldo)}\n`;
    message += `┣➜ USDT: U ${user.usdt}\n`;
    message += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    pageProducts.forEach((product, index) => {
        const num = startIndex + index + 1;
        const stockEmoji = product.stock > 0 ? '✅' : '❌';
        message += `${stockEmoji} *${num}. ${product.name}*\n`;
        message += `   💰 ${formatRupiah(product.price)} | Stok: ${product.stock}\n\n`;
    });
    
    const keyboard = [];
    const pageButtons = [];
    
    // Tombol pagination
    for (let i = 1; i <= Math.min(totalPages, 4); i++) {
        pageButtons.push({
            text: i === page ? `• ${i} •` : `${i}`,
            callback_data: `page_${i}`
        });
    }
    if (pageButtons.length > 0) keyboard.push(pageButtons);
    
    // Tombol kategori
    keyboard.push([
        { text: '📱 Digital', callback_data: 'cat_digital' },
        { text: '🎬 Streaming', callback_data: 'cat_streaming' }
    ]);
    
    // Tombol kembali
    keyboard.push([
        { text: '◀️ Kembali ke Menu Utama', callback_data: 'back_to_main' }
    ]);
    
    return { message, keyboard: { inline_keyboard: keyboard } };
}

// Command: /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'User';
    
    // Track activity (inline, no function call)
    activityCount++; lastActivity = Date.now();
    
    const { message, keyboard } = generateMainMenu(chatId);
    
    const path = require('path');
    const fs = require('fs');
    const welcomeImagePath = path.join(__dirname, 'welcome.png');
    
    if (fs.existsSync(welcomeImagePath)) {
        bot.sendPhoto(chatId, fs.createReadStream(welcomeImagePath), {
            caption: message,
            reply_markup: keyboard,
            parse_mode: 'Markdown'
        }).catch(err => {
            console.error('Error sending photo:', err.message);
            bot.sendMessage(chatId, message, { 
                reply_markup: keyboard,
                parse_mode: 'Markdown'
            }).catch(() => {});
        });
    } else {
        console.log('Image not found, sending text only');
        bot.sendMessage(chatId, message, { 
            reply_markup: keyboard,
            parse_mode: 'Markdown'
        }).catch(() => {});
    }
});

// PRE-ANSWER CACHE: Define BEFORE listeners!
let lastCallbackId = '';

// CLI-INSTANT INTERCEPTOR: Answer with visual feedback!
// This fires FIRST before any processing!
bot.on('callback_query', (q) => {
    // CLI TRICK: Answer with "⚡" text for instant visual feedback!
    // User sees lightning bolt popup immediately = feels like CLI response!
    if (q.id !== lastCallbackId) {
        bot.answerCallbackQuery(q.id, { 
            text: '⚡',  // Instant visual feedback!
            show_alert: false,
            cache_time: 0 
        });
        lastCallbackId = q.id;
    }
});

// Callback handler - CLI-OPTIMIZED PROCESSING
bot.on('callback_query', (q) => {
    // === SKIP ANSWER: Already handled by CLI interceptor above! ===
    
    // === CLI-STYLE INSTANT EXTRACT ===
    const d = q.data, m = q.message, c = m.chat.id, mid = m.message_id;
    
    // Track (inline)
    activityCount++; lastActivity = Date.now();
    
    // === INSTANT GENERATE & FIRE ===
    let r;
    
    // === ULTRA-COMPACT ROUTING (No function calls, inline everything!) ===
    // Main Menu
    if (d === 'back_to_main') r = generateMainMenu(c);
    // Products
    else if (d === 'menu_products') r = generateProductList(c, 1);
    else if (d.startsWith('page_')) r = generateProductList(c, parseInt(d.split('_')[1]));
    // Balance
    else if (d === 'menu_balance') r = generateBalanceMenu(c);
    // Promo
    else if (d === 'menu_promo') r = generatePromoMenu(c);
    // Settings
    else if (d === 'menu_settings') r = generateSettingsMenu(c);
    // Stats (inline - no function)
    else if (d === 'menu_stats') r = {
        message: '📊 *STATISTIK TOKO*\n\n• Total Produk: 12\n• Produk Terjual: 0\n• User Aktif: 1\n• Rating: ⭐⭐⭐⭐⭐',
        keyboard: { inline_keyboard: [[{ text: '◀️ Kembali ke Menu Utama', callback_data: 'back_to_main' }]] }
    };
    // Help (inline - no function)
    else if (d === 'menu_help') r = {
        message: 'ℹ️ *BANTUAN*\n\n📞 Kontak Admin:\n• Telegram: @admin\n• WhatsApp: 08xx-xxxx-xxxx\n\n⏰ Jam Operasional:\n• Senin - Jumat: 08:00 - 21:00\n• Sabtu - Minggu: 10:00 - 18:00',
        keyboard: { inline_keyboard: [[{ text: '📱 Hubungi Admin', url: 'https://t.me/rayzellstore' }], [{ text: '◀️ Kembali ke Menu Utama', callback_data: 'back_to_main' }]] }
    };
    // Actions (inline template)
    else if (d.startsWith('action_')) r = {
        message: `⚠️ Fitur *${d.split('_')[1]}* sedang dalam pengembangan.\n\nTunggu update selanjutnya! 🚀`,
        keyboard: { inline_keyboard: [[{ text: '◀️ Kembali', callback_data: 'menu_balance' }], [{ text: '🏠 Menu Utama', callback_data: 'back_to_main' }]] }
    };
    // Settings (inline template)
    else if (d.startsWith('setting_')) r = {
        message: `⚙️ Pengaturan *${d.split('_')[1]}* berhasil diubah!\n\n✅ Perubahan telah disimpan.`,
        keyboard: { inline_keyboard: [[{ text: '◀️ Kembali ke Pengaturan', callback_data: 'menu_settings' }], [{ text: '🏠 Menu Utama', callback_data: 'back_to_main' }]] }
    };
    // Categories (inline template)
    else if (d.startsWith('cat_')) r = {
        message: `📂 Kategori: *${d.split('_')[1]}*\n\nFitur filter kategori akan segera hadir! 🔜`,
        keyboard: { inline_keyboard: [[{ text: '◀️ Kembali ke Produk', callback_data: 'menu_products' }], [{ text: '🏠 Menu Utama', callback_data: 'back_to_main' }]] }
    };
    
    // === INSTANT FIRE EDIT (One-liner!) ===
    if (r) bot.editMessageCaption(r.message, { chat_id: c, message_id: mid, reply_markup: r.keyboard, parse_mode: 'Markdown', disable_web_page_preview: true }).catch(() => bot.editMessageText(r.message, { chat_id: c, message_id: mid, reply_markup: r.keyboard, parse_mode: 'Markdown', disable_web_page_preview: true }));
});

// Global error suppression - untuk fire-and-forget answerCallbackQuery
process.on('unhandledRejection', (reason, promise) => {
    // Silent - don't crash on old callback queries
});

// Error handling - Better logging untuk polling
let errorCount = 0;
bot.on('polling_error', (error) => {
    errorCount++;
    if (error.code === 'EFATAL') {
        console.log('⚠️ Fatal polling error, restarting...');
    } else if (error.code === 'ETIMEDOUT') {
        console.log('⏱️ Polling timeout (normal untuk long polling)');
    } else if (!error.message.includes('409 Conflict')) {
        console.log(`⚠️ Polling error (${errorCount}): ${error.code || error.message}`);
    }
});

bot.on('error', (error) => {
    console.log(`❌ Bot error: ${error.message}`);
});

// Performance monitoring - DISABLED untuk performa maksimal
let requestCount = 0;
let lastLogTime = Date.now();

bot.on('callback_query', () => {
    requestCount++;
});

// Silent monitoring - no console spam
// Activity counter tetap jalan di background tanpa log

console.log('🤖 Bot Started - CLI-INSTANT MODE');
console.log('⚡ Polling: 1ms | Timeout: 1ms');
console.log('🔥 CLI TRICK: "⚡" notification on every click!');
console.log('💨 Visual Feedback: Instant popup like terminal response');
console.log('🎯 Result: Feels like CLI command execution!');
console.log('📊 User sees feedback BEFORE content changes');
console.log('');
