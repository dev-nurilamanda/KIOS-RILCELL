import React, { useState, useRef, useEffect } from 'react';
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
  Coins
} from 'lucide-react';
import { AccountKey, ModalAccount, ServiceCategory } from '../types';
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
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all duration-150 ${
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
  onChange: (value: AccountKey) => void;
  requiredAmount?: number;
  label?: string;
  includeCash?: boolean;
  cashOnHand?: number;
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

  const currentAccount = accounts.find((a) => a.id === value);
  const isCashSelected = value === 'kas_tunai';
  const currentBalance = isCashSelected ? cashOnHand : (currentAccount?.balance || 0);
  const isInsufficient = requiredAmount > 0 && currentBalance < requiredAmount;
  const isLow = currentBalance < 100000;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-700">{label}</label>
          <span
            className={`text-[11px] font-mono font-bold ${
              isInsufficient
                ? 'text-rose-600'
                : isLow
                ? 'text-amber-600'
                : 'text-slate-500'
            }`}
          >
            Saldo: {formatRupiah(currentBalance)}
          </span>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 ${
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
              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {isCashSelected ? 'Kas Tunai Laci' : (currentAccount?.name || 'Pilih Sumber Saldo')}
              </span>
              {isLow && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 flex items-center gap-0.5 shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>Menipis</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block truncate font-mono">
              Saldo: <strong className={isInsufficient ? 'text-rose-600 font-black' : 'text-slate-700'}>{formatRupiah(currentBalance)}</strong>
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
                      Tersedia: {formatRupiah(cashOnHand)}
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
                        {isAccountLow && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-100 text-rose-700">
                            Menipis
                          </span>
                        )}
                        {!hasEnough && requiredAmount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                            Kurang
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        Saldo: <strong className={isAccountLow ? 'text-rose-600' : 'text-slate-800'}>{formatRupiah(acc.balance)}</strong>
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
      value: 'pln_tagihan',
      label: 'Token PLN & Tagihan',
      sublabel: 'Token Listrik, Pasca Bayar, PDAM, BPJS',
      icon: <Zap className="w-4 h-4 text-amber-600" />,
    },
    {
      value: 'topup_ewallet',
      label: 'Top-Up E-Wallet',
      sublabel: 'DANA, GoPay, ShopeePay, OVO, LinkAja',
      icon: <Wallet className="w-4 h-4 text-emerald-600" />,
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
