export type AccountKey =
  | 'wekios'
  | 'digipos'
  | 'dana'
  | 'gopay'
  | 'shopeepay'
  | 'ovo'
  | 'gopay_merchant'
  | 'bsi_byond'
  | 'kas_tunai'
  | 'stok_fisik';

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
  | 'game_tv'
  | 'voucher_fisik'
  | 'kartu_perdana'
  | 'aksesori_lainnya';

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
  productType?: 'digital' | 'fisik';
  presetId?: string;
  paymentMethod?: 'tunai' | 'qris' | 'transfer';
  destinationAccountId?: AccountKey;
  quantity?: number;
}

export interface BalanceTransfer {
  id: string;
  timestamp: number;
  fromAccountId: AccountKey | 'topup_eksternal' | 'pemasok_luar';
  toAccountId: AccountKey;
  amount: number;
  fee: number;
  notes?: string;
  invoiceNumber: string;
  supplierName?: string;
}

export type AppTheme = 'light' | 'dark' | 'system';

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
  theme?: AppTheme; // 'light' | 'dark' | 'system'
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
  productType?: 'digital' | 'fisik';
  stockQuantity?: number; // Jumlah stok fisik (Pcs)
}

// ==========================================
// DATABASE PELANGGAN KONTER (Customer Database)
// ==========================================

export interface CustomerGameProfile {
  id: string;
  gameKey: 'mlbb' | 'ff' | 'pubgm' | 'genshin' | 'hok' | 'valorant' | 'roblox' | 'codm' | 'point_blank' | 'other';
  gameName: string; // e.g. Mobile Legends, Free Fire, dll.
  userId: string; // ID Akun / Player ID / User ID / UID
  zoneId?: string; // Server / Zone ID (untuk MLBB misal 2041, Genshin misal Asia)
  nickname?: string; // In-Game Name / IGN (opsional)
}

export interface CustomerEWalletProfile {
  id: string;
  walletType: 'DANA' | 'GoPay' | 'OVO' | 'ShopeePay' | 'LinkAja' | 'Lainnya';
  phoneNumber: string; // Nomor HP terdaftar di e-wallet
  accountHolder?: string; // Atas nama akun
}

export interface CustomerBankAccount {
  id: string;
  bankName: string; // BCA, BRI, Mandiri, BNI, BSI, Jago, SeaBank, dll.
  accountNumber: string; // Nomor rekening
  accountHolder?: string; // Atas nama pemilik rekening
}

export interface CustomerMeterProfile {
  id: string;
  meterNumber: string; // No Meteran / ID Pelanggan PLN (11-12 digit)
  ownerName?: string; // Nama pemilik meteran / pelanggan PLN
  tariffPower?: string; // e.g. R1M/900 VA, R1/1300 VA
  locationNote?: string; // e.g. Rumah Utama, Kos, Toko
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string; // Nomor WhatsApp / HP utama
  address?: string;
  notes?: string;
  
  // Detail Layanan Pelanggan
  ewallets: CustomerEWalletProfile[];
  bankAccounts: CustomerBankAccount[];
  meterNumbers: CustomerMeterProfile[];
  gameProfiles: CustomerGameProfile[];
  
  createdAt: number;
  updatedAt: number;
}
