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
  QrCode,
  Users,
  UserCheck,
  UserPlus,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { 
  ServiceCategory, 
  AccountKey, 
  ModalAccount, 
  RilcellTransaction, 
  TransactionType,
  QuickPresetProduct,
  CustomerRecord
} from '../types';
import { formatRupiah, detectProvider } from '../utils/formatters';
import { AccountSelect } from './CustomSelect';
import { ProductSearchDropdown } from './ProductSearchDropdown';
import { PaymentDestinationSelect } from './PaymentDestinationSelect';
import { CustomerPickerModal } from './CustomerPickerModal';

interface QuickEntryFormProps {
  accounts: ModalAccount[];
  presets: QuickPresetProduct[];
  cashOnHand?: number;
  onSubmitTransaction: (trxData: Omit<RilcellTransaction, 'id' | 'invoiceNumber' | 'timestamp' | 'status' | 'syncedToSheets'>) => boolean;
  onSelectTransactionReceipt?: (trx: RilcellTransaction) => void;
  onOpenMasterProducts?: () => void;
  selectedPresetToFill?: QuickPresetProduct | null;
  onClearSelectedPreset?: () => void;
  customers?: CustomerRecord[];
  selectedCustomerToFill?: {
    customer: CustomerRecord;
    category: ServiceCategory;
    targetValue: string;
  } | null;
  onClearSelectedCustomer?: () => void;
  onOpenCustomerManager?: () => void;
  onQuickSaveCustomer?: (newCust: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
  customers = [],
  selectedCustomerToFill,
  onClearSelectedCustomer,
  onOpenCustomerManager,
  onQuickSaveCustomer,
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
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);

  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Custom Form Fields State (Quantity, Payment Method & Destination Account)
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [unitSell, setUnitSell] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'transfer'>('tunai');
  const [destinationAccountId, setDestinationAccountId] = useState<AccountKey>('gopay_merchant');

  const targetInputRef = useRef<HTMLInputElement>(null);

  // Dynamic labels and placeholders based on category
  const targetFieldLabel = useMemo(() => {
    switch (selectedCategory) {
      case 'pln_tagihan':
        return 'No Meter / ID Pelanggan';
      case 'topup_ewallet':
        return 'Nomor HP E-Wallet';
      case 'transfer_tarik':
        return 'Nomor Rekening Tujuan';
      case 'game_tv':
        return 'ID Game & Server';
      default:
        return 'Nomor HP Tujuan';
    }
  }, [selectedCategory]);

  const targetFieldPlaceholder = useMemo(() => {
    switch (selectedCategory) {
      case 'pln_tagihan':
        return 'Contoh: 14234567890 / 51234567890';
      case 'topup_ewallet':
        return 'Contoh: 081234567890 (DANA, Gopay, OVO)';
      case 'transfer_tarik':
        return 'Contoh: 1230984711 (No. Rekening)';
      case 'game_tv':
        return 'Contoh: 84729104 (2194) / ID Free Fire';
      default:
        return 'Contoh: 081234567890';
    }
  }, [selectedCategory]);

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

  // If a customer was selected from Customer Manager
  useEffect(() => {
    if (selectedCustomerToFill) {
      handleCategoryChange(selectedCustomerToFill.category);
      setTargetNumber(selectedCustomerToFill.targetValue);
      setCustomerName(selectedCustomerToFill.customer.name);
      setTimeout(() => {
        targetInputRef.current?.focus();
      }, 50);
      if (onClearSelectedCustomer) onClearSelectedCustomer();
    }
  }, [selectedCustomerToFill]);

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
    <div className="max-w-3xl mx-auto space-y-2.5 sm:space-y-3 pb-6 animate-in fade-in duration-200">
      {/* Category Pills Switcher - Ultra-Slim Single Line Bar */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-1.5 shadow-2xs border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 py-0.5">
          {CATEGORY_ITEMS.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-sm leading-none">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {onOpenMasterProducts && (
          <button
            type="button"
            onClick={onOpenMasterProducts}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-700 rounded-lg text-xs font-bold transition shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Kelola Daftar Produk"
          >
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span>Produk</span>
          </button>
        )}
      </div>

