export type AccountKey =
  | 'wekios'
  | 'digipos'
  | 'dana'
  | 'gopay'
  | 'shopeepay'
  | 'ovo'
  | 'gopay_merchant'
  | 'bsi_byond'
  | 'kas_tunai';

export interface ModalAccount {
  id: AccountKey;
  name: string;
  category: 'server_pulsa' | 'ewallet' | 'merchant' | 'bank' | 'kas';
  balance: number;
  initialBalance: number;
  color: string;
  minAlertThreshold: number; // default Rp 100.000
  accountNumber?: string;
  holderName?: string;
  updatedAt: number;
}

export type ServiceCategory =
  | 'pulsa_data'
  | 'pln_tagihan'
  | 'topup_ewallet'
  | 'transfer_tarik'
  | 'game_tv';

export type TransactionType = 'standard_margin' | 'admin_fee';

export type TransactionStatus = 'sukses' | 'gagal' | 'pending';

export interface RilcellTransaction {
  id: string;
  invoiceNumber: string;
  timestamp: number;
  category: ServiceCategory;
  serviceName: string; // e.g., 'Telkomsel Data 10GB 30 Hari'
  provider?: string; // e.g., 'Telkomsel', 'PLN', 'DANA', 'BCA'
  targetNumber: string; // No HP / ID Pelanggan / Rekening Tujuan
  sourceAccountId: AccountKey; // Modal yang terpotong
  costPrice: number; // Harga Modal (Saldo terpotong)
  sellingPrice: number; // Harga Jual / Uang Diterima dari Pelanggan
  adminFee: number; // Biaya Admin / Fee (untuk transfer / top-up)
  profit: number; // Keuntungan / Laba Bersih
  profitType: TransactionType; // 'standard_margin' vs 'admin_fee'
  snRefNumber: string; // Serial Number / Ref ID
  notes?: string;
  status: TransactionStatus;
  customerName?: string;
  syncedToSheets?: boolean;
}

export interface BalanceTransfer {
  id: string;
  timestamp: number;
  fromAccountId: AccountKey | 'topup_eksternal';
  toAccountId: AccountKey;
  amount: number;
  fee: number;
  notes?: string;
  invoiceNumber: string;
}

export interface RilcellSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  cashierName: string;
  lowBalanceThreshold: number; // Batas peringatan saldo menipis (default: 100000)
  receiptFooter: string;
  googleAppsScriptUrl: string; // URL Web App Google Apps Script
  autoSyncGoogleSheets: boolean;
  cashOnHand: number; // Saldo kas tunai laci konter
}

export interface QuickPresetProduct {
  id: string;
  category: ServiceCategory;
  provider: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  defaultAdminFee?: number;
  profitType: TransactionType;
  defaultSource: AccountKey;
}
