"""
ULTRA INSTANT Telegram Bot - Python Async Version
Zero Loading Bar - Maximum Async Performance
"""

import asyncio
import os
from typing import Optional
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputFile
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from telegram.constants import ParseMode

# Load environment variables
load_dotenv()
BOT_TOKEN = os.getenv('BOT_TOKEN')

# Activity tracking
activity_count = 0
last_callback_id = ""

# Products database
PRODUCTS = [
    {"id": 1, "name": "🎫 VCC WISE", "price": 50000, "stock": 10},
    {"id": 2, "name": "🎓 GITHUB STUDENT", "price": 75000, "stock": 5},
    {"id": 3, "name": "📧 GMAIL", "price": 25000, "stock": 20},
    {"id": 4, "name": "🌐 DOMAIN .COM", "price": 150000, "stock": 15},
    {"id": 5, "name": "☁️ VPS SERVER", "price": 200000, "stock": 8},
    {"id": 6, "name": "📱 VIRTUAL NUMBER", "price": 30000, "stock": 50},
    {"id": 7, "name": "🎬 NETFLIX PREMIUM", "price": 45000, "stock": 30},
    {"id": 8, "name": "🎵 SPOTIFY PREMIUM", "price": 40000, "stock": 25},
    {"id": 9, "name": "💳 PAYPAL VERIFIED", "price": 100000, "stock": 12},
    {"id": 10, "name": "🔐 VPN PREMIUM", "price": 35000, "stock": 40},
    {"id": 11, "name": "📊 CANVA PRO", "price": 55000, "stock": 18},
    {"id": 12, "name": "💻 WINDOWS LICENSE", "price": 250000, "stock": 6},
]


def generate_main_menu() -> tuple[str, InlineKeyboardMarkup]:
    """Generate main menu with inline keyboard"""
    message = (
        "🌟 *RAYZELL STORE*\n\n"
        "Selamat datang di toko digital terpercaya!\n"
        "Pilih menu di bawah ini:\n\n"
        "💰 Saldo: Rp 0\n"
        "📦 Total Produk: 12"
    )
    
    keyboard = [
        [InlineKeyboardButton("🛍️ List Produk", callback_data="menu_products"),
         InlineKeyboardButton("💰 Saldo", callback_data="menu_balance")],
        [InlineKeyboardButton("🎁 Promo", callback_data="menu_promo"),
         InlineKeyboardButton("📊 Statistik", callback_data="menu_stats")],
        [InlineKeyboardButton("⚙️ Pengaturan", callback_data="menu_settings"),
         InlineKeyboardButton("ℹ️ Bantuan", callback_data="menu_help")]
    ]
    
    return message, InlineKeyboardMarkup(keyboard)


def generate_product_list(page: int = 1) -> tuple[str, InlineKeyboardMarkup]:
    """Generate product list with pagination"""
    items_per_page = 4
    start_idx = (page - 1) * items_per_page
    end_idx = start_idx + items_per_page
    page_products = PRODUCTS[start_idx:end_idx]
    
    message = f"🛍️ *LIST PRODUK* (Halaman {page})\n\n"
    for p in page_products:
        status = "✅ Ready" if p["stock"] > 0 else "❌ Habis"
        message += f"{p['name']}\n💰 Rp {p['price']:,} | Stock: {p['stock']} {status}\n\n"
    
    # Pagination buttons
    keyboard = []
    page_buttons = []
    total_pages = (len(PRODUCTS) + items_per_page - 1) // items_per_page
    
    for i in range(1, total_pages + 1):
        emoji = "📍" if i == page else "⚪"
        page_buttons.append(InlineKeyboardButton(f"{emoji} {i}", callback_data=f"page_{i}"))
    
    if page_buttons:
        keyboard.append(page_buttons)
    
    # Category & back buttons
    keyboard.extend([
        [InlineKeyboardButton("📱 Digital", callback_data="cat_digital"),
         InlineKeyboardButton("🎬 Streaming", callback_data="cat_streaming")],
        [InlineKeyboardButton("◀️ Kembali ke Menu Utama", callback_data="back_to_main")]
    ])
    
    return message, InlineKeyboardMarkup(keyboard)


