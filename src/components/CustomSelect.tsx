import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  Check, 
  Wallet, 
  Smartphone, 
  Zap, 
  Landmark, 
  Gamepad2, 
  AlertTriangle,
  Server,
  Building2,
  Coins,
  Truck,
  Ticket,
  CreditCard,
  Headphones,
  Package,
  Search,
  Plus,
  Box
} from 'lucide-react';
import { AccountKey, ModalAccount, ServiceCategory, QuickPresetProduct } from '../types';
import { formatRupiah } from '../utils/formatters';

// Generic Option Interface
export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeType?: 'warning' | 'success' | 'info' | 'neutral';
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  label?: string;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Pilih salah satu...',
  error = false,
  disabled = false,
  className = '',
  id,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  // Close on Escape key
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 sm:py-3.5 rounded-xl text-left text-sm sm:text-base font-semibold transition-all duration-150 ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer'
        } ${
          error
            ? 'bg-rose-50/70 border-2 border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-400/20'
            : isOpen
            ? 'bg-white border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20 text-slate-900'
            : 'bg-slate-50 hover:bg-white border border-slate-300 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-600">{selectedOption.icon}</span>
          )}
          <div className="min-w-0 flex-1 truncate">
            <span className="truncate block font-bold text-slate-900">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.sublabel && (
              <span className="text-[11px] text-slate-500 font-normal truncate block">
                {selectedOption.sublabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption?.badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                selectedOption.badgeType === 'warning'
                  ? 'bg-rose-100 text-rose-700'
                  : selectedOption.badgeType === 'success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Modern Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
          <div className="p-1.5 space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-800 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {option.icon && (
                      <span
                        className={`shrink-0 ${
                          isSelected ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {option.icon}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm truncate font-bold text-slate-900">
                          {option.label}
                        </span>
                        {option.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                              option.badgeType === 'warning'
                                ? 'bg-rose-100 text-rose-700'
                                : option.badgeType === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.sublabel && (
                        <span className="text-[11px] text-slate-500 block truncate font-normal">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized Account Select Component with Live Balances & Badges
interface AccountSelectProps {
  accounts: ModalAccount[];
  value: AccountKey | string;
  onChange: (value: any) => void;
  requiredAmount?: number;
  label?: string;
  includeCash?: boolean;
  cashOnHand?: number;
  includeSupplier?: boolean;
  includePhysicalStock?: boolean;
  hideBalance?: boolean;
  id?: string;
  error?: boolean;
  disabled?: boolean;
}

export const AccountSelect: React.FC<AccountSelectProps> = ({
  accounts,
  value,
  onChange,
  requiredAmount = 0,
  label,
  includeCash = false,
  cashOnHand = 0,
  includeSupplier = false,
  includePhysicalStock = false,
  hideBalance = false,
  id,
  error,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const getAccountIcon = (accId: string, category: string) => {
    if (accId === 'pemasok_luar') {
      return (
        <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <Truck className="w-4 h-4" />
        </span>
      );
    }
    if (accId === 'stok_fisik') {
      return (
        <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
          <Box className="w-4 h-4" />
        </span>
      );
    }
    if (accId === 'kas_tunai') {
      return (
        <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Coins className="w-4 h-4" />
        </span>
      );
    }
    if (accId === 'bsi_byond') {
      return (
        <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </span>
      );
    }
    if (category === 'server_pulsa') {
      return (
        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <Server className="w-4 h-4" />
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
        <Wallet className="w-4 h-4" />
      </span>
    );
  };

  const isSupplierSelected = value === 'pemasok_luar';
  const isPhysicalStockSelected = value === 'stok_fisik';
  const isCashSelected = value === 'kas_tunai';
  const currentAccount = accounts.find((a) => a.id === value);
  const currentBalance = isCashSelected 
    ? cashOnHand 
    : isSupplierSelected || isPhysicalStockSelected 
    ? 0 
    : (currentAccount?.balance || 0);
  const isInsufficient = !isSupplierSelected && !isPhysicalStockSelected && requiredAmount > 0 && currentBalance < requiredAmount;
  const isLow = !isSupplierSelected && !isPhysicalStockSelected && currentBalance < 100000;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs sm:text-sm font-bold text-slate-700">{label}</label>
          {!hideBalance && (
            <span
              className={`text-xs font-mono font-bold ${
                isSupplierSelected || isPhysicalStockSelected
                  ? 'text-amber-700 font-bold'
                  : isInsufficient
                  ? 'text-rose-600'
                  : isLow
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}
            >
              {isSupplierSelected 
                ? 'Modal Luar (Tanpa Potong Saldo)' 
                : isPhysicalStockSelected 
                ? 'Stok Fisik Etalase' 
                : `Saldo: ${formatRupiah(currentBalance)}`}
            </span>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 px-4 py-3 sm:py-3.5 rounded-xl text-left transition-all duration-150 ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer'
        } ${
          isInsufficient || error
            ? 'bg-rose-50/60 border-2 border-rose-400 text-rose-950 focus:ring-2 focus:ring-rose-400/20'
            : isOpen
            ? 'bg-white border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
            : 'bg-slate-50 hover:bg-white border border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {getAccountIcon(value, currentAccount?.category || '')}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                {isSupplierSelected 
                  ? '--- Pemasok / Agen / Modal Luar ---' 
                  : isPhysicalStockSelected
                  ? 'Stok Fisik (Etalase Konter)'
                  : isCashSelected 
                  ? 'Kas Tunai Laci' 
                  : (currentAccount?.name || 'Pilih Sumber Saldo')}
              </span>
              {isSupplierSelected && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 shrink-0">
                  Eksternal
                </span>
              )}
              {isPhysicalStockSelected && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-900 shrink-0">
                  Produk Fisik
                </span>
              )}
              {!hideBalance && !isSupplierSelected && !isPhysicalStockSelected && isLow && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 flex items-center gap-0.5 shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>Menipis</span>
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm text-slate-500 block truncate font-mono mt-0.5">
              {isSupplierSelected 
                ? 'Pemasok / Distributor Luar (Tanpa potong saldo)' 
                : isPhysicalStockSelected
                ? 'Potong stok fisik pcs, uang masuk ke Kas Laci'
                : hideBalance
                ? (currentAccount?.category === 'server_pulsa' ? 'Server Pulsa & Data' : currentAccount?.category === 'bank' ? 'Rekening Bank / QRIS' : 'Dompet Digital / Merchant')
                : (
                  <>Saldo: <strong className={isInsufficient ? 'text-rose-600 font-black' : 'text-slate-700'}>{formatRupiah(currentBalance)}</strong></>
                )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-80 overflow-y-auto">
          <div className="p-2 space-y-1">
            {/* Special Supplier / External Option */}
            {includeSupplier && (
              <button
                type="button"
                onClick={() => {
                  onChange('pemasok_luar');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left transition-all border ${
                  isSupplierSelected
                    ? 'bg-amber-50 border-amber-300 font-bold'
                    : 'hover:bg-amber-50/50 border-amber-200/80 bg-amber-50/20 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate">
                        --- Pemasok / Agen / Modal Luar ---
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-200 text-amber-950 shrink-0">
                        Eksternal
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 block truncate font-normal">
                      Sales Distributor, Bank Luar (Tanpa potong saldo internal)
                    </span>
                  </div>
                </div>
                {isSupplierSelected && (
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            )}

            {includePhysicalStock && (
              <button
                type="button"
                onClick={() => {
                  onChange('stok_fisik' as AccountKey);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left transition-all border ${
                  isPhysicalStockSelected
                    ? 'bg-indigo-50 border-indigo-300 font-bold'
                    : 'hover:bg-indigo-50/50 border-indigo-200/80 bg-indigo-50/20 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                    <Box className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate">
                        Stok Fisik (Etalase Konter)
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-900 shrink-0">
                        Produk Fisik
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 block truncate font-normal">
                      Voucher Fisik, Perdana Segel, Aksesori (Uang masuk ke Kas Laci)
                    </span>
                  </div>
                </div>
                {isPhysicalStockSelected && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            )}

            {includeCash && (
              <button
                type="button"
                onClick={() => {
                  onChange('kas_tunai' as AccountKey);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                  isCashSelected
                    ? 'bg-emerald-50 border border-emerald-300 font-bold'
                    : 'hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {getAccountIcon('kas_tunai', 'kas')}
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">Kas Tunai Laci</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {hideBalance ? 'Uang Tunai di Laci Kasir' : `Tersedia: ${formatRupiah(cashOnHand)}`}
                    </span>
                  </div>
                </div>
                {isCashSelected && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            )}

            {accounts.map((acc) => {
              const isSelected = acc.id === value;
              const hasEnough = requiredAmount === 0 || acc.balance >= requiredAmount;
              const isAccountLow = acc.balance < (acc.minAlertThreshold || 100000);

              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    onChange(acc.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border border-emerald-300 font-bold'
                      : 'hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {getAccountIcon(acc.id, acc.category)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {acc.name}
                        </span>
                        {!hideBalance && isAccountLow && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-700">
                            Menipis
                          </span>
                        )}
                        {!hideBalance && !hasEnough && requiredAmount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                            Kurang
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        {hideBalance ? (
                          <span className="font-sans text-slate-500">
                            {acc.category === 'server_pulsa'
                              ? 'Akun Server Pulsa & Paket Data'
                              : acc.category === 'bank'
                              ? 'Rekening Bank Transfer & QRIS'
                              : 'Dompet Digital / Merchant'}
                          </span>
                        ) : (
                          <>Saldo: <strong className={isAccountLow ? 'text-rose-600' : 'text-slate-800'}>{formatRupiah(acc.balance)}</strong></>
                        )}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Specialized Category Select Component with Modern Styling & Icons
interface CategorySelectProps {
  value: ServiceCategory;
  onChange: (value: ServiceCategory) => void;
  label?: string;
  id?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  label,
  id,
}) => {
  const categoryOptions: SelectOption<ServiceCategory>[] = [
    {
      value: 'pulsa_data',
      label: 'Pulsa & Paket Data',
      sublabel: 'Telkomsel, Indosat, XL, Tri, Axis, Smartfren',
      icon: <Smartphone className="w-4 h-4 text-blue-600" />,
    },
    {
      value: 'voucher_fisik',
      label: 'Voucher Fisik (Gosok)',
      sublabel: 'Telkomsel, Indosat, Tri, XL, Axis (Potong Stok Pcs)',
      icon: <Ticket className="w-4 h-4 text-emerald-600" />,
    },
    {
      value: 'kartu_perdana',
      label: 'Kartu Perdana Segel',
      sublabel: 'Perdana Kuota Internet & Nomor Baru (Potong Stok Pcs)',
      icon: <CreditCard className="w-4 h-4 text-indigo-600" />,
    },
    {
      value: 'pln_tagihan',
      label: 'Token PLN & Tagihan',
      sublabel: 'Token Listrik, Pasca Bayar, PDAM, BPJS',
      icon: <Zap className="w-4 h-4 text-amber-600" />,
    },
    {
      value: 'topup_ewallet',
      label: 'Top-Up E-Wallet',
      sublabel: 'DANA, GoPay, ShopeePay, OVO, LinkAja',
      icon: <Wallet className="w-4 h-4 text-teal-600" />,
    },
    {
      value: 'transfer_tarik',
      label: 'Transfer & Tarik Tunai',
      sublabel: 'BSI, BRI, BCA, Mandiri, dan Tarik Saldo',
      icon: <Landmark className="w-4 h-4 text-purple-600" />,
    },
    {
      value: 'game_tv',
      label: 'Game & Kuota TV',
      sublabel: 'Mobile Legends, Free Fire, Nex Parabola, K-Vision',
      icon: <Gamepad2 className="w-4 h-4 text-rose-600" />,
    },
    {
      value: 'aksesori_lainnya',
      label: 'Aksesori & Lainnya',
      sublabel: 'Kabel Data, Charger, Headset, Etalase (Potong Stok Pcs)',
      icon: <Headphones className="w-4 h-4 text-amber-600" />,
    },
  ];

  return (
    <CustomSelect
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      options={categoryOptions}
    />
  );
};

// Specialized Master Product Dropdown Select with Auto-fill & Search
interface ProductDropdownSelectProps {
  presets: QuickPresetProduct[];
  value: string;
  selectedCategory: ServiceCategory;
  onSelectPreset: (preset: QuickPresetProduct) => void;
  onCustomInput: (customName: string) => void;
  label?: string;
  error?: boolean;
}

export const ProductDropdownSelect: React.FC<ProductDropdownSelectProps> = ({
  presets,
  value,
  selectedCategory,
  onSelectPreset,
  onCustomInput,
  label = 'Jenis Layanan / Nama Produk *',
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter presets
  const filteredPresets = useMemo(() => {
    return presets.filter((p) => {
      if (!showAllCategories && p.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchProvider = (p.provider || '').toLowerCase().includes(q);
        return matchName || matchProvider;
      }
      return true;
    });
  }, [presets, selectedCategory, showAllCategories, searchTerm]);

  // Current selected preset if matches
  const currentMatchedPreset = presets.find((p) => p.name === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-700">{label}</label>
          {currentMatchedPreset?.productType === 'fisik' && (
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              Stok: {currentMatchedPreset.stockQuantity ?? 0} pcs
            </span>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
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
          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            {currentMatchedPreset?.productType === 'fisik' ? (
              <Box className="w-4 h-4 text-indigo-700" />
            ) : (
              <Package className="w-4 h-4 text-emerald-700" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {value || 'Pilih Produk dari Master...'}
              </span>
              {currentMatchedPreset?.provider && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 shrink-0">
                  {currentMatchedPreset.provider}
                </span>
              )}
            </div>
            {currentMatchedPreset ? (
              <span className="text-[11px] text-slate-500 block truncate">
                {currentMatchedPreset.productType === 'fisik' ? (
                  <span className="text-indigo-700 font-semibold">Produk Fisik (Stok: {currentMatchedPreset.stockQuantity ?? 0} pcs)</span>
                ) : (
                  <span>Server Modal: <strong className="text-slate-700 uppercase">{currentMatchedPreset.defaultSource}</strong></span>
                )}
                {' · Jual: '}<strong className="text-emerald-700">{formatRupiah(currentMatchedPreset.sellingPrice)}</strong>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 block truncate font-normal">
                Klik untuk memilih produk master atau ketik custom
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-96">
          {/* Search Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ketik cari produk atau nama layanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                Menampilkan: <strong>{showAllCategories ? 'Semua Kategori' : 'Kategori Aktif'}</strong> ({filteredPresets.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-emerald-700 hover:underline font-bold"
              >
                {showAllCategories ? 'Hanya Kategori Ini' : 'Lihat Semua Kategori'}
              </button>
            </div>
          </div>

          {/* Preset Options List */}
          <div className="p-2 overflow-y-auto space-y-1 divide-y divide-slate-100 flex-1">
            {/* Custom Input Option if user typed something */}
            {searchTerm.trim() && (
              <button
                type="button"
                onClick={() => {
                  onCustomInput(searchTerm.trim());
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold transition mb-1"
              >
                <Plus className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs block truncate">
                    Gunakan Nama Manual: <strong className="underline">"{searchTerm.trim()}"</strong>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-normal">
                    (Ketik manual untuk produk yang belum ada di Master)
                  </span>
                </div>
              </button>
            )}

            {filteredPresets.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                <p>Tidak ada produk master yang sesuai.</p>
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onCustomInput(searchTerm.trim());
                      setIsOpen(false);
                    }}
                    className="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700"
                  >
                    Gunakan "{searchTerm.trim()}"
                  </button>
                )}
              </div>
            ) : (
              filteredPresets.map((preset) => {
                const isSelected = preset.name === value;
                const isPhysical = preset.productType === 'fisik';
                const hasStock = (preset.stockQuantity ?? 0) > 0;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border border-emerald-300 font-bold text-emerald-950'
                        : 'hover:bg-slate-50 font-medium text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isPhysical ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isPhysical ? <Box className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {preset.name}
                          </span>
                          {preset.provider && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
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
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700 uppercase">
                              {preset.defaultSource}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>Modal: {formatRupiah(preset.costPrice)}</span>
                          <span>·</span>
                          <span className="font-bold text-emerald-700">Jual: {formatRupiah(preset.sellingPrice)}</span>
                          <span>·</span>
                          <span className="text-teal-600 font-semibold">
                            Laba: +{formatRupiah(preset.profitType === 'admin_fee' ? (preset.defaultAdminFee ?? 0) : preset.sellingPrice - preset.costPrice)}
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
        </div>
      )}
    </div>
  );
};
