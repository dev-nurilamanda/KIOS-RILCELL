export type ProductCategory = 'Semua' | 'Makanan' | 'Minuman' | 'Cemilan' | 'Paket Hemat' | 'Lainnya';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'Makanan' | 'Minuman' | 'Cemilan' | 'Paket Hemat' | 'Lainnya';
  price: number;
  costPrice?: number;
  stock: number;
  unit: string;
  color?: string;
  imageUrl?: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  customDiscount?: number; // potongan per item jika ada
}

export type PaymentMethod = 'tunai' | 'qris' | 'debit' | 'transfer';

export interface Transaction {
  id: string;
  invoiceNumber: string;
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxRate: number; // e.g. 0.11 for 11%
  total: number;
  paymentMethod: PaymentMethod;
  cashPaid: number;
  changeAmount: number;
  customerName?: string;
  tableOrNote?: string;
  cashierName: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  cashierName: string;
  taxRatePercent: number; // e.g. 11 for 11%
  enableTax: boolean;
  receiptFooter: string;
}