def generate_balance_menu() -> tuple[str, InlineKeyboardMarkup]:
    """Generate balance menu"""
    message = (
        "💰 *SALDO ANDA*\n\n"
        "Saldo Saat Ini: Rp 0\n\n"
        "Pilih opsi di bawah ini:"
    )
    
    keyboard = [
        [InlineKeyboardButton("💳 Top Up", callback_data="action_topup"),
         InlineKeyboardButton("📤 Tarik Saldo", callback_data="action_withdraw")],
        [InlineKeyboardButton("📜 Riwayat", callback_data="action_history")],
        [InlineKeyboardButton("◀️ Kembali ke Menu Utama", callback_data="back_to_main")]
    ]
    
    return message, InlineKeyboardMarkup(keyboard)


def generate_promo_menu() -> tuple[str, InlineKeyboardMarkup]:
    """Generate promo menu"""
    message = (
        "🎁 *PROMO SPESIAL*\n\n"
        "📢 Promo Bulan Ini:\n"
        "• Diskon 10% untuk pembelian pertama\n"
        "• Gratis ongkir untuk order di atas 100K\n"
        "• Cashback 5% setiap pembelian\n\n"
        "Gunakan kode: *RAYZELL10*"
    )
    
    keyboard = [
        [InlineKeyboardButton("🎫 Klaim Voucher", callback_data="action_voucher")],
        [InlineKeyboardButton("◀️ Kembali ke Menu Utama", callback_data="back_to_main")]
    ]
    
    return message, InlineKeyboardMarkup(keyboard)


