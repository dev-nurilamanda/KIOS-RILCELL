# RILCELL Kasir & Pembukuan

Aplikasi kasir, pembukuan keuangan, dan manajemen saldo modal khusus konter pulsa dan loket pembayaran digital **RILCELL**.

---

## 🚀 Fitur Utama

1. **Manajemen 8 Saldo Modal**:
   - **WeKios** (Server Pulsa)
   - **DigiPOS Aja!** (Telkomsel Outlet)
   - **DANA** (E-Wallet)
   - **GoPay** (E-Wallet)
   - **ShopeePay** (E-Wallet)
   - **OVO** (E-Wallet)
   - **GoPay Merchant** (QRIS & Merchant)
   - **BYOND by BSI** (Rekening Bank Operasional)
   - Dilengkapi fitur **Pindah Saldo / Top-Up Modal** antar akun dan **Peringatan Saldo Menipis (Alert)** jika di bawah batas Rp 100.000.

2. **Quick Entry Transaksi Kasir**:
   - Pulsa & Paket Data / Nelpon
   - Token PLN & Tagihan
   - Top-Up E-Wallet (DANA, GoPay, ShopeePay, OVO)
   - Transfer Bank & Tarik Tunai
   - Kuota TV & Top-Up Game (MLBB, Free Fire)
   - Deteksi otomatis provider berdasarkan nomor HP / ID Pelanggan
   - Perhitungan laba otomatis:
     - **Margin Langsung** (Pulsa/Data/PLN/Game): Untung = Harga Jual - Modal.
     - **Fee / Biaya Admin** (Transfer Bank/Top-Up E-Wallet/Tarik Tunai): Untung = Biaya Admin.

3. **Riwayat Transaksi & Struk**:
   - Riwayat lengkap transaksi dengan filter tanggal, kategori, dan sumber saldo modal.
   - Fitur **Ubah Status Sukses / Gagal** dengan sistem otomatis pengembalian saldo modal jika transaksi digagalkan.
   - Pembuat teks **Struk WhatsApp** siap kirim ke pelanggan.
   - Cetak struk printer thermal 58mm / 80mm.

4. **Dashboard Analisis & Grafik Tren**:
   - Widget Total Omzet, Modal Keluar, Laba Bersih, dan Kas Tunai.
   - Grafik tren penjualan dan laba visual dengan filter **Harian**, **Mingguan**, **Bulanan**, dan **Tahunan**.
   - Statistik produk dan layanan terlaris & paling menguntungkan.

5. **PWA Mobile-First**:
   - Siap diinstal langsung di layar utama HP Android (Chrome) dan iPhone (Safari) tanpa Play Store.
   - Aturan `user-select: none` aktif pada elemen UI agar tombol dan kartu tidak terblok saat disentuh.

---

## 📊 Panduan Integrasi Database Google Sheets (Google Apps Script)

Aplikasi RILCELL dilengkapi integrasi langsung ke spreadsheet Google Sheets pribadi Anda melalui **Google Apps Script (GAS) Web App**.

### Langkah-langkah Setup di Google Sheets:

1. Buat Spreadsheet baru di [Google Drive](https://drive.google.com) dengan nama **"Database RILCELL POS"**.
2. Buka menu **Ekstensi (Extensions) > Apps Script**.
3. Hapus seluruh kode yang ada pada editor, lalu tempelkan (paste) kode berikut:

```javascript
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var trxSheet = ss.getSheetByName("TRANSAKSI");
  if (!trxSheet) {
    trxSheet = ss.insertSheet("TRANSAKSI");
    trxSheet.appendRow([
      "ID", "Waktu", "No Invoice", "Kategori", "Nama Layanan", "Provider",
      "No Tujuan", "Sumber Saldo", "Harga Modal", "Harga Jual",
      "Admin Fee", "Keuntungan", "SN / Ref ID", "Status", "Catatan"
    ]);
    trxSheet.getRange("A1:O1").setFontWeight("bold").setBackground("#d1fae5");
  }

  var saldoSheet = ss.getSheetByName("SALDO_MODAL");
  if (!saldoSheet) {
    saldoSheet = ss.insertSheet("SALDO_MODAL");
    saldoSheet.appendRow(["Akun ID", "Nama Akun", "Saldo Saat Ini", "Terakhir Update"]);
    saldoSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#e0f2fe");
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    setupSheets();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === "ADD_TRANSACTION") {
      var t = body.transaction;
      var trxSheet = ss.getSheetByName("TRANSAKSI");
      trxSheet.appendRow([
        t.id,
        new Date(t.timestamp).toLocaleString("id-ID"),
        t.invoiceNumber,
        t.category,
        t.serviceName,
        t.provider || "-",
        "'" + t.targetNumber,
        t.sourceAccountId,
        t.costPrice,
        t.sellingPrice,
        t.adminFee,
        t.profit,
        "'" + (t.snRefNumber || "-"),
        t.status,
        t.notes || ""
      ]);

      if (body.accounts && Array.isArray(body.accounts)) {
        updateSaldoSheet(ss, body.accounts);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Transaksi berhasil disimpan ke Google Sheets",
        invoiceNumber: t.invoiceNumber
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "SYNC_ALL") {
      if (body.accounts) updateSaldoSheet(ss, body.accounts);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data saldo berhasil disinkronkan"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Aksi tidak dikenal"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function updateSaldoSheet(ss, accounts) {
  var sheet = ss.getSheetByName("SALDO_MODAL");
  sheet.clearContents();
  sheet.appendRow(["Akun ID", "Nama Akun", "Saldo Saat Ini", "Terakhir Update"]);
  sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#e0f2fe");
  
  accounts.forEach(function(acc) {
    sheet.appendRow([
      acc.id,
      acc.name,
      acc.balance,
      new Date().toLocaleString("id-ID")
    ]);
  });
}
```

4. Klik tombol **Terapkan (Deploy) > Penerapan Baru (New Deployment)**.
5. Klik ikon gerigi (Settings) di samping kiri lalu pilih **Aplikasi Web (Web App)**.
   - **Deskripsi**: `RILCELL POS Sync`
   - **Jalankan sebagai (Execute as)**: `Saya (Me - email akun Anda)`
   - **Yang memiliki akses (Who has access)**: `Siapa saja (Anyone)` *(Penting agar aplikasi web dapat mengirim transaksi)*
6. Klik **Terapkan (Deploy)** dan izinkan akses (Authorize Access).
7. Salin tautan **URL Aplikasi Web** yang berakhiran `/exec`.
8. Buka tab **Pengaturan** di aplikasi RILCELL, tempelkan URL tersebut ke kolom **Google Apps Script Web App URL**, lalu klik **Tes & Sinkronkan**.
9. Selesai! Transaksi dan saldo kasir Anda kini tersimpan otomatis di Google Sheets.
