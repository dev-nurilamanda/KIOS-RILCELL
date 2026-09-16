import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Check, 
  X, 
  Smartphone, 
  Zap, 
  Wallet, 
  Landmark, 
  Gamepad2,
  TrendingUp,
  Tag
} from 'lucide-react';
import { 
  QuickPresetProduct, 
  ServiceCategory, 
  AccountKey, 
  ModalAccount, 
  TransactionType 
} from '../types';
import { CategorySelect, AccountSelect } from './CustomSelect';
import { formatRupiah } from '../utils/formatters';

interface MasterProductManagerProps {
  presets: QuickPresetProduct[];
  accounts: ModalAccount[];
  onAddPreset: (preset: Omit<QuickPresetProduct, 'id'>) => void;
  onUpdatePreset: (id: string, preset: Partial<QuickPresetProduct>) => void;
  onDeletePreset: (id: string) => void;
  onResetPresets: () => void;
  onSelectPresetToTransact?: (preset: QuickPresetProduct) => void;
}

export const MasterProductManager: React.FC<MasterProductManagerProps> = ({
  presets,
  accounts,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
  onResetPresets,
  onSelectPresetToTransact,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<QuickPresetProduct | null>(null);

  // Form State for Add / Edit
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('pulsa_data');
  const [provider, setProvider] = useState('');
  const [defaultSource, setDefaultSource] = useState<AccountKey>('digipos');
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [defaultAdminFee, setDefaultAdminFee] = useState<string>('0');
  const [profitType, setProfitType] = useState<TransactionType>('standard_margin');

  // Filtered Presets List
  const filteredPresets = useMemo(() => {
    return presets.filter((p) => {
      if (filterCategory !== 'all' && p.category !== filterCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(term);
        const matchProvider = (p.provider || '').toLowerCase().includes(term);
        const matchSource = p.defaultSource.toLowerCase().includes(term);
        if (!matchName && !matchProvider && !matchSource) return false;
      }
      return true;
    });
  }, [presets, filterCategory, searchTerm]);

  const openAddModal = () => {
    setEditingPreset(null);
    setName('');
    setCategory('pulsa_data');
    setProvider('');
    setDefaultSource('digipos');
    setCostPrice('');
    setSellingPrice('');
    setDefaultAdminFee('0');
    setProfitType('standard_margin');
    setIsModalOpen(true);
  };

  const openEditModal = (preset: QuickPresetProduct) => {
    setEditingPreset(preset);
    setName(preset.name);
    setCategory(preset.category);
    setProvider(preset.provider || '');
    setDefaultSource(preset.defaultSource);
    setCostPrice(preset.costPrice.toString());
    setSellingPrice(preset.sellingPrice.toString());
    setDefaultAdminFee((preset.defaultAdminFee ?? 0).toString());
    setProfitType(preset.profitType);
    setIsModalOpen(true);
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();

    const numCost = parseInt(costPrice.replace(/[^0-9]/g, ''), 10) || 0;
    const numSell = parseInt(sellingPrice.replace(/[^0-9]/g, ''), 10) || 0;
    const numFee = parseInt(defaultAdminFee.replace(/[^0-9]/g, ''), 10) || 0;

    if (!name.trim()) {
      alert('Nama produk wajib diisi!');
      return;
    }
    if (numCost <= 0 || numSell <= 0) {
      alert('Harga modal dan harga jual harus lebih dari Rp 0!');
      return;
    }

    if (editingPreset) {
      onUpdatePreset(editingPreset.id, {
        name: name.trim(),
        category,
        provider: provider.trim() || undefined,
        defaultSource,
        costPrice: numCost,
        sellingPrice: numSell,
        defaultAdminFee: numFee,
        profitType,
      });
    } else {
      onAddPreset({
        name: name.trim(),
        category,
        provider: provider.trim() || undefined,
        defaultSource,
        costPrice: numCost,
        sellingPrice: numSell,
        defaultAdminFee: numFee,
        profitType,
      });
    }

    setIsModalOpen(false);
  };

  const getAccountName = (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    return acc ? acc.name : accId.toUpperCase();
  };

  const getCategoryBadge = (cat: ServiceCategory) => {
    switch (cat) {
      case 'pulsa_data':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Smartphone className="w-3 h-3" />
            <span>Pulsa & Data</span>
          </span>
        );
      case 'pln_tagihan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Zap className="w-3 h-3" />
            <span>Token PLN</span>
          </span>
        );
      case 'topup_ewallet':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Wallet className="w-3 h-3" />
            <span>Top-Up E-Wallet</span>
          </span>
        );
      case 'transfer_tarik':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Landmark className="w-3 h-3" />
            <span>Transfer Bank</span>
          </span>
        );
      case 'game_tv':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Gamepad2 className="w-3 h-3" />
            <span>Game & TV</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>Master Produk & Preset Cepat</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {presets.length} Produk
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar produk langganan konter dengan harga modal, harga jual, dan server saldo default untuk input transaksi otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (confirm('Kembalikan daftar produk ke preset bawaan standar RILCELL?')) {
                onResetPresets();
              }
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Kembalikan ke data bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset Bawaan</span>
          </button>

          <button
            type="button"
            id="btn-add-master-product"
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama produk, provider, atau server saldo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'pulsa_data', label: 'Pulsa' },
            { id: 'pln_tagihan', label: 'PLN' },
            { id: 'topup_ewallet', label: 'E-Wallet' },
            { id: 'transfer_tarik', label: 'Transfer' },
            { id: 'game_tv', label: 'Game' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterCategory === cat.id
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredPresets.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Tidak ada produk yang cocok dengan pencarian.</p>
          <p className="text-xs text-slate-400 mt-1">Klik 'Tambah Produk Baru' untuk mendaftarkan produk konter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map((preset) => {
            const profit =
              preset.profitType === 'admin_fee' && preset.defaultAdminFee
                ? preset.defaultAdminFee
                : preset.sellingPrice - preset.costPrice;

            return (
              <div
                key={preset.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-400/80 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="space-y-1">
                      {getCategoryBadge(preset.category)}
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition">
                        {preset.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(preset)}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
                        title="Edit Produk"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus preset produk "${preset.name}"?`)) {
                            onDeletePreset(preset.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Server Saldo:</span>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {getAccountName(preset.defaultSource)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Harga Modal:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatRupiah(preset.costPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Harga Jual:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatRupiah(preset.sellingPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Laba: +{formatRupiah(profit)}</span>
                  </div>

                  {onSelectPresetToTransact && (
                    <button
                      type="button"
                      onClick={() => onSelectPresetToTransact(preset)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg transition"
                    >
                      Pilih Transaksi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  {editingPreset ? 'Edit Master Produk' : 'Tambah Master Produk Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePreset} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* Nama Produk */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Produk / Layanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Telkomsel Data 15GB 30 Hari / Token PLN 50K"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Kategori Layanan (Custom UI Select) */}
              <div>
                <CategorySelect
                  label="Kategori Layanan"
                  value={category}
                  onChange={(val) => setCategory(val)}
                />
              </div>

              {/* Provider / Operator */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Provider / Operator (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Telkomsel, PLN, DANA, Moonton, BSI"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Sumber Saldo Modal Default (Custom Account Select) */}
              <div>
                <AccountSelect
                  label="Sumber Saldo Modal Default"
                  accounts={accounts}
                  value={defaultSource}
                  onChange={(accKey) => setDefaultSource(accKey)}
                />
              </div>

              {/* Tipe Profit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Skema Perhitungan Keuntungan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProfitType('standard_margin')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      profitType === 'standard_margin'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Margin (Jual - Modal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfitType('admin_fee')}
                    className={`p-2 rounded-xl text-xs font-bold border transition ${
                      profitType === 'admin_fee'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Biaya Admin / Fee
                  </button>
                </div>
              </div>

              {/* Harga Modal & Harga Jual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Modal (Saldo Terpotong) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      step="100"
                      required
                      placeholder="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Jual ke Pelanggan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      step="100"
                      required
                      placeholder="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Biaya Admin jika mode admin_fee */}
              {profitType === 'admin_fee' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Biaya Admin Default (Laba Bersih)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      step="500"
                      placeholder="3000"
                      value={defaultAdminFee}
                      onChange={(e) => setDefaultAdminFee(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPreset ? 'Perbarui Produk' : 'Simpan Produk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
