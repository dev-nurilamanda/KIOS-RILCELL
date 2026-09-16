import { RilcellTransaction, ModalAccount, RilcellSettings } from '../types';

export interface GoogleSheetsSyncResult {
  success: boolean;
  message: string;
  data?: {
    transactions?: RilcellTransaction[];
    accounts?: ModalAccount[];
  };
}

/**
 * Example Google Apps Script (GAS) code template for Google Sheets integration.
 * Copy and paste this script into Google Sheets > Extensions > Apps Script,
 * then deploy as Web App (Execute as: Me, Who has access: Anyone).
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * GOOGLE APPS SCRIPT FOR RILCELL KASIR & PEMBUKUAN
 * ----------------------------------------------------
 * Petunjuk Instalasi:
 * 1. Buka Google Sheets baru di Google Drive Anda.
 * 2. Beri nama spreadsheet: "Database RILCELL POS".
 * 3. Buka menu: Ekstensi > Apps Script.
 * 4. Hapus seluruh kode yang ada dan tempel (paste) kode ini.
 * 5. Klik "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web App).
 *    - Deskripsi: "RILCELL POS Sync API"
 *    - Jalankan sebagai (Execute as): "Saya" (Me - akun Anda)
 *    - Yang memiliki akses (Who has access): "Siapa saja" (Anyone)
 * 7. Klik "Terapkan" dan salin URL Web App yang berakhiran "/exec".
 * 8. Tempelkan URL tersebut ke menu Pengaturan di aplikasi RILCELL.
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: TRANSAKSI
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

  // Sheet 2: SALDO_MODAL
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

      // Update Saldo Modal Sheet if accounts provided
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
      // Mass sync
      if (body.accounts) updateSaldoSheet(ss, body.accounts);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data saldo berhasil disinkronkan"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Aksi tidak dikenal: " + action
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

function doGet(e) {
  try {
    setupSheets();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var trxSheet = ss.getSheetByName("TRANSAKSI");
    var saldoSheet = ss.getSheetByName("SALDO_MODAL");

    var trxData = trxSheet.getDataRange().getValues();
    var transactions = [];
    if (trxData.length > 1) {
      for (var i = 1; i < trxData.length; i++) {
        var row = trxData[i];
        transactions.push({
          id: row[0],
          invoiceNumber: row[2],
          category: row[3],
          serviceName: row[4],
          provider: row[5],
          targetNumber: String(row[6]).replace(/^'/, ''),
          sourceAccountId: row[7],
          costPrice: Number(row[8]) || 0,
          sellingPrice: Number(row[9]) || 0,
          adminFee: Number(row[10]) || 0,
          profit: Number(row[11]) || 0,
          snRefNumber: String(row[12]).replace(/^'/, ''),
          status: row[13] || "sukses",
          notes: row[14] || ""
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      transactions: transactions
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Send a new transaction to Google Sheets via Apps Script Web App
 */
export async function sendTransactionToGoogleSheets(
  gasUrl: string,
  transaction: RilcellTransaction,
  accounts?: ModalAccount[]
): Promise<GoogleSheetsSyncResult> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi di Pengaturan',
    };
  }

  try {
    // Note: Google Apps Script Web Apps handle cross-origin POST via standard fetch
    const response = await fetch(gasUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'ADD_TRANSACTION',
        transaction,
        accounts: accounts || [],
      }),
    });

    const resJson = await response.json();
    if (resJson.status === 'success') {
      return {
        success: true,
        message: resJson.message || 'Berhasil disimpan ke Google Sheets',
      };
    } else {
      return {
        success: false,
        message: resJson.message || 'Gagal menyimpan ke Google Sheets',
      };
    }
  } catch (error) {
    console.warn('Google Sheets sync warning:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Koneksi ke Google Sheets gagal',
    };
  }
}

/**
 * Fetch latest transactions and balances from Google Sheets
 */
export async function fetchFromGoogleSheets(gasUrl: string): Promise<GoogleSheetsSyncResult> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script belum diatur',
    };
  }

  try {
    const response = await fetch(gasUrl.trim(), {
      method: 'GET',
    });
    const resJson = await response.json();
    if (resJson.status === 'success') {
      return {
        success: true,
        message: 'Data berhasil disinkronkan dari Google Sheets',
        data: {
          transactions: resJson.transactions,
        },
      };
    }
    return {
      success: false,
      message: resJson.message || 'Gagal mengambil data dari Google Sheets',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Koneksi gagal',
    };
  }
}

/**
 * Sync entire accounts balance state to Google Sheets
 */
export async function syncAccountsToGoogleSheets(
  gasUrl: string,
  accounts: ModalAccount[]
): Promise<GoogleSheetsSyncResult> {
  if (!gasUrl || !gasUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script belum dikonfigurasi',
    };
  }

  try {
    const response = await fetch(gasUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'SYNC_ALL',
        accounts,
      }),
    });
    const resJson = await response.json();
    return {
      success: resJson.status === 'success',
      message: resJson.message || 'Status sinkronisasi selesai',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal mengirim data ke Google Sheets',
    };
  }
}
