import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  Check, 
  Package, 
  Box, 
  Sparkles, 
  Plus, 
  X, 
  Layers, 
  Ticket, 
  CreditCard, 
  Zap, 
  Wallet, 
  Landmark, 
  Gamepad2, 
  Headphones, 
  Smartphone,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { QuickPresetProduct, ServiceCategory } from '../types';
import { formatRupiah } from '../utils/formatters';

interface ProductSearchDropdownProps {
  presets: QuickPresetProduct[];
  value: string;
  selectedCategory: ServiceCategory;
  detectedProvider?: string;
  onSelectPreset: (preset: QuickPresetProduct) => void;
  onCustomInputChange: (name: string) => void;
  onOpenMasterProducts?: () => void;
  error?: boolean;
  disabled?: boolean;
}

const CATEGORY_LABELS: Record<ServiceCategory, { label: string; icon: React.ReactNode }> = {
  pulsa_data: { label: 'Pulsa & Data', icon: <Smartphone className="w-3.5 h-3.5" /> },
  voucher_fisik: { label: 'Voucher Fisik', icon: <Ticket className="w-3.5 h-3.5" /> },
  kartu_perdana: { label: 'Perdana', icon: <CreditCard className="w-3.5 h-3.5" /> },
  pln_tagihan: { label: 'PLN & Tagihan', icon: <Zap className="w-3.5 h-3.5" /> },
  topup_ewallet: { label: 'E-Wallet', icon: <Wallet className="w-3.5 h-3.5" /> },
  transfer_tarik: { label: 'Transfer', icon: <Landmark className="w-3.5 h-3.5" /> },
  game_tv: { label: 'Game & TV', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  aksesori_lainnya: { label: 'Aksesori', icon: <Headphones className="w-3.5 h-3.5" /> },
};

export const ProductSearchDropdown: React.FC<ProductSearchDropdownProps> = ({
  presets,
  value,
  selectedCategory,
  detectedProvider,
  onSelectPreset,
  onCustomInputChange,
  onOpenMasterProducts,
  error = false,
  disabled = false,
}) => {
  // Modes: 'dropdown' (pilih/search dari katalog master) vs 'manual' (ketik bebas)
  const [mode, setMode] = useState<'dropdown' | 'manual'>('dropdown');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'current' | 'all' | ServiceCategory>('current');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Detect matching preset in catalog
  const currentMatchedPreset = useMemo(() => {
    return presets.find((p) => p.name.trim().toLowerCase() === value.trim().toLowerCase());
  }, [presets, value]);

  // Filtered presets based on search query, category, and provider
  const filteredPresets = useMemo(() => {
    return presets.filter((p) => {
      // Category filter
      if (categoryFilter === 'current') {
        if (p.category !== selectedCategory) return false;
      } else if (categoryFilter !== 'all') {
        if (p.category !== categoryFilter) return false;
      }

      // Search query filter (matches name, provider, category, source)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchProvider = (p.provider || '').toLowerCase().includes(q);
        const matchSource = (p.defaultSource || '').toLowerCase().includes(q);
        const matchCat = (CATEGORY_LABELS[p.category]?.label || '').toLowerCase().includes(q);
        if (!matchName && !matchProvider && !matchSource && !matchCat) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioritize provider match if detected
      if (detectedProvider) {
        const aMatches = (a.provider || '').toLowerCase() === detectedProvider.toLowerCase();
        const bMatches = (b.provider || '').toLowerCase() === detectedProvider.toLowerCase();
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
      }
      return 0;
    });
  }, [presets, categoryFilter, selectedCategory, searchQuery, detectedProvider]);

  const handleSelect = (preset: QuickPresetProduct) => {
    onSelectPreset(preset);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSwitchToManual = (initialValue?: string) => {
    setMode('manual');
    setIsOpen(false);
    if (initialValue !== undefined) {
      onCustomInputChange(initialValue);
    }
    setTimeout(() => {
      manualInputRef.current?.focus();
    }, 50);
  };

  const handleSwitchToDropdown = () => {
    setMode('dropdown');
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Header Label & Mode Selector Toggle */}
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>Jenis Layanan / Nama Produk</span>
          <span className="text-rose-500">*</span>
        </label>

        {/* Mode Switcher Pill */}
        <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={handleSwitchToDropdown}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition ${
              mode === 'dropdown'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Pilih atau cari produk dari daftar Halaman Produk"
          >
            <Search className="w-2.5 h-2.5" />
            <span>Katalog Master ({presets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchToManual()}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition ${
              mode === 'manual'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Ketik manual nama produk bebas tanpa referensi katalog"
          >
            <Edit3 className="w-2.5 h-2.5" />
            <span>Ketik Bebas</span>
          </button>
        </div>
      </div>

      {/* MODE 1: DROPDOWN & SEARCH FROM HALAMAN PRODUK */}
      {mode === 'dropdown' ? (
        <div>
          {/* Trigger Button that looks like a sleek searchable select */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
              error
                ? 'bg-rose-50 border-2 border-rose-400 text-rose-950'
                : isOpen
                ? 'bg-white border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-slate-50 hover:bg-white border border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                currentMatchedPreset?.productType === 'fisik' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : value 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {currentMatchedPreset?.productType === 'fisik' ? (
                  <Box className="w-4 h-4" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`font-bold text-xs sm:text-sm truncate ${
                    value ? 'text-slate-900' : 'text-slate-400 font-normal'
                  }`}>
                    {value || 'Pilih Produk / Klik untuk Cari di Master...'}
                  </span>

                  {currentMatchedPreset?.provider && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 shrink-0">
                      {currentMatchedPreset.provider}
                    </span>
                  )}

                  {currentMatchedPreset?.productType === 'fisik' && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 shrink-0">
                      Stok: {currentMatchedPreset.stockQuantity ?? 0}
                    </span>
                  )}
                </div>

                {currentMatchedPreset ? (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                    <span>Modal: <strong className="text-slate-700">{formatRupiah(currentMatchedPreset.costPrice)}</strong></span>
                    <span>·</span>
                    <span>Jual: <strong className="text-emerald-700">{formatRupiah(currentMatchedPreset.sellingPrice)}</strong></span>
                    <span>·</span>
                    <span className="text-teal-700 font-bold">
                      +{formatRupiah(
                        currentMatchedPreset.profitType === 'admin_fee'
                          ? (currentMatchedPreset.defaultAdminFee ?? 0)
                          : currentMatchedPreset.sellingPrice - currentMatchedPreset.costPrice
                      )}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 block truncate">
                    Tersedia {presets.length} produk di Halaman Master
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {value && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCustomInputChange('');
                  }}
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition"
                  title="Hapus pilihan"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-emerald-600' : ''
                }`}
              />
            </div>
          </button>

          {/* DROPDOWN POPOVER PANEL */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[420px]">
              {/* Search Box Header */}
              <div className="p-3 bg-slate-50/90 border-b border-slate-200 space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Cari nama produk, provider, kuota, token, e-wallet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('current')}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
                      categoryFilter === 'current'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Kategori Terpilih ({CATEGORY_LABELS[selectedCategory]?.label})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
                      categoryFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Semua ({presets.length})
                  </button>

                  {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => {
                    const count = presets.filter((p) => p.category === catKey).length;
                    if (count === 0) return null;
                    const isActive = categoryFilter === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategoryFilter(catKey as ServiceCategory)}
                        className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition flex items-center gap-1 ${
                          isActive
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {catVal.icon}
                        <span>{catVal.label}</span>
                        <span className="text-[10px] opacity-75">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suggestions / Options List */}
              <div className="p-2 overflow-y-auto space-y-1 divide-y divide-slate-100 flex-1">
                {/* Quick option to use custom search query as manual input */}
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSwitchToManual(searchQuery.trim())}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold transition mb-1"
                  >
                    <Plus className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs block truncate">
                        Gunakan Nama Manual: <strong className="underline">"{searchQuery.trim()}"</strong>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-normal">
                        Beralih ke mode ketik bebas dengan teks ini
                      </span>
                    </div>
                  </button>
                )}

                {/* Empty State */}
                {filteredPresets.length === 0 ? (
                  <div className="py-8 px-4 text-center text-xs text-slate-500 space-y-3">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <div>
                      <p className="font-bold text-slate-700">Tidak ada produk yang cocok</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {searchQuery ? `Tidak ada produk dengan kata kunci "${searchQuery}"` : 'Belum ada produk di kategori ini.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-1">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => handleSwitchToManual(searchQuery.trim())}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition"
                        >
                          Ketik Manual "{searchQuery.trim()}"
                        </button>
                      )}

                      {categoryFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setCategoryFilter('all')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition"
                        >
                          Cari di Semua Kategori
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredPresets.map((preset) => {
                    const isSelected = preset.name.toLowerCase() === value.toLowerCase();
                    const isPhysical = preset.productType === 'fisik';
                    const hasStock = (preset.stockQuantity ?? 0) > 0;
                    const isProviderMatched = detectedProvider && (preset.provider || '').toLowerCase() === detectedProvider.toLowerCase();

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelect(preset)}
                        className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border border-emerald-300 font-bold text-emerald-950 shadow-xs'
                            : 'hover:bg-slate-50 font-medium text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isPhysical 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : isSelected 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isPhysical ? <Box className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {preset.name}
                              </span>

                              {preset.provider && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                  isProviderMatched
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {preset.provider}
                                </span>
                              )}

                              {isPhysical ? (
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                  hasStock ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  Stok: {preset.stockQuantity ?? 0} pcs
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-200/80 text-slate-700 uppercase">
                                  {preset.defaultSource}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              <span>Modal: <strong>{formatRupiah(preset.costPrice)}</strong></span>
                              <span>·</span>
                              <span className="font-bold text-emerald-700">Jual: {formatRupiah(preset.sellingPrice)}</span>
                              <span>·</span>
                              <span className="text-teal-700 font-semibold">
                                Laba: +{formatRupiah(
                                  preset.profitType === 'admin_fee'
                                    ? (preset.defaultAdminFee ?? 0)
                                    : preset.sellingPrice - preset.costPrice
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Bottom Footer Actions */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchToManual()}
                  className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ketik Bebas (Manual)</span>
                </button>

                {onOpenMasterProducts && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenMasterProducts();
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Halaman Produk</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MODE 2: KETIK MANUAL / BEBAS */
        <div className="space-y-1">
          <div className="relative">
            <input
              ref={manualInputRef}
              type="text"
              required
              placeholder="Contoh: Telkomsel Pulsa 25.000 / Top Up DANA 100K / Custom..."
              value={value}
              onChange={(e) => onCustomInputChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 pr-20 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />

            {/* Quick Button to Return to Catalog Dropdown */}
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={handleSwitchToDropdown}
                className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1 transition shadow-2xs"
                title="Buka pilihan dari Katalog Master"
              >
                <Search className="w-3 h-3" />
                <span>Katalog</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Mode ketik manual aktif. Layanan bebas tanpa harus ada di katalog.</span>
            <button
              type="button"
              onClick={handleSwitchToDropdown}
              className="text-emerald-700 font-bold hover:underline"
            >
              Buka Dropdown Master ({presets.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
