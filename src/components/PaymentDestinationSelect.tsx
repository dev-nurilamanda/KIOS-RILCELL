import React, { useState, useRef, useEffect } from 'react';
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  ChevronDown, 
  Check, 
  Coins, 
  Building2, 
  Wallet, 
  Store,
  ArrowRight
} from 'lucide-react';
import { AccountKey, ModalAccount } from '../types';
import { formatRupiah } from '../utils/formatters';

interface PaymentDestinationSelectProps {
  paymentMethod: 'tunai' | 'qris' | 'transfer';
  onChangePaymentMethod: (method: 'tunai' | 'qris' | 'transfer') => void;
  destinationAccountId?: AccountKey;
  onChangeDestinationAccount: (accId: AccountKey) => void;
  accounts: ModalAccount[];
  cashOnHand?: number;
  sellingPrice: number;
}

export const PaymentDestinationSelect: React.FC<PaymentDestinationSelectProps> = ({
  paymentMethod,
  onChangePaymentMethod,
  destinationAccountId,
  onChangeDestinationAccount,
  accounts,
  cashOnHand = 0,
  sellingPrice = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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

  // Eligible accounts for QRIS (Merchant accounts or QRIS-enabled)
  const qrisAccounts = accounts.filter(
    (a) => a.category === 'merchant' || a.id.toLowerCase().includes('qris') || a.id.toLowerCase().includes('merchant')
  );
  const effectiveQrisAccounts = qrisAccounts.length > 0 
    ? qrisAccounts 
    : accounts.filter((a) => a.category === 'ewallet' || a.category === 'bank');

  // Eligible accounts for Transfer (Bank accounts and E-Wallets)
  const transferAccounts = accounts.filter(
    (a) => a.category === 'bank' || a.category === 'ewallet'
  );
  const effectiveTransferAccounts = transferAccounts.length > 0 
    ? transferAccounts 
    : accounts.filter((a) => a.id !== 'kas_tunai' && a.id !== 'stok_fisik');

  // Auto-select sensible destination if none or invalid when switching methods
  useEffect(() => {
    if (paymentMethod === 'qris') {
      const isCurrentValid = effectiveQrisAccounts.some((a) => a.id === destinationAccountId);
      if (!isCurrentValid && effectiveQrisAccounts.length > 0) {
        onChangeDestinationAccount(effectiveQrisAccounts[0].id);
      }
    } else if (paymentMethod === 'transfer') {
      const isCurrentValid = effectiveTransferAccounts.some((a) => a.id === destinationAccountId);
      if (!isCurrentValid && effectiveTransferAccounts.length > 0) {
        // Prioritize bank account if available, else ewallet
        const defaultBank = effectiveTransferAccounts.find((a) => a.category === 'bank') || effectiveTransferAccounts[0];
        onChangeDestinationAccount(defaultBank.id);
      }
    }
  }, [paymentMethod, effectiveQrisAccounts, effectiveTransferAccounts, destinationAccountId, onChangeDestinationAccount]);

  // Current selected account
  const activeAccountList = paymentMethod === 'qris' ? effectiveQrisAccounts : effectiveTransferAccounts;
  const currentAccount = activeAccountList.find((a) => a.id === destinationAccountId) || activeAccountList[0];
  const currentBalance = currentAccount ? currentAccount.balance : 0;
  const projectedBalance = currentBalance + (sellingPrice > 0 ? sellingPrice : 0);

  const getAccountIcon = (acc: ModalAccount) => {
    if (acc.category === 'bank') {
      return (
        <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </span>
      );
    }
    if (acc.category === 'merchant' || acc.id.toLowerCase().includes('qris')) {
      return (
        <span className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
          <Store className="w-4 h-4" />
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
        <Wallet className="w-4 h-4" />
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'bank':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-800">Bank</span>;
      case 'merchant':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800">Merchant QRIS</span>;
      case 'ewallet':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">E-Wallet</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">Akun Saldo</span>;
    }
  };

  return (
    <div className="space-y-2" id="payment-destination-section">
      {/* Label and Selected Info */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
          <span>Jenis Pembayaran</span>
          <span className="text-rose-500">*</span>
        </label>
        {sellingPrice > 0 && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            +{formatRupiah(sellingPrice)} Masuk
          </span>
        )}
      </div>

      {/* 3 Payment Method Buttons */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        {/* Tunai */}
        <button
          type="button"
          onClick={() => {
            onChangePaymentMethod('tunai');
            setIsOpen(false);
          }}
          className={`py-2.5 sm:py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            paymentMethod === 'tunai'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
          }`}
        >
          <Banknote className="w-4 h-4 shrink-0" />
          <span>Tunai (Laci)</span>
        </button>

        {/* QRIS */}
        <button
          type="button"
          onClick={() => {
            onChangePaymentMethod('qris');
            setIsOpen(false);
          }}
          className={`py-2.5 sm:py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            paymentMethod === 'qris'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
          }`}
        >
          <QrCode className="w-4 h-4 shrink-0" />
          <span>QRIS</span>
        </button>

        {/* Transfer */}
        <button
          type="button"
          onClick={() => {
            onChangePaymentMethod('transfer');
            setIsOpen(false);
          }}
          className={`py-2.5 sm:py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            paymentMethod === 'transfer'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>Transfer</span>
        </button>
      </div>

      {/* Destination Selector / Info Based on Selected Method */}
      {paymentMethod === 'tunai' ? (
        /* TUNAI: Spacious one-line indicator */
        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold min-w-0">
            <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Masuk Kas Laci Tunai</span>
          </div>
          {sellingPrice > 0 && (
            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
              Est. Laci: {formatRupiah(cashOnHand + sellingPrice)}
            </span>
          )}
        </div>
      ) : (
        /* QRIS or TRANSFER: Compact Dropdown */
        <div className="relative" ref={dropdownRef}>
          {/* Trigger Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl text-left transition-all duration-150 cursor-pointer text-xs sm:text-sm ${
              isOpen
                ? 'bg-white border border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-slate-50 hover:bg-white border border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {currentAccount ? (
                getAccountIcon(currentAccount)
              ) : (
                <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-3.5 h-3.5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 truncate">
                    {currentAccount ? currentAccount.name : 'Pilih Akun Penerima'}
                  </span>
                  {currentAccount && getCategoryBadge(currentAccount.category)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  Saldo: {formatRupiah(currentBalance)}
                  {sellingPrice > 0 && (
                    <span className="text-emerald-700 font-bold ml-1">
                      → {formatRupiah(projectedBalance)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180 text-emerald-600' : ''
              }`}
            />
          </button>

          {/* Popover Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto">
              <div className="p-1.5 border-b border-slate-100 bg-slate-50 text-[10px] text-slate-500 font-bold px-2.5">
                {paymentMethod === 'qris'
                  ? 'Pilih Akun Merchant / Saldo QRIS'
                  : 'Pilih Rekening Bank / E-Wallet Penerima'}
              </div>

              <div className="p-1 space-y-0.5">
                {activeAccountList.map((acc) => {
                  const isSelected = acc.id === destinationAccountId;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        onChangeDestinationAccount(acc.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border border-emerald-200 font-bold'
                          : 'hover:bg-slate-50 border border-transparent font-medium text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getAccountIcon(acc)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-900 truncate font-bold">
                              {acc.name}
                            </span>
                            {getCategoryBadge(acc.category)}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Saldo: {formatRupiah(acc.balance)}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      ) : (
                        sellingPrice > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 shrink-0 font-mono">
                            +{formatRupiah(sellingPrice)}
                          </span>
                        )
                      )}
                    </button>
                  );
                })}

                {activeAccountList.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Tidak ada akun yang sesuai kategori ini.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
