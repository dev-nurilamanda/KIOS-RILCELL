import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Zap, 
  Smartphone, 
  Wallet, 
  Landmark, 
  Gamepad2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Receipt, 
  Search, 
  Plus, 
  Minus, 
  Package, 
  Check, 
  Ticket, 
  CreditCard, 
  Headphones, 
  Banknote, 
  QrCode 
} from 'lucide-react';
import { 
  ServiceCategory, 
  AccountKey, 
  ModalAccount, 
  RilcellTransaction, 
  TransactionType,
  QuickPresetProduct 
} from '../types';
import { formatRupiah, detectProvider } from '../utils/formatters';
import { AccountSelect } from './CustomSelect';
import { ProductSearchDropdown } from './ProductSearchDropdown';
import { PaymentDestinationSelect } from './PaymentDestinationSelect';

interface QuickEntryFormProps {
  accounts: ModalAccount[];
  presets: QuickPresetProduct[];
  cashOnHand?: number;
  onSubmitTransaction: (trxData: Omit<RilcellTransaction, 'id' | 'invoiceNumber' | 'timestamp' | 'status' | 'syncedToSheets'>) => boolean;
  onSelectTransactionReceipt?: (trx: RilcellTransaction) => void;
  onOpenMasterProducts?: () => void;
  selectedPresetToFill?: QuickPresetProduct | null;
  onClearSelectedPreset?: () => void;
}

const CATEGORY_ITEMS: { id: ServiceCategory; label: string; icon: React.ReactNode; defaultProfitType: TransactionType }[] = [
  { id: 'pulsa_data', label: 'Pulsa & Data', icon: <Smartphone className="w-4 h-4" />, defaultProfitType: 'standard_margin' },
  { id: 'voucher_fisik', label: 'Voucher Fisik', icon: <Ticket className="w-4 h-4" />, defaultProfitType: 'standard_margin' },
  { id: 'kartu_perdana', label: 'Kartu Perdana', icon: <CreditCard className="w-4 h-4" />, defaultProfitType: 'standard_margin' },
  { id: 'pln_tagihan', label: 'Token PLN & Tagihan', icon: <Zap className="w-4 h-4" />, defaultProfitType: 'standard_margin' },
  { id: 'topup_ewallet', label: 'Top-Up E-Wallet', icon: <Wallet className="w-4 h-4" />, defaultProfitType: 'admin_fee' },
  { id: 'transfer_tarik', label: 'Transfer & Tarik', icon: <Landmark className="w-4 h-4" />, defaultProfitType: 'admin_fee' },
  { id: 'game_tv', label: 'Game & Kuota TV', icon: <Gamepad2 className="w-4 h-4" />, defaultProfitType: 'standard_margin' },
  { id: 'aksesori_lainnya', label: 'Aksesori', icon: <Headphones className="w-4 h-4" />, defaultProfitType: 'standard_margin' },
];

