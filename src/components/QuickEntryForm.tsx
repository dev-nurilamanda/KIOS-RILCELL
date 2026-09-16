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
  Sparkles,
  Search,
  Plus,
  Package,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Ticket,
  CreditCard,
  Headphones,
  Box
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

interface QuickEntryFormProps {
  accounts: ModalAccount[];
  presets: QuickPresetProduct[];
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
  const [presetSearch, setPresetSearch] = useState('');
  const [isQuickPickOpen, setIsQuickPickOpen] = useState(true);

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

  // Filter presets for current category and optional quick search
  const categoryPresets = useMemo(() => {
    return presets.filter((p) => {
      if (p.category !== selectedCategory) return false;
      if (presetSearch.trim()) {
        const q = presetSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.provider || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [presets, selectedCategory, presetSearch]);

  // Apply a Preset to form automatically
  const applyPreset = (preset: QuickPresetProduct) => {
    setSelectedCategory(preset.category);
    setServiceName(preset.name);
    setCostPrice(preset.costPrice.toString());
    setSellingPrice(preset.sellingPrice.toString());
    setSourceAccountId(preset.productType === 'fisik' ? 'stok_fisik' : preset.defaultSource);
    setProfitType(preset.profitType);
    if (preset.defaultAdminFee !== undefined) {
      setAdminFee(preset.defaultAdminFee.toString());
    } else {
      setAdminFee('0');
    }
    setActiveAutoFillPreset(preset.name);
    setMatchedPresetId(preset.id);

    // Auto-focus the target number input for blazingly fast interaction!
    setTimeout(() => {
      targetInputRef.current?.focus();
    }, 50);
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
    sourceAccountId === 'stok_fisik' || 
    selectedCategory === 'voucher_fisik' || 
    selectedCategory === 'kartu_perdana' || 
    selectedCategory === 'aksesori_lainnya';

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

    const effectiveTargetNumber = targetNumber.trim() || (isPhysical ? 'Langsung / Etalase' : '');

    if (!effectiveTargetNumber) {
      setErrorMessage('Nomor Tujuan / ID Pelanggan / No. Rekening wajib diisi!');
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
      setActiveAutoFillPreset(null);
      setMatchedPresetId(null);
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Category Pills Switcher */}
      <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
          {CATEGORY_ITEMS.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {onOpenMasterProducts && (
          <button
            type="button"
            onClick={onOpenMasterProducts}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition shrink-0 border border-slate-200"
            title="Kelola Master Produk & Preset"
          >
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Master Produk</span>
          </button>
        )}
      </div>

      {/* Quick Pick Buttons / Product Chips (Master Products Auto-Fill) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    Pilihan Cepat Produk (Quick Pick Chips)
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {categoryPresets.length} produk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Klik produk untuk mengisi Nama, Server/Stok, Modal, dan Harga Jual otomatis
                </p>
              </div>
            </div>

            {/* Collapse Toggle Button (Mobile & Desktop) */}
            <button
              type="button"
              onClick={() => setIsQuickPickOpen((prev) => !prev)}
              className="flex sm:hidden items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              {isQuickPickOpen ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Sembunyikan</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Buka Chips</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 justify-between sm:justify-end">
            {isQuickPickOpen && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari preset..."
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:bg-white focus:outline-none w-32 sm:w-36"
                />
              </div>
            )}

            {onOpenMasterProducts && (
              <button
                type="button"
                onClick={onOpenMasterProducts}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>+ Atur Master</span>
              </button>
            )}

            {/* Collapse Toggle Button (Desktop/Tablet) */}
            <button
              type="button"
              onClick={() => setIsQuickPickOpen((prev) => !prev)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              {isQuickPickOpen ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Sembunyikan</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Tampilkan Tombol Cepat</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chips Container (Collapsible) */}
        {isQuickPickOpen && (
          <div className="animate-in fade-in duration-150">
            {categoryPresets.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center border border-dashed border-slate-200 text-xs text-slate-500">
                <span>Belum ada preset untuk kategori ini. </span>
                {onOpenMasterProducts && (
                  <button
                    type="button"
                    onClick={onOpenMasterProducts}
                    className="text-emerald-600 font-bold hover:underline ml-1"
                  >
                    Tambah di Master Produk
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
            {categoryPresets.map((preset) => {
              const isSelected = activeAutoFillPreset === preset.name;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 border text-left ${
                    isSelected
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-[1.02]'
                      : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200 hover:border-emerald-300 text-slate-800'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[160px] sm:max-w-[200px]">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 stroke-[3] text-white shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                      {preset.productType === 'fisik' ? (
                        <span
                          className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-emerald-700 text-emerald-100'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          <Box className="w-2.5 h-2.5" />
                          <span>Stok {preset.stockQuantity ?? 0}</span>
                        </span>
                      ) : (
                        <span
                          className={`font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-emerald-700 text-emerald-100'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {preset.defaultSource}
                        </span>
                      )}
                      <span
                        className={`font-bold ${
                          isSelected ? 'text-amber-200' : 'text-emerald-700'
                        }`}
                      >
                        {formatRupiah(preset.sellingPrice)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Entry Form Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                Form Input Transaksi Kasir
              </h2>
              {activeAutoFillPreset && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Auto-Fill: {activeAutoFillPreset}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Input cepat penjualan pulsa, token, top-up e-wallet, dan transfer bank
            </p>
          </div>

          {/* Profit Mode Indicator */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setProfitType('standard_margin')}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-xs ${
                profitType === 'standard_margin'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Margin Langsung
            </button>
            <button
              type="button"
              onClick={() => setProfitType('admin_fee')}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-xs ${
                profitType === 'admin_fee'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Biaya Admin (Fee)
            </button>
          </div>
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Nomor Tujuan / ID Pelanggan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Nomor Tujuan / ID / Rekening <span className="text-rose-500">*</span>
                </label>
                {detectedProvider && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {detectedProvider}
                  </span>
                )}
              </div>
              <input
                ref={targetInputRef}
                type="text"
                required
                placeholder="Contoh: 08123456789 / No. Meter PLN"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>

            {/* Nama Produk / Jenis Layanan (Dropdown atau Mode Search dengan Referensi dari Halaman Produk) */}
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

            {/* Sumber Saldo Terpotong (CUSTOM TAILWIND UI SELECT - Balance Hidden) */}
            <div>
              <AccountSelect
                id="select-source-account"
                label={isPhysical ? 'Tipe Sumber Saldo / Etalase *' : 'Sumber Saldo Terpotong *'}
                accounts={accounts}
                value={sourceAccountId}
                onChange={(accKey) => setSourceAccountId(accKey)}
                requiredAmount={isPhysical ? 0 : numCost}
                error={isBalanceInsufficient}
                includePhysicalStock={true}
                hideBalance={true}
              />
              {isPhysical ? (
                <p className="text-[11px] text-indigo-700 font-semibold mt-1">
                  📦 Produk Fisik: Tidak memotong saldo digital. Stok fisik berkurang 1 pcs & harga jual masuk ke Kas Laci.
                </p>
              ) : isBalanceInsufficient ? (
                <p className="text-[11px] text-rose-600 font-bold mt-1">
                  Saldo akun modal ini tidak mencukupi untuk transaksi ini!
                </p>
              ) : null}
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

            {/* Harga Jual / Nominal Cash Diterima */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Jual / Uang Diterima dari Pelanggan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  step="100"
                  required
                  placeholder="0"
                  value={sellingPrice}
                  onChange={(e) => handleSellingPriceChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Biaya Admin / Fee (Khusus Transfer / E-Wallet) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Biaya Admin / Fee Konter {profitType === 'admin_fee' ? '(Laba Bersih)' : '(Opsional)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  step="500"
                  placeholder="0"
                  value={adminFee}
                  onChange={(e) => setAdminFee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {profitType === 'admin_fee'
                  ? 'Keuntungan langsung diambil dari Biaya Admin.'
                  : 'Untuk pulsa/data dihitung dari selisih jual - modal.'}
              </p>
            </div>

            {/* Nomor Seri (SN / Ref ID) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Seri (SN / Ref ID / No. Token)
              </label>
              <input
                type="text"
                placeholder="Contoh: 1829-1029-4819-2019-3918"
                value={snRefNumber}
                onChange={(e) => setSnRefNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Nama Pelanggan & Catatan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pelanggan & Catatan (Opsional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama Pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Keterangan / Catatan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Live Calculation Summary Banner */}
          <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="grid grid-cols-3 gap-3 divide-x divide-slate-800 text-center sm:text-left">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Saldo Modal</span>
                <span className="text-sm font-bold text-rose-400">-{formatRupiah(numCost)}</span>
              </div>
              <div className="pl-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kas Tunai Masuk</span>
                <span className="text-sm font-bold text-emerald-400">+{formatRupiah(numSell)}</span>
              </div>
              <div className="pl-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Laba / Untung</span>
                <span className={`text-base font-black ${calculatedProfit >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {formatRupiah(calculatedProfit)}
                </span>
              </div>
            </div>

            <button
              id="btn-submit-quick-entry"
              type="submit"
              disabled={isBalanceInsufficient}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-3 px-6 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition shrink-0"
            >
              <span>Simpan & Catat Transaksi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