def generate_settings_menu() -> tuple[str, InlineKeyboardMarkup]:
    """Generate settings menu"""
    message = (
        "⚙️ *PENGATURAN*\n\n"
        "Kelola akun dan preferensi Anda:"
    )
    
    keyboard = [
        [InlineKeyboardButton("🔔 Notifikasi", callback_data="setting_notif"),
         InlineKeyboardButton("🌐 Bahasa", callback_data="setting_lang")],
        [InlineKeyboardButton("👤 Profil", callback_data="setting_profile")],
        [InlineKeyboardButton("◀️ Kembali ke Menu Utama", callback_data="back_to_main")]
    ]
    
    return message, InlineKeyboardMarkup(keyboard)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start command - ASYNC with parallel operations"""
    global activity_count
    
    # Track activity (non-blocking)
    activity_count += 1
    
    # Generate menu
    message, keyboard = generate_main_menu()
    
    # Try send photo with welcome image
    try:
        # Fire async without blocking
        await update.message.reply_photo(
            photo=open('welcome.png', 'rb'),
            caption=message,
            reply_markup=keyboard,
            parse_mode=ParseMode.MARKDOWN
        )
    except Exception:
        # Fallback to text only
        await update.message.reply_text(
            message,
            reply_markup=keyboard,
            parse_mode=ParseMode.MARKDOWN
        )


async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handle callback queries - ULTRA INSTANT MODE
    PRE-ANSWER strategy: Answer IMMEDIATELY then process
    """
    global activity_count, last_callback_id
    
    query = update.callback_query
    
    # === INSTANT PRE-ANSWER: Fire IMMEDIATELY! ===
    # This stops the loading spinner INSTANTLY!
    # Use asyncio.create_task for fire-and-forget
    if query.id != last_callback_id:
        asyncio.create_task(query.answer(cache_time=0))
        last_callback_id = query.id
    
    # === PARALLEL PROCESSING: While answer is flying! ===
    data = query.data
    activity_count += 1
    
    # Generate response based on callback data
    message: Optional[str] = None
    keyboard: Optional[InlineKeyboardMarkup] = None
    
    # Main menu
    if data == "back_to_main":
        message, keyboard = generate_main_menu()
    
    # Products menu
    elif data == "menu_products":
        message, keyboard = generate_product_list(1)
    
    # Pagination
    elif data.startswith("page_"):
        page = int(data.split("_")[1])
        message, keyboard = generate_product_list(page)
    
    # Balance menu
    elif data == "menu_balance":
        message, keyboard = generate_balance_menu()
    
    # Promo menu
    elif data == "menu_promo":
        message, keyboard = generate_promo_menu()
    
    # Settings menu
    elif data == "menu_settings":
        message, keyboard = generate_settings_menu()
    
    # Stats menu (inline)
    elif data == "menu_stats":
        message = (
            "📊 *STATISTIK TOKO*\n\n"
            "• Total Produk: 12\n"
            "• Produk Terjual: 0\n"
            "• User Aktif: 1\n"
            "• Rating: ⭐⭐⭐⭐⭐"
        )
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("◀️ Kembali ke Menu Utama", callback_data="back_to_main")]
        ])
    
    # Help menu (inline)
    elif data == "menu_help":
        message = (
            "ℹ️ *BANTUAN*\n\n"
            "📞 Kontak Admin:\n"
            "• Telegram: @admin\n"
            "• WhatsApp: 08xx-xxxx-xxxx\n\n"
            "⏰ Jam Operasional:\n"
            "• Senin - Jumat: 08:00 - 21:00\n"
            "• Sabtu - Minggu: 10:00 - 18:00"
        )
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("📱 Hubungi Admin", url="https://t.me/rayzellstore")],
            [InlineKeyboardButton("◀️ Kembali ke Menu Utama", callback_data="back_to_main")]
        ])
    
    # Action buttons (inline)
    elif data.startswith("action_"):
        action = data.split("_")[1]
        message = f"⚠️ Fitur *{action}* sedang dalam pengembangan.\n\nTunggu update selanjutnya! 🚀"
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("◀️ Kembali", callback_data="menu_balance")],
            [InlineKeyboardButton("🏠 Menu Utama", callback_data="back_to_main")]
        ])
    
    # Setting buttons (inline)
    elif data.startswith("setting_"):
        setting = data.split("_")[1]
        message = f"⚙️ Pengaturan *{setting}* berhasil diubah!\n\n✅ Perubahan telah disimpan."
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("◀️ Kembali ke Pengaturan", callback_data="menu_settings")],
            [InlineKeyboardButton("🏠 Menu Utama", callback_data="back_to_main")]
        ])
    
    # Category filter (inline)
    elif data.startswith("cat_"):
        category = data.split("_")[1]
        message = f"📂 Kategori: *{category}*\n\nFitur filter kategori akan segera hadir! 🔜"
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("◀️ Kembali ke Produk", callback_data="menu_products")],
            [InlineKeyboardButton("🏠 Menu Utama", callback_data="back_to_main")]
        ])
    
    # === INSTANT FIRE EDIT: Non-blocking update ===
    if message and keyboard:
        try:
            # Try edit caption first (for photo messages)
            await query.edit_message_caption(
                caption=message,
                reply_markup=keyboard,
                parse_mode=ParseMode.MARKDOWN
            )
        except Exception:
            try:
                # Fallback to edit text (for text messages)
                await query.edit_message_text(
                    text=message,
                    reply_markup=keyboard,
                    parse_mode=ParseMode.MARKDOWN,
                    disable_web_page_preview=True
                )
            except Exception:
                # Silent fail - message not modified
                pass


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle errors silently"""
    pass


def main() -> None:
    """Main function - Start bot with async configuration"""
    
    print("🤖 Python Bot Started - ULTRA INSTANT ASYNC MODE")
    print("⚡ Strategy: PRE-ANSWER + asyncio.create_task")
    print("🔥 Zero Loading Bar: answer() fires BEFORE processing")
    print("💨 Maximum Async: All operations non-blocking")
    print("🎯 Result: TRUE INSTANT - No spinner, No delay!")
    print("")
    
    # Create application with async configuration
    application = (
        Application.builder()
        .token(BOT_TOKEN)
        .concurrent_updates(True)  # Enable concurrent updates
        .build()
    )
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CallbackQueryHandler(callback_handler))
    
    # Add error handler
    application.add_error_handler(error_handler)
    
    # Start polling with async configuration
    application.run_polling(
        allowed_updates=["message", "callback_query"],
        drop_pending_updates=True,  # Drop old updates
        pool_timeout=1,  # Fast timeout
        connect_timeout=5,
        read_timeout=5,
        write_timeout=5
    )


if __name__ == "__main__":
    main()