export const QuickEntryForm: React.FC<QuickEntryFormProps> = ({
  accounts,
  presets,
  cashOnHand = 0,
  onSubmitTransaction,
  onSelectTransactionReceipt,
  onOpenMasterProducts,
  selectedPresetToFill,
  onClearSelectedPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('pulsa_data');
  const [serviceName, setServiceName] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState<AccountKey>('digipos');
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [adminFee, setAdminFee] = useState<string>('0');
  const [profitType, setProfitType] = useState<TransactionType>('standard_margin');
  const [snRefNumber, setSnRefNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [activeAutoFillPreset, setActiveAutoFillPreset] = useState<string | null>(null);
  const [matchedPresetId, setMatchedPresetId] = useState<string | null>(null);

  // Custom Form Fields State (Quantity, Payment Method & Destination Account)
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [unitSell, setUnitSell] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'transfer'>('tunai');
  const [destinationAccountId, setDestinationAccountId] = useState<AccountKey>('gopay_merchant');

  const targetInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect provider from target number
  const detectedProvider = useMemo(() => {
    return detectProvider(targetNumber);
  }, [targetNumber]);

  // When category changes, set sensible defaults
  const handleCategoryChange = (cat: ServiceCategory) => {
    setSelectedCategory(cat);
    const catConfig = CATEGORY_ITEMS.find((c) => c.id === cat);
    const newProfitType = catConfig?.defaultProfitType || 'standard_margin';
    setProfitType(newProfitType);

    // Reset quantity and unit prices for clean slate
    setQuantity(1);
    setUnitCost(0);
    setUnitSell(0);

    // Set default source account based on category
    if (cat === 'pulsa_data') {
      setSourceAccountId('digipos');
    } else if (cat === 'voucher_fisik' || cat === 'kartu_perdana' || cat === 'aksesori_lainnya') {
      setSourceAccountId('stok_fisik');
    } else if (cat === 'pln_tagihan') {
      setSourceAccountId('wekios');
    } else if (cat === 'topup_ewallet') {
      setSourceAccountId('dana');
      setAdminFee('3000');
    } else if (cat === 'transfer_tarik') {
      setSourceAccountId('bsi_byond');
      setAdminFee('5000');
    } else if (cat === 'game_tv') {
      setSourceAccountId('wekios');
    }
  };

  // Quantity change handler for physical items
  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQuantity(validQty);
    if (unitCost > 0) {
      setCostPrice((unitCost * validQty).toString());
    }
    if (unitSell > 0) {
      setSellingPrice((unitSell * validQty).toString());
    }
  };

  // Apply a Preset to form automatically
  const applyPreset = (preset: QuickPresetProduct) => {
    setSelectedCategory(preset.category);
    setServiceName(preset.name);
    setUnitCost(preset.costPrice);
    setUnitSell(preset.sellingPrice);

    const isPhys =
      preset.productType === 'fisik' ||
      preset.category === 'voucher_fisik' ||
      preset.category === 'kartu_perdana' ||
      preset.category === 'aksesori_lainnya';

    const currentQty = isPhys ? quantity : 1;
    setCostPrice((preset.costPrice * currentQty).toString());
    setSellingPrice((preset.sellingPrice * currentQty).toString());
    setSourceAccountId(isPhys ? 'stok_fisik' : preset.defaultSource);
    setProfitType(preset.profitType);
    if (preset.defaultAdminFee !== undefined) {
      setAdminFee(preset.defaultAdminFee.toString());
    } else {
      setAdminFee('0');
    }
    setActiveAutoFillPreset(preset.name);
    setMatchedPresetId(preset.id);

    // Auto-focus the target number input for non-physical interaction
    if (!isPhys) {
      setTimeout(() => {
        targetInputRef.current?.focus();
      }, 50);
    }
  };

  // If a preset was selected from Master Products view
  useEffect(() => {
    if (selectedPresetToFill) {
      applyPreset(selectedPresetToFill);
      if (onClearSelectedPreset) onClearSelectedPreset();
    }
  }, [selectedPresetToFill]);

  // Cost and Selling Numbers
  const numCost = parseInt(costPrice.replace(/[^0-9]/g, ''), 10) || 0;
  const numSell = parseInt(sellingPrice.replace(/[^0-9]/g, ''), 10) || 0;
  const numAdmin = parseInt(adminFee.replace(/[^0-9]/g, ''), 10) || 0;

  // Real-time Profit Calculation based on user specification
  const calculatedProfit = useMemo(() => {
    if (profitType === 'admin_fee') {
      // For Transfer Bank / Top-Up E-Wallet / Tarik Tunai: Profit = Biaya Admin
      return numAdmin > 0 ? numAdmin : Math.max(0, numSell - numCost);
    } else {
      // For Pulsa/Data/PLN/Game: Profit = Harga Jual - Harga Modal
      return numSell - numCost;
    }
  }, [profitType, numCost, numSell, numAdmin]);

  // Check if current category / source is physical stock
  const isPhysical = 
    selectedCategory === 'voucher_fisik' || 
    selectedCategory === 'kartu_perdana' || 
    selectedCategory === 'aksesori_lainnya';

  // Check if current category is Token PLN / Tagihan
  const isTokenOrBill = selectedCategory === 'pln_tagihan';

  // Selected Account details & available balance
  const selectedAccount = accounts.find((a) => a.id === sourceAccountId);
  const accountBalance = selectedAccount ? selectedAccount.balance : 0;
  const isBalanceInsufficient = !isPhysical && numCost > accountBalance;

  // Handle Admin Fee auto update when selling price changes in admin_fee mode
  const handleSellingPriceChange = (val: string) => {
    setSellingPrice(val);
    if (profitType === 'admin_fee' && numCost > 0) {
      const sellNum = parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
      if (sellNum > numCost) {
        setAdminFee((sellNum - numCost).toString());
      }
    }
  };

  // Quick preset nominal clicker
  const handleSetQuickAmount = (amount: number) => {
    setCostPrice(amount.toString());
    if (profitType === 'admin_fee') {
      const defaultFee = amount >= 500000 ? 7000 : 3000;
      setAdminFee(defaultFee.toString());
      setSellingPrice((amount + defaultFee).toString());
      if (!serviceName) {
        setServiceName(`Top Up / Transfer Rp ${amount.toLocaleString('id-ID')}`);
      }
    } else {
      const margin = amount <= 20000 ? 2000 : amount <= 50000 ? 3000 : 4000;
      setSellingPrice((amount + margin).toString());
      if (!serviceName) {
        setServiceName(`Pulsa / Tagihan Rp ${amount.toLocaleString('id-ID')}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice(null);

    const effectiveTargetNumber = targetNumber.trim() || (isPhysical ? 'Langsung / Etalase Fisik' : '');

    if (!isPhysical && !effectiveTargetNumber) {
      setErrorMessage(
        isTokenOrBill
          ? 'No. Meter / ID Pelanggan wajib diisi!'
          : 'Nomor HP / Nomor Tujuan wajib diisi!'
      );
      targetInputRef.current?.focus();
      return;
    }

    if (!serviceName.trim()) {
      setErrorMessage('Nama Layanan / Produk wajib diisi!');
      return;
    }

    if (numCost <= 0) {
      setErrorMessage('Harga modal harus lebih dari Rp 0!');
      return;
    }

    if (numSell <= 0) {
      setErrorMessage('Harga jual / nominal cash diterima harus lebih dari Rp 0!');
      return;
    }

    if (isBalanceInsufficient) {
      setErrorMessage(
        `Saldo ${selectedAccount?.name || 'akun modal'} tidak mencukupi untuk transaksi ini! Silakan cek & isi saldo di menu Saldo Modal.`
      );
      return;
    }

    const ok = onSubmitTransaction({
      category: selectedCategory,
      serviceName: serviceName.trim(),
      provider: detectedProvider || undefined,
      targetNumber: effectiveTargetNumber,
      sourceAccountId: isPhysical ? 'stok_fisik' : sourceAccountId,
      costPrice: numCost,
      sellingPrice: numSell,
      adminFee: numAdmin,
      profit: calculatedProfit,
      profitType,
      snRefNumber: snRefNumber.trim(),
      customerName: customerName.trim() || undefined,
      notes: notes.trim() || undefined,
      productType: isPhysical ? 'fisik' : 'digital',
      presetId: matchedPresetId || undefined,
      paymentMethod,
      destinationAccountId: paymentMethod === 'tunai' ? undefined : destinationAccountId,
      quantity: isPhysical ? quantity : 1,
    });

    if (ok) {
      setSuccessNotice(`Transaksi ${serviceName} berhasil diproses!`);
      // Reset form but keep category
      setServiceName('');
      setTargetNumber('');
      setCostPrice('');
      setSellingPrice('');
      setAdminFee('0');
      setSnRefNumber('');
      setCustomerName('');
      setNotes('');
      setQuantity(1);
      setUnitCost(0);
      setUnitSell(0);
      setPaymentMethod('tunai');
      setActiveAutoFillPreset(null);
      setMatchedPresetId(null);
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-28 md:pb-20 animate-in fade-in duration-200">
      {/* Category Pills Switcher - Floating & Sticky at Top under Navbar */}
      <div className="sticky top-16 z-30 -mt-1 pt-1 pb-1.5 bg-slate-100/90 backdrop-blur-md transition-all">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-sm shadow-slate-900/5 border border-slate-200/90 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 py-0.5">
            {CATEGORY_ITEMS.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {onOpenMasterProducts && (
            <button
              type="button"
              onClick={onOpenMasterProducts}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition shrink-0 border border-slate-200 cursor-pointer"
              title="Kelola Daftar Produk"
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Daftar Produk</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Entry Form Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                {isPhysical 
                  ? 'Formulir Voucher Fisik & Kartu Perdana' 
                  : isTokenOrBill 
                  ? 'Formulir Token PLN & Tagihan' 
                  : 'Formulir Pulsa & Paket Data'}
              </h2>
              {activeAutoFillPreset && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Auto-Fill: {activeAutoFillPreset}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isPhysical 
                ? 'Input transaksi penjualan voucher fisik dan kartu perdana' 
                : isTokenOrBill 
                ? 'Input transaksi token listrik PLN dan pembayaran tagihan' 
                : 'Input transaksi pulsa reguler dan paket kuota data'}
            </p>
          </div>

          <button
            form="quick-entry-form"
            type="submit"
            disabled={isBalanceInsufficient}
            className="hidden sm:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-2.5 px-5 rounded-xl text-xs shadow-sm transition shrink-0 cursor-pointer"
          >
            <span>Simpan & Catat Transaksi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* The Form */}
        <form id="quick-entry-form" onSubmit={handleSubmit} className="space-y-5">
          {isPhysical ? (
            /* ============================================================
               1. VOUCHER FISIK & KARTU PERDANA
               Form: Jenis Layanan/Nama Produk, Qty (Stok Terpotong), 
                     Harga Modal, Harga Jual, Jenis pembayaran
               ============================================================ */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Jenis Layanan / Nama Produk */}
              <div>
                <ProductSearchDropdown
                  presets={presets}
                  value={serviceName}
                  selectedCategory={selectedCategory}
                  detectedProvider={detectedProvider}
                  onSelectPreset={(preset) => applyPreset(preset)}
                  onCustomInputChange={(val) => {
                    setServiceName(val);
                    if (activeAutoFillPreset && val !== activeAutoFillPreset) {
                      setActiveAutoFillPreset(null);
                    }
                  }}
                  onOpenMasterProducts={onOpenMasterProducts}
                  error={Boolean(errorMessage && !serviceName.trim())}
                />
              </div>

              {/* Qty (Stok Terpotong) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qty (Stok Terpotong) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center justify-center transition active:scale-95 shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-black text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center justify-center transition active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Stok fisik terpotong {quantity} pcs saat disimpan</p>
              </div>

              {/* Harga Modal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harga Modal <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="100"
                    required
                    placeholder="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Harga Jual */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harga Jual <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="100"
                    required
                    placeholder="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Jenis Pembayaran & Akun Penampung (Di akhir setelah Harga Jual) */}
              <div className="md:col-span-2">
                <PaymentDestinationSelect
                  paymentMethod={paymentMethod}
                  onChangePaymentMethod={setPaymentMethod}
                  destinationAccountId={destinationAccountId}
                  onChangeDestinationAccount={setDestinationAccountId}
                  accounts={accounts}
                  cashOnHand={cashOnHand}
                  sellingPrice={numSell}
                />
              </div>
            </div>
          ) : isTokenOrBill ? (
            /* ============================================================
               2. TOKEN PLN & TAGIHAN
               Order: No Meter, Jenis Layanan/Nama Produk, 
                      Sumber Saldo Terpotong, Harga Modal (Saldo Terpotong), 
                      Harga Jual (Uang diterima dari pelanggan), Jenis Pembayaran
               ============================================================ */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* No Meter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No Meter <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={targetInputRef}
                  type="text"
                  required
                  placeholder="Contoh: 14234567890 / 51234567890"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Jenis Layanan / Nama Produk */}
              <div>
                <ProductSearchDropdown
                  presets={presets}
                  value={serviceName}
                  selectedCategory={selectedCategory}
                  detectedProvider={detectedProvider}
                  onSelectPreset={(preset) => applyPreset(preset)}
                  onCustomInputChange={(val) => {
                    setServiceName(val);
                    if (activeAutoFillPreset && val !== activeAutoFillPreset) {
                      setActiveAutoFillPreset(null);
                    }
                  }}
                  onOpenMasterProducts={onOpenMasterProducts}
                  error={Boolean(errorMessage && !serviceName.trim())}
                />
              </div>

              {/* Sumber saldo Terpotong */}
              <div className="md:col-span-2">
                <AccountSelect
                  id="select-source-account"
                  label="Sumber Saldo Terpotong *"
                  accounts={accounts}
                  value={sourceAccountId}
                  onChange={(accKey) => setSourceAccountId(accKey)}
                  requiredAmount={numCost}
                  error={isBalanceInsufficient}
                  includePhysicalStock={false}
                  hideBalance={true}
                />
                {isBalanceInsufficient && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1">
                    Saldo akun modal ini tidak mencukupi untuk transaksi ini!
                  </p>
                )}
              </div>

              {/* Harga Modal (Saldo Terpotong) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harga Modal (Saldo Terpotong) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="100"
                    required
                    placeholder="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                {/* Quick Nominal Pill Buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[20000, 50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSetQuickAmount(amt)}
                      className="text-[10px] py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-center"
                    >
                      {amt >= 1000 ? `${amt / 1000}rb` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Harga Jual (Uang diterima dari pelanggan) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harga Jual (Uang diterima dari pelanggan) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="100"
                    required
                    placeholder="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Jenis Pembayaran & Akun Penampung (Di akhir setelah Harga Jual) */}
              <div className="md:col-span-2">
                <PaymentDestinationSelect
                  paymentMethod={paymentMethod}
                  onChangePaymentMethod={setPaymentMethod}
                  destinationAccountId={destinationAccountId}
                  onChangeDestinationAccount={setDestinationAccountId}
                  accounts={accounts}
                  cashOnHand={cashOnHand}
                  sellingPrice={numSell}
                />
              </div>
            </div>
          ) : (
            /* ============================================================
               3. PULSA & PAKET DATA (dan Layanan Digital)
               Order: Nomor Hp, Jenis Layanan/Nama Produk, 
                      Sumber Saldo Terpotong, Harga Modal (Saldo Terpotong), 
                      Harga Jual (Uang diterima dari pelanggan), Jenis Pembayaran
               ============================================================ */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Nomor Hp */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor Hp <span className="text-rose-500">*</span>
                  </label>
                  {detectedProvider && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {detectedProvider}
                    </span>
                  )}
                </div>
                <input
                  ref={targetInputRef}
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              {/* Jenis Layanan / Nama Produk */}
              <div>
                <ProductSearchDropdown
                  presets={presets}
                  value={serviceName}
                  selectedCategory={selectedCategory}
                  detectedProvider={detectedProvider}
                  onSelectPreset={(preset) => applyPreset(preset)}
                  onCustomInputChange={(val) => {
                    setServiceName(val);
                    if (activeAutoFillPreset && val !== activeAutoFillPreset) {
                      setActiveAutoFillPreset(null);
                    }
                  }}
                  onOpenMasterProducts={onOpenMasterProducts}
                  error={Boolean(errorMessage && !serviceName.trim())}
                />
              </div>

              {/* Sumber Saldo Terpotong */}
              <div className="md:col-span-2">
                <AccountSelect
                  id="select-source-account"
                  label="Sumber Saldo Terpotong *"
                  accounts={accounts}
                  value={sourceAccountId}
                  onChange={(accKey) => setSourceAccountId(accKey)}
                  requiredAmount={numCost}
                  error={isBalanceInsufficient}
                  includePhysicalStock={false}
                  hideBalance={true}
                />
                {isBalanceInsufficient && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1">
                    Saldo akun modal ini tidak mencukupi untuk transaksi ini!
                  </p>
                )}
              </div>

              {/* Harga Modal (Saldo Terpotong) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harga Modal (Saldo Terpotong) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="100"
                    required
                    placeholder="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                {/* Quick Nominal Pill Buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[10000, 25000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSetQuickAmount(amt)}
                      className="text-[10px] py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-center"
                    >
                      {amt >= 1000 ? `${amt / 1000}rb` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Harga Jual (Uang diterima dari pelanggan) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harga Jual (Uang diterima dari pelanggan) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="100"
                    required
                    placeholder="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Jenis Pembayaran & Akun Penampung (Di akhir setelah Harga Jual) */}
              <div className="md:col-span-2">
                <PaymentDestinationSelect
                  paymentMethod={paymentMethod}
                  onChangePaymentMethod={setPaymentMethod}
                  destinationAccountId={destinationAccountId}
                  onChangeDestinationAccount={setDestinationAccountId}
                  accounts={accounts}
                  cashOnHand={cashOnHand}
                  sellingPrice={numSell}
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Floating Fixed Bottom Bar for Simpan & Catat Transaksi (Mengambang & Tetap di Layar) */}
      <div className="fixed bottom-[68px] md:bottom-4 left-0 right-0 z-35 px-3 sm:px-6 pointer-events-none transition-all">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-slate-900/95 text-white backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-800 shadow-xl shadow-slate-950/25 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/60 shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">
                  Total Bayar
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-400 leading-tight">
                  {numSell > 0 ? formatRupiah(numSell) : 'Rp 0'}
                </span>
              </div>

              {isBalanceInsufficient ? (
                <span className="text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800/60 px-2.5 py-1 rounded-lg truncate">
                  Saldo modal kurang!
                </span>
              ) : (
                <div className="hidden sm:block text-xs text-slate-300 truncate font-medium">
                  {isPhysical
                    ? (serviceName ? `${serviceName} (${quantity} pcs)` : 'Voucher Fisik')
                    : (targetNumber.trim() ? `No: ${targetNumber}` : 'Siap dicatat')}
                </div>
              )}
            </div>

            <button
              id="btn-submit-quick-entry"
              form="quick-entry-form"
              type="submit"
              disabled={isBalanceInsufficient}
              className="bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black py-2.5 sm:py-3 px-5 sm:px-7 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer shrink-0"
            >
              <span>Simpan & Catat Transaksi</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
