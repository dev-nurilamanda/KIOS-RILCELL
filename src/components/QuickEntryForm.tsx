import React, { useState, useEffect, useMemo } from 'react';
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
  Plus
} from 'lucide-react';
import { 
  ServiceCategory, 
  AccountKey, 
  ModalAccount, 
  RilcellTransaction, 
  TransactionType,
  QuickPresetProduct 
} from '../types';
import { QUICK_PRESETS } from '../data/initialData';
import { formatRupiah, detectProvider } from '../utils/formatters';

interface QuickEntryFormProps {
  accounts: ModalAccount[];
  onSubmitTransaction: (trxData: Omit<RilcellTransaction, 'id' | 'invoiceNumber' | 'timestamp' | 'status' | 'syncedToSheets'>) => boolean;
  onSelectTransactionReceipt?: (trx: RilcellTransaction) => void;
}

const CATEGORY_ITEMS: { id: ServiceCategory; label: string; icon: React.ReactNode; defaultProfitType: TransactionType }[] = [
  { id: 'pulsa_data', label: 'Pulsa & Paket Data', icon: <Smartphone className="w-4 h-4" />, defaultProfitType: 'standard_margin' },
  { id: 'pln_tagihan', label: 'Token PLN & Tagihan', icon: <Zap className="w-4 h-4" />, defaultProfitType: 'standard_margin' },
  { id: 'topup_ewallet', label: 'Top-Up E-Wallet', icon: <Wallet className="w-4 h-4" />, defaultProfitType: 'admin_fee' },
  { id: 'transfer_tarik', label: 'Transfer & Tarik Tunai', icon: <Landmark className="w-4 h-4" />, defaultProfitType: 'admin_fee' },
  { id: 'game_tv', label: 'Game & Kuota TV', icon: <Gamepad2 className="w-4 h-4" />, defaultProfitType: 'standard_margin' },
];

export const QuickEntryForm: React.FC<QuickEntryFormProps> = ({
  accounts,
  onSubmitTransaction,
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

  // Filter presets for current category
  const activePresets = useMemo(() => {
    return QUICK_PRESETS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const applyPreset = (preset: QuickPresetProduct) => {
    setServiceName(preset.name);
    setCostPrice(preset.costPrice.toString());
    setSellingPrice(preset.sellingPrice.toString());
    setSourceAccountId(preset.defaultSource);
    setProfitType(preset.profitType);
    if (preset.defaultAdminFee !== undefined) {
      setAdminFee(preset.defaultAdminFee.toString());
    } else {
      setAdminFee('0');
    }
  };

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

  // Selected Account details & available balance
  const selectedAccount = accounts.find((a) => a.id === sourceAccountId);
  const accountBalance = selectedAccount ? selectedAccount.balance : 0;
  const isBalanceInsufficient = numCost > accountBalance;

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

    if (!targetNumber.trim()) {
      setErrorMessage('Nomor Tujuan / ID Pelanggan / No. Rekening wajib diisi!');
      return;
    }

    if (!serviceName.trim()) {
      setErrorMessage('Nama Layanan / Produk wajib diisi!');
      return;
    }

    if (numCost <= 0) {
      setErrorMessage('Harga modal (saldo yang terpotong) harus lebih dari Rp 0!');
      return;
    }

    if (numSell <= 0) {
      setErrorMessage('Harga jual / nominal cash diterima harus lebih dari Rp 0!');
      return;
    }

    if (isBalanceInsufficient) {
      setErrorMessage(
        `Saldo ${selectedAccount?.name || 'akun modal'} tidak mencukupi! Tersedia: ${formatRupiah(accountBalance)}, dibutuhkan: ${formatRupiah(numCost)}`
      );
      return;
    }

    const ok = onSubmitTransaction({
      category: selectedCategory,
      serviceName: serviceName.trim(),
      provider: detectedProvider || undefined,
      targetNumber: targetNumber.trim(),
      sourceAccountId,
      costPrice: numCost,
      sellingPrice: numSell,
      adminFee: numAdmin,
      profit: calculatedProfit,
      profitType,
      snRefNumber: snRefNumber.trim(),
      customerName: customerName.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (ok) {
      setSuccessNotice(`Transaksi ${serviceName} ke ${targetNumber} berhasil diproses!`);
      // Reset form but keep category
      setServiceName('');
      setTargetNumber('');
      setCostPrice('');
      setSellingPrice('');
      setAdminFee('0');
      setSnRefNumber('');
      setCustomerName('');
      setNotes('');
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Category Pills Switcher */}
      <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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

      {/* Main Entry Form Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Form Input Transaksi Kasir</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                Quick Entry
              </span>
            </h2>
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

        {/* Quick Presets Pills */}
        {activePresets.length > 0 && (
          <div className="mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pilihan Cepat (Presets):</span>
              </span>
              <span className="text-[11px] text-slate-400">Klik untuk isi formulir instan</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 hover:text-emerald-800 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5"
                >
                  <span>{preset.name}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                    {formatRupiah(preset.sellingPrice)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

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
                type="text"
                required
                placeholder="Contoh: 08123456789 / No. Meter PLN"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>

            {/* Nama Produk / Jenis Layanan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Layanan / Nama Produk <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Telkomsel Pulsa 25.000 / Top Up DANA 100K"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>

            {/* Sumber Saldo Terpotong */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Sumber Saldo Terpotong <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[11px] font-mono font-bold ${isBalanceInsufficient ? 'text-rose-600' : 'text-slate-500'}`}>
                  Saldo: {formatRupiah(accountBalance)}
                </span>
              </div>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value as AccountKey)}
                className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none ${
                  isBalanceInsufficient ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 focus:border-emerald-500'
                }`}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Saldo: {formatRupiah(acc.balance)} {acc.balance < 100000 ? '⚠️ (Menipis)' : ''}
                  </option>
                ))}
              </select>
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

            {/* Nama Pelanggan / Catatan */}
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
