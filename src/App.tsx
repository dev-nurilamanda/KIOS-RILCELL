import React, { useState, useEffect } from 'react';
import { Product, CartItem, Transaction, StoreSettings, PaymentMethod } from './types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { PosView } from './components/PosView';
import { InventoryView } from './components/InventoryView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { generateInvoiceNumber } from './utils/formatters';

const STORAGE_KEYS = {
  PRODUCTS: 'kasir_pos_products_v1',
  TRANSACTIONS: 'kasir_pos_transactions_v1',
  SETTINGS: 'kasir_pos_settings_v1',
  DRAFTS: 'kasir_pos_drafts_v1',
};

// Generate a few realistic historical transactions for initial demo experience
const createSampleTransactions = (): Transaction[] => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  return [
    {
      id: 'trx-sample-1',
      invoiceNumber: 'TRX-20260916-0001',
      timestamp: now - 3 * oneHour,
      items: [
        { product: INITIAL_PRODUCTS[0], quantity: 2 }, // Kopi Susu
        { product: INITIAL_PRODUCTS[8], quantity: 1, notes: 'Keju banyak' }, // Roti Bakar
      ],
      subtotal: 54000,
      discountAmount: 4000,
      discountPercent: 0,
      taxAmount: 5500,
      taxRate: 0.11,
      total: 55500,
      paymentMethod: 'qris',
      cashPaid: 55500,
      changeAmount: 0,
      customerName: 'Dian Permata',
      tableOrNote: 'Meja 02',
      cashierName: 'Kasir 01 (Budi)',
    },
    {
      id: 'trx-sample-2',
      invoiceNumber: 'TRX-20260916-0002',
      timestamp: now - 1.5 * oneHour,
      items: [
        { product: INITIAL_PRODUCTS[5], quantity: 1 }, // Nasi Goreng
        { product: INITIAL_PRODUCTS[3], quantity: 1 }, // Teh Tarik
      ],
      subtotal: 37000,
      discountAmount: 0,
      discountPercent: 0,
      taxAmount: 4070,
      taxRate: 0.11,
      total: 41070,
      paymentMethod: 'tunai',
      cashPaid: 50000,
      changeAmount: 8930,
      customerName: 'Ahmad Faisal',
      tableOrNote: 'Take Away',
      cashierName: 'Kasir 01 (Budi)',
    },
    {
      id: 'trx-sample-3',
      invoiceNumber: 'TRX-20260916-0003',
      timestamp: now - 45 * 60 * 1000,
      items: [
        { product: INITIAL_PRODUCTS[11], quantity: 2 }, // Paket Kenyang
      ],
      subtotal: 58000,
      discountAmount: 5000,
      discountPercent: 0,
      taxAmount: 5830,
      taxRate: 0.11,
      total: 58830,
      paymentMethod: 'debit',
      cashPaid: 58830,
      changeAmount: 0,
      customerName: 'Siti Rahma',
      tableOrNote: 'Meja 07',
      cashierName: 'Kasir 01 (Budi)',
    },
  ];
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'reports' | 'settings'>('pos');

  // Persistence State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : createSampleTransactions();
    } catch {
      return createSampleTransactions();
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [savedDrafts, setSavedDrafts] = useState<
    { id: string; name: string; items: CartItem[]; time: string }[]
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [tableOrNote, setTableOrNote] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percent' | 'nominal'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [enableTax, setEnableTax] = useState<boolean>(settings.enableTax);

  // Modals State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);

  // Persist when state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(savedDrafts));
  }, [savedDrafts]);

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleUpdateNotes = (productId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setCustomerName('');
    setTableOrNote('');
  };

  // Drafts
  const handleSaveDraft = () => {
    if (cart.length === 0) return;
    const newDraft = {
      id: `draft-${Date.now()}`,
      name: customerName || tableOrNote || `Pesanan #${savedDrafts.length + 1}`,
      items: [...cart],
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    setSavedDrafts((prev) => [newDraft, ...prev]);
    handleClearCart();
  };

  const handleLoadDraft = (draftId: string) => {
    const draft = savedDrafts.find((d) => d.id === draftId);
    if (!draft) return;
    setCart(draft.items);
    setSavedDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  // Cart Totals calculation
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100);
  } else {
    discountAmount = Math.min(subtotal, Math.max(0, discountValue));
  }

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRateDecimal = enableTax ? settings.taxRatePercent / 100 : 0;
  const taxAmount = enableTax ? Math.round(taxableSubtotal * taxRateDecimal) : 0;
  const total = taxableSubtotal + taxAmount;

  // Complete Payment
  const handleCompletePayment = ({
    paymentMethod,
    cashPaid,
    changeAmount,
  }: {
    paymentMethod: PaymentMethod;
    cashPaid: number;
    changeAmount: number;
  }) => {
    // 1. Generate Invoice number
    const sequence = transactions.length + 1;
    const invoiceNumber = generateInvoiceNumber(sequence);

    // 2. Build Transaction object
    const newTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      invoiceNumber,
      timestamp: Date.now(),
      items: [...cart],
      subtotal,
      discountAmount,
      discountPercent: discountType === 'percent' ? discountValue : 0,
      taxAmount,
      taxRate: taxRateDecimal,
      total,
      paymentMethod,
      cashPaid,
      changeAmount,
      customerName: customerName.trim() || undefined,
      tableOrNote: tableOrNote.trim() || undefined,
      cashierName: settings.cashierName,
    };

    // 3. Deduct stock from products
    setProducts((prev) => {
      return prev.map((prod) => {
        const itemInCart = cart.find((c) => c.product.id === prod.id);
        if (itemInCart) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - itemInCart.quantity),
          };
        }
        return prod;
      });
    });

    // 4. Save transaction
    setTransactions((prev) => [newTransaction, ...prev]);

    // 5. Close payment modal & show receipt
    setIsPaymentModalOpen(false);
    setActiveReceiptTransaction(newTransaction);
    setIsReceiptModalOpen(true);

    // 6. Reset current cart
    handleClearCart();
  };

  // Inventory Handlers
  const handleSaveProduct = (updatedOrNewProduct: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === updatedOrNewProduct.id);
      if (exists) {
        return prev.map((p) => (p.id === updatedOrNewProduct.id ? updatedOrNewProduct : p));
      } else {
        return [updatedOrNewProduct, ...prev];
      }
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleQuickAdjustStock = (productId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, stock: Math.max(0, p.stock + delta) };
        }
        return p;
      })
    );
  };

  const handleResetDefaultProducts = () => {
    if (confirm('Kembalikan katalog ke produk default bawaan? Stok saat ini akan diperbarui.')) {
      setProducts(INITIAL_PRODUCTS);
    }
  };

  // Settings Handlers
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    setEnableTax(newSettings.enableTax);
  };

  const handleExportAllData = () => {
    const data = {
      store: settings,
      products,
      transactions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_kasir_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportAllData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.transactions)) {
        setProducts(parsed.products);
        setTransactions(parsed.transactions);
        if (parsed.store) {
          setSettings(parsed.store);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleResetToDemo = () => {
    setProducts(INITIAL_PRODUCTS);
    setTransactions(createSampleTransactions());
    setSettings(INITIAL_SETTINGS);
    setSavedDrafts([]);
    handleClearCart();
    alert('Data demo berhasil dimuat ulang!');
  };

  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        cartCount={totalCartCount}
        lowStockCount={lowStockCount}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16 lg:pb-6">
        {activeTab === 'pos' && (
          <PosView
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onUpdateNotes={handleUpdateNotes}
            onClearCart={handleClearCart}
            customerName={customerName}
            setCustomerName={setCustomerName}
            tableOrNote={tableOrNote}
            setTableOrNote={setTableOrNote}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            enableTax={enableTax}
            setEnableTax={setEnableTax}
            settings={settings}
            onCheckout={() => setIsPaymentModalOpen(true)}
            savedDrafts={savedDrafts}
            onSaveDraft={handleSaveDraft}
            onLoadDraft={handleLoadDraft}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onQuickAdjustStock={handleQuickAdjustStock}
            onResetDefaultProducts={handleResetDefaultProducts}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            transactions={transactions}
            onSelectTransactionForReceipt={(trx) => {
              setActiveReceiptTransaction(trx);
              setIsReceiptModalOpen(true);
            }}
            onClearTransactions={() => setTransactions([])}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onExportAllData={handleExportAllData}
            onImportAllData={handleImportAllData}
            onResetToDemo={handleResetToDemo}
          />
        )}
      </main>

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        subtotal={subtotal}
        discountAmount={discountAmount}
        taxAmount={taxAmount}
        customerName={customerName}
        setCustomerName={setCustomerName}
        tableOrNote={tableOrNote}
        setTableOrNote={setTableOrNote}
        onCompletePayment={handleCompletePayment}
        settings={settings}
      />

      {/* Thermal Receipt Print / Share Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={activeReceiptTransaction}
        settings={settings}
        onNewTransaction={() => {
          setIsReceiptModalOpen(false);
          setActiveTab('pos');
        }}
      />
    </div>
  );
}
