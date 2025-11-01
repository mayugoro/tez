# 🤖 Bot Telegram Toko Online

Bot Telegram dengan tombol interaktif yang responsif untuk jualan produk.

## ⚡ Fitur

- ✅ Tombol inline yang responsif seperti aplikasi
- ✅ Navigasi smooth tanpa spam chat
- ✅ Katalog produk multi-kategori
- ✅ Keranjang belanja
- ✅ Checkout ke WhatsApp
- ✅ Animasi loading saat klik tombol

## 🚀 Cara Install

1. **Buat Bot di Telegram**
   - Buka [@BotFather](https://t.me/BotFather) di Telegram
   - Kirim `/newbot`
   - Ikuti instruksi, copy TOKEN yang diberikan

2. **Install Dependencies**
   ```powershell
   npm install
   ```

3. **Setup Token**
   - Buka file `main.js`
   - Ganti `YOUR_BOT_TOKEN_HERE` dengan token dari BotFather
   - Ganti nomor WhatsApp dengan nomor Anda

4. **Jalankan Bot**
   ```powershell
   npm start
   ```

## 📝 Cara Customize

### Tambah/Edit Produk
Edit bagian `products` di file `main.js`:

```javascript
const products = {
    electronics: [
        { 
            id: 'e1', 
            name: 'Nama Produk', 
            price: 'Rp 100.000', 
            desc: 'Deskripsi produk', 
            stock: 10, 
            image: '📱' 
        }
    ]
};
```

### Ganti Nomor WhatsApp
Cari dan ganti `6281234567890` dengan nomor WhatsApp Anda (format: 62xxx)

## 🎮 Cara Pakai

1. Cari bot Anda di Telegram
2. Kirim `/start`
3. Klik tombol untuk navigasi
4. Semua tombol langsung merespons tanpa lag!

## 💡 Tips

- Tombol akan beranimasi saat diklik (loading indicator)
- Pesan akan di-edit, tidak spam chat baru
- Keranjang tersimpan per user
- Bisa tambah kategori dan produk sesuai kebutuhan

## 📞 Support

Jika ada masalah atau pertanyaan, silakan hubungi developer.