      {/* Main Ultra-Compact POS Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-4">
        {/* Compact Card Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
              {isPhysical 
                ? 'Voucher Fisik & Perdana' 
                : isTokenOrBill 
                ? 'Token PLN & Tagihan' 
                : 'Pulsa & Paket Data'}
            </h2>
            {activeAutoFillPreset && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0 animate-in fade-in">
                <Check className="w-2.5 h-2.5 text-emerald-600" />
                <span className="truncate max-w-[120px] sm:max-w-[200px]">{activeAutoFillPreset}</span>
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
            Mode Kasir Cepat
          </div>
        </div>

        {/* Inline Compact Error & Success Notifications */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{successNotice}</span>
          </div>
        )}

        {/* Compact Form */}
        <form id="quick-entry-form" onSubmit={handleSubmit} className="space-y-3">
          {isPhysical ? (
            /* ============================================================
               1. VOUCHER FISIK & KARTU PERDANA (Zero-Scroll Compact)
               ============================================================ */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Produk / Voucher */}
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

                {/* Qty Stepper */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah (Qty) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition active:scale-95 shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-center text-sm font-black text-slate-900 dark:text-white focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Harga Modal & Harga Jual Sub-Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Modal <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      step="100"
                      required
                      placeholder="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Harga Jual <span className="text-rose-500">*</span>
                    </label>
                    {calculatedProfit > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        +{formatRupiah(calculatedProfit)}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      step="100"
                      required
                      placeholder="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Jenis Pembayaran */}
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
          ) : (
            /* ============================================================
               2. PULSA, DATA, PLN, E-WALLET & DIGITAL (Zero-Scroll Compact)
               ============================================================ */
            <div className="space-y-3">
              {/* Row 1: Nomor Tujuan + Nama Produk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Nomor HP / No Meter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                        {targetFieldLabel} <span className="text-rose-500">*</span>
                      </label>
                      {detectedProvider && selectedCategory === 'pulsa_data' && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.2 rounded-full shrink-0">
                          {detectedProvider}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCustomerPickerOpen(true)}
                      className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer shrink-0"
                      title="Pilih dari kontak pelanggan"
                    >
                      <Users className="w-3 h-3" />
                      <span>Pelanggan</span>
                    </button>
                  </div>
                  <input
                    ref={targetInputRef}
                    type={selectedCategory === 'transfer_tarik' ? 'text' : 'tel'}
                    required
                    placeholder={targetFieldPlaceholder}
                    value={targetNumber}
                    onChange={(e) => setTargetNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                  {customerName && (
                    <div className="mt-1 flex items-center justify-between px-2 py-0.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-md text-[10px]">
                      <span className="text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 truncate">
                        <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        Pelanggan: {customerName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCustomerName('')}
                        className="text-slate-400 hover:text-rose-600 font-semibold underline shrink-0 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>

                {/* Pilih Produk */}
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
              </div>

              {/* Row 2: Sumber Saldo Modal + Subgrid (Harga Modal & Harga Jual) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Sumber Saldo Modal */}
                <div>
                  <AccountSelect
                    id="select-source-account"
                    label="Sumber Saldo Modal *"
                    accounts={accounts}
                    value={sourceAccountId}
                    onChange={(accKey) => setSourceAccountId(accKey)}
                    requiredAmount={numCost}
                    error={isBalanceInsufficient}
                    includePhysicalStock={false}
                    hideBalance={false}
                  />
                  {isBalanceInsufficient && (
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                      Saldo akun modal ini tidak cukup!
                    </p>
                  )}
                </div>

                {/* Subgrid: Harga Modal & Harga Jual */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 truncate">
                      Harga Modal <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        step="100"
                        required
                        placeholder="0"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-2 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                        Harga Jual <span className="text-rose-500">*</span>
                      </label>
                      {calculatedProfit > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                          +{formatRupiah(calculatedProfit)}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        step="100"
                        required
                        placeholder="0"
                        value={sellingPrice}
                        onChange={(e) => handleSellingPriceChange(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-2 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Jenis Pembayaran (Tunai / QRIS / Transfer) */}
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
          )}

          {/* Row 4: Collapsible Optional Details (Nama Pelanggan, Catatan & No. SN) */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full flex items-center justify-between py-1 px-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {customerName || notes || snRefNumber
                    ? `Data Tambahan: ${customerName ? `Pelanggan: ${customerName}` : ''} ${notes ? `· Catatan: ${notes}` : ''}`
                    : '+ Tambah Catatan / Data Pelanggan / No. SN (Opsional)'}
                </span>
                {(customerName || notes || snRefNumber) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </div>
              {isDetailsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {isDetailsExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 pb-1 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Nama Pelanggan
                    </label>
                    {targetNumber.trim() && customerName.trim() && onQuickSaveCustomer && (
                      <button
                        type="button"
                        onClick={() => {
                          onQuickSaveCustomer({
                            name: customerName.trim(),
                            phone: selectedCategory === 'pulsa_data' ? targetNumber.trim() : '',
                            notes: `Pelanggan transaksi ${serviceName || ''}`,
                            meterNumbers: selectedCategory === 'pln_tagihan' ? [{
                              id: `meter-${Date.now()}`,
                              meterNumber: targetNumber.trim(),
                              ownerName: customerName.trim(),
                            }] : [],
                            ewallets: selectedCategory === 'topup_ewallet' ? [{
                              id: `ew-${Date.now()}`,
                              walletType: 'dana',
                              phoneNumber: targetNumber.trim(),
                              accountHolder: customerName.trim(),
                            }] : [],
                            bankAccounts: selectedCategory === 'transfer_tarik' ? [{
                              id: `bk-${Date.now()}`,
                              bankName: 'Bank',
                              accountNumber: targetNumber.trim(),
                              accountHolder: customerName.trim(),
                            }] : [],
                            gameProfiles: selectedCategory === 'game_tv' ? [{
                              id: `gm-${Date.now()}`,
                              gameName: 'Game',
                              userId: targetNumber.trim(),
                            }] : [],
                          });
                          setSuccessNotice(`Data pelanggan "${customerName}" berhasil disimpan ke database!`);
                          setTimeout(() => setSuccessNotice(null), 3000);
                        }}
                        className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Simpan ke daftar pelanggan"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Simpan ke DB</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: Mas Dimas, Bu Rina..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Transaksi / No. SN
                  </label>
                  <input
                    type="text"
                    placeholder="Keterangan transaksi / No. Ref..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Integrated Compact Bottom Action Bar (Inside the Card - Zero External Overlay) */}
          <div className="pt-2">
            <div className="bg-slate-900 text-white rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md">
              {/* Total & Profit Info */}
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block leading-none mb-1">
                    Total Bayar
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-400 leading-none">
                    {numSell > 0 ? formatRupiah(numSell) : 'Rp 0'}
                  </span>
                </div>

                {calculatedProfit > 0 && (
                  <div className="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 text-right sm:text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">
                      Est. Laba
                    </span>
                    <span className="text-xs font-bold text-teal-300 leading-none">
                      +{formatRupiah(calculatedProfit)}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Action Button */}
              <button
                id="btn-submit-quick-entry"
                type="submit"
                disabled={isBalanceInsufficient}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black py-2.5 px-5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer"
              >
                <span>Simpan Transaksi</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Customer Picker Modal */}
      <CustomerPickerModal
        isOpen={isCustomerPickerOpen}
        onClose={() => setIsCustomerPickerOpen(false)}
        customers={customers}
        currentCategory={selectedCategory}
        onSelectCustomer={(cust, selectedTarget) => {
          setTargetNumber(selectedTarget);
          setCustomerName(cust.name);
          setTimeout(() => {
            targetInputRef.current?.focus();
          }, 50);
        }}
        onOpenCustomerManager={onOpenCustomerManager}
      />
    </div>
  );
};
