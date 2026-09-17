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
  Tag,
  Box,
  Ticket,
  CreditCard,
  Headphones
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
  const [productType, setProductType] = useState<'digital' | 'fisik'>('digital');
  const [stockQuantity, setStockQuantity] = useState<string>('10');
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
    setProductType('digital');
    setStockQuantity('10');
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
    setProductType(preset.productType || 'digital');
    setStockQuantity((preset.stockQuantity ?? 10).toString());
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
    const numStock = parseInt(stockQuantity.replace(/[^0-9]/g, ''), 10) || 0;

    if (!name.trim()) {
      alert('Nama produk wajib diisi!');
      return;
    }
    if (numCost <= 0 || numSell <= 0) {
      alert('Harga modal dan harga jual harus lebih dari Rp 0!');
      return;
    }

    const payloadSource = productType === 'fisik' ? 'stok_fisik' : defaultSource;

    if (editingPreset) {
      onUpdatePreset(editingPreset.id, {
        name: name.trim(),
        productType,
        stockQuantity: productType === 'fisik' ? numStock : undefined,
        category,
        provider: provider.trim() || undefined,
        defaultSource: payloadSource,
        costPrice: numCost,
        sellingPrice: numSell,
        defaultAdminFee: numFee,
        profitType,
      });
    } else {
      onAddPreset({
        name: name.trim(),
        productType,
        stockQuantity: productType === 'fisik' ? numStock : undefined,
        category,
        provider: provider.trim() || undefined,
        defaultSource: payloadSource,
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
      case 'voucher_fisik':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <Ticket className="w-3 h-3" />
            <span>Voucher Fisik</span>
          </span>
        );
      case 'kartu_perdana':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CreditCard className="w-3 h-3" />
            <span>Kartu Perdana</span>
          </span>
        );
      case 'aksesori_lainnya':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Headphones className="w-3 h-3" />
            <span>Aksesori & Lainnya</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Unified Sticky Header: Pencarian + Reload & Tambah Produk + Navbar Kategori (Tidak terpengaruh scrolling) */}
      <div className="sticky top-[70px] z-30 -mt-1 pt-1.5 pb-2.5 bg-slate-100/95 backdrop-blur-md">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-md shadow-slate-900/5 space-y-3">
          {/* Top Row: Opsi Pencarian + Tombol Reload + Tombol Tambah Produk Baru (Tunggal & Rapi) */}
          <div className="flex items-center gap-2.5">
            {/* Opsi Pencarian */}
            <div className="relative flex-1">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama produk, provider, atau server..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10.5 pr-9 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Tombol Reload Data */}
            <button
              type="button"
              onClick={() => {
                if (confirm('Kembalikan / Reload daftar produk ke data bawaan standar?')) {
                  onResetPresets();
                }
              }}
              className="p-2.5 sm:px-3.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border border-slate-200/70 shrink-0 cursor-pointer h-11"
              title="Reload data bawaan"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Reload</span>
            </button>

            {/* Tombol Tambah Produk Baru */}
            <button
              type="button"
              id="btn-add-master-product"
              onClick={openAddModal}
              className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center gap-2 shrink-0 cursor-pointer h-11"
            >
              <Plus className="w-4.5 h-4.5 stroke-[3]" />
              <span className="hidden xs:inline">Tambah Produk Baru</span>
              <span className="xs:hidden">Tambah</span>
            </button>
          </div>

          {/* Bottom Row: Navbar Kategori (Scrollable & Tetap di Atas) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {[
              { id: 'all', label: 'Semua Produk' },
              { id: 'pulsa_data', label: 'Pulsa & Data' },
              { id: 'voucher_fisik', label: 'Voucher Fisik' },
              { id: 'kartu_perdana', label: 'Perdana' },
              { id: 'pln_tagihan', label: 'PLN' },
              { id: 'topup_ewallet', label: 'E-Wallet' },
              { id: 'transfer_tarik', label: 'Transfer' },
              { id: 'game_tv', label: 'Game' },
              { id: 'aksesori_lainnya', label: 'Aksesori' },
            ].map((cat) => {
              const isActive = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
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
                      <span>{preset.productType === 'fisik' ? 'Tipe & Stok:' : 'Server Saldo:'}</span>
                      {preset.productType === 'fisik' ? (
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded border text-[11px] ${
                          (preset.stockQuantity ?? 0) <= 3
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          <Box className="w-3 h-3" />
                          <span>Stok: {preset.stockQuantity ?? 0} Pcs</span>
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {getAccountName(preset.defaultSource)}
                        </span>
                      )}
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
                  {editingPreset ? 'Edit Produk' : 'Tambah Produk Baru'}
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
              {/* Pilihan Tipe Produk */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipe Produk <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProductType('digital')}
                    className={`p-2.5 rounded-xl text-left border transition flex items-start gap-2.5 ${
                      productType === 'digital'
                        ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">Produk Digital / Saldo</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Memotong Saldo Server Modal</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProductType('fisik');
                      if (category === 'pulsa_data') setCategory('voucher_fisik');
                    }}
                    className={`p-2.5 rounded-xl text-left border transition flex items-start gap-2.5 ${
                      productType === 'fisik'
                        ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Box className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">Produk Fisik / Etalase</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Memotong Stok Fisik Pcs</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Nama Produk */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Produk / Layanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    productType === 'fisik'
                      ? 'Misal: Voucher Telkomsel 2.5GB 5 Hari / Kartu Perdana AXIS 10GB'
                      : 'Misal: Telkomsel Data 15GB 30 Hari / Token PLN 50K'
                  }
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
                  placeholder="Misal: Telkomsel, XL, Indosat, PLN, DANA"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Conditionally: Sumber Saldo Modal OR Jumlah Stok Fisik */}
              {productType === 'digital' ? (
                <div>
                  <AccountSelect
                    label="Sumber Saldo Modal Default"
                    accounts={accounts}
                    value={defaultSource}
                    onChange={(accKey) => setDefaultSource(accKey)}
                  />
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-indigo-950">
                      Jumlah Stok Fisik (Pcs) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-indigo-700 font-semibold">Tersedia di Etalase</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Contoh: 20"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full bg-white border border-indigo-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3.5 top-2 text-xs font-bold text-slate-400">Pcs</span>
                  </div>
                  <p className="text-[11px] text-indigo-800">
                    💡 Penjualan produk fisik akan memotong stok fisik 1 pcs tanpa memotong saldo server digital. Uang penjualan tetap masuk ke Kas Tunai Laci.
                  </p>
                </div>
              )}

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
