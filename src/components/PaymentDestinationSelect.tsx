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
    <div className="space-y-3" id="payment-destination-section">
      {/* Label and Summary Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Jenis Pembayaran <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-500">
            Pilih cara pembayaran pelanggan & akun penampung saldo masuk
          </span>
        </div>
        {sellingPrice > 0 && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            +{formatRupiah(sellingPrice)} Masuk
          </span>
        )}
      </div>

      {/* 3 Payment Method Buttons */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        {/* Tunai */}
        <button
          type="button"
          onClick={() => {
            onChangePaymentMethod('tunai');
            setIsOpen(false);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
            paymentMethod === 'tunai'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Banknote className="w-4 h-4" />
            <span>Tunai</span>
          </div>
          <span className={`text-[10px] ${paymentMethod === 'tunai' ? 'text-emerald-100 font-normal' : 'text-slate-400'}`}>
            Masuk Kas Laci
          </span>
        </button>

        {/* QRIS */}
        <button
          type="button"
          onClick={() => {
            onChangePaymentMethod('qris');
            setIsOpen(false);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
            paymentMethod === 'qris'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4" />
            <span>QRIS</span>
          </div>
          <span className={`text-[10px] ${paymentMethod === 'qris' ? 'text-emerald-100 font-normal' : 'text-slate-400'}`}>
            Masuk Saldo QRIS
          </span>
        </button>

        {/* Transfer */}
        <button
          type="button"
          onClick={() => {
            onChangePaymentMethod('transfer');
            setIsOpen(false);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
            paymentMethod === 'transfer'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" />
            <span>Transfer</span>
          </div>
          <span className={`text-[10px] ${paymentMethod === 'transfer' ? 'text-emerald-100 font-normal' : 'text-slate-400'}`}>
            Bank / E-Wallet
          </span>
        </button>
      </div>

      {/* Destination Selector / Info Based on Selected Method */}
      {paymentMethod === 'tunai' ? (
        /* TUNAI: Clear visual indicator that money is stored in Cash Drawer */
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-emerald-950">
                  Tujuan: Kas Laci Konter (Uang Tunai Kasir)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                  Tunai
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 truncate">
                Uang diterima fisik dari pelanggan dan langsung menambah saldo Kas Laci.
              </p>
            </div>
          </div>
          {sellingPrice > 0 && (
            <div className="text-right shrink-0">
              <span className="text-[10px] text-emerald-700 block">Estimasi Kas Laci:</span>
              <span className="text-xs font-mono font-bold text-emerald-900">
                {formatRupiah(cashOnHand + sellingPrice)}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* QRIS or TRANSFER: Interactive Dropdown to Choose Which Account Receives the Money */
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>
                {paymentMethod === 'qris'
                  ? 'Pilih Akun Penerima QRIS (Akun Merchant)'
                  : 'Pilih Akun Penerima Transfer (Bank / E-Wallet)'}
              </span>
              <span className="text-rose-500">*</span>
            </label>
            {currentAccount && (
              <span className="text-[11px] font-mono text-slate-500">
                Saldo: <strong className="text-slate-800">{formatRupiah(currentBalance)}</strong>
              </span>
            )}
          </div>

          {/* Trigger Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
              isOpen
                ? 'bg-white border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-white hover:bg-slate-50 border border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {currentAccount ? (
                getAccountIcon(currentAccount)
              ) : (
                <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {currentAccount ? currentAccount.name : 'Pilih Akun Tujuan'}
                  </span>
                  {currentAccount && getCategoryBadge(currentAccount.category)}
                  {currentAccount?.accountNumber && (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      ({currentAccount.accountNumber})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <span>Saat ini: {formatRupiah(currentBalance)}</span>
                  {sellingPrice > 0 && (
                    <>
                      <ArrowRight className="w-3 h-3 text-emerald-600 inline" />
                      <span className="text-emerald-700 font-bold">
                        Menjadi: {formatRupiah(projectedBalance)}
                      </span>
                    </>
                  )}
                </div>
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
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 bg-slate-50 text-[11px] text-slate-500 font-semibold px-3">
                {paymentMethod === 'qris'
                  ? 'Daftar Akun Merchant / Saldo QRIS'
                  : 'Daftar Rekening Bank & Dompet Digital Penerima'}
              </div>

              <div className="p-1.5 space-y-1">
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
                      className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border border-emerald-200 font-bold'
                          : 'hover:bg-slate-50 border border-transparent font-medium text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {getAccountIcon(acc)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-slate-900 truncate font-bold">
                              {acc.name}
                            </span>
                            {getCategoryBadge(acc.category)}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                            {acc.accountNumber && <span>{acc.accountNumber} •</span>}
                            <span>Saldo: {formatRupiah(acc.balance)}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
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
                  <div className="p-4 text-center text-xs text-slate-400">
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
