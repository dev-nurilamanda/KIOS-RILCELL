import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  X, 
  AlertTriangle, 
  Check 
} from 'lucide-react';
import { AccountKey, ModalAccount, BalanceTransfer } from '../types';
import { AccountSelect } from './CustomSelect';
import { formatRupiah } from '../utils/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ModalAccount[];
  cashOnHand: number;
  onTransferBalance: (
    transfer: Omit<BalanceTransfer, 'id' | 'timestamp' | 'invoiceNumber'>
  ) => boolean;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  cashOnHand,
  onTransferBalance,
}) => {
  const [transferFrom, setTransferFrom] = useState<AccountKey | 'kas_tunai' | 'pemasok_luar'>('bsi_byond');
  const [supplierName, setSupplierName] = useState<string>('');
  const [transferTo, setTransferTo] = useState<AccountKey>('wekios');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferFee, setTransferFee] = useState<string>('0');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');

  if (!isOpen) return null;

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    const amountNum = parseInt(transferAmount.replace(/[^0-9]/g, ''), 10);
    const feeNum = parseInt(transferFee.replace(/[^0-9]/g, ''), 10) || 0;

    if (isNaN(amountNum) || amountNum <= 0) {
      setTransferError('Nominal transfer harus lebih dari Rp 0');
      return;
    }

    if (transferFrom === 'pemasok_luar') {
      if (!supplierName.trim()) {
        setTransferError('Mohon masukkan Nama Pemasok / Agen / Distributor Luar');
        return;
      }
    } else {
      if (transferFrom === transferTo) {
        setTransferError('Akun asal dan akun tujuan tidak boleh sama');
        return;
      }

      // Check balance for internal accounts
      let sourceBalance = 0;
      if (transferFrom === 'kas_tunai') {
        sourceBalance = cashOnHand;
      } else {
        const srcAcc = accounts.find((a) => a.id === transferFrom);
        sourceBalance = srcAcc ? srcAcc.balance : 0;
      }

      if (amountNum + feeNum > sourceBalance) {
        setTransferError(
          `Saldo ${transferFrom === 'kas_tunai' ? 'Kas Tunai' : 'sumber'} tidak mencukupi (Tersedia: ${formatRupiah(sourceBalance)})`
        );
        return;
      }
    }

    const defaultNotes = transferFrom === 'pemasok_luar'
      ? `Top-Up dari Supplier: ${supplierName.trim()} ke ${transferTo.toUpperCase()}`
      : `Top-up modal dari ${transferFrom.toUpperCase()} ke ${transferTo.toUpperCase()}`;

    const ok = onTransferBalance({
      fromAccountId: transferFrom,
      toAccountId: transferTo,
      amount: amountNum,
      fee: feeNum,
      supplierName: transferFrom === 'pemasok_luar' ? supplierName.trim() : undefined,
      notes: transferNotes.trim() || defaultNotes,
    });

    if (ok) {
      onClose();
      setTransferAmount('');
      setTransferFee('0');
      setTransferNotes('');
      setSupplierName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-bold text-base">Pindah Saldo / Top-Up Modal</h3>
              <p className="text-[11px] text-emerald-100">Mutasi dana internal atau setoran dari pemasok/supplier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {transferError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{transferError}</span>
            </div>
          )}

          {/* Dari Akun (Sumber) */}
          <div>
            <AccountSelect
              id="select-transfer-from"
              label="Sumber Saldo (Dari):"
              accounts={accounts}
              value={transferFrom}
              onChange={(accKey) => setTransferFrom(accKey)}
              includeCash={true}
              includeSupplier={true}
              cashOnHand={cashOnHand}
              requiredAmount={transferFrom === 'pemasok_luar' ? 0 : (parseInt(transferAmount.replace(/[^0-9]/g, ''), 10) || 0)}
            />
          </div>

          {/* Input Nama Pemasok jika memilih Pemasok Luar */}
          {transferFrom === 'pemasok_luar' && (
            <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-amber-950">
                Nama Pemasok / Agen / Sumber Modal Luar *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Sales Indosat, Distributor Pulsa, Bank Luar"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400"
              />
              <p className="text-[11px] text-amber-800 font-medium">
                💡 Saldo akun tujuan akan bertambah sebesar nominal tanpa memotong saldo akun internal mana pun.
              </p>
            </div>
          )}

          {/* Ke Akun (Tujuan) */}
          <div>
            <AccountSelect
              id="select-transfer-to"
              label="Akun Tujuan Top-Up (Ke):"
              accounts={accounts}
              value={transferTo}
              onChange={(accKey) => setTransferTo(accKey)}
            />
          </div>

          {/* Nominal Transfer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nominal Transfer / Top-Up:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">Rp</span>
              <input
                type="number"
                step="1000"
                required
                placeholder="Contoh: 500000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Quick Nominal Buttons */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[100000, 250000, 500000, 1000000].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setTransferAmount(quick.toString())}
                  className="text-[11px] py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                >
                  {quick >= 1000000 ? `${quick / 1000000} Juta` : `${quick / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Biaya Admin / Fee (Opsional) */}
          {transferFrom !== 'pemasok_luar' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Biaya Admin Transfer (Jika ada):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">Rp</span>
                <input
                  type="number"
                  step="500"
                  value={transferFee}
                  onChange={(e) => setTransferFee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Keterangan / Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Catatan / Referensi Mutasi:
            </label>
            <input
              type="text"
              placeholder={
                transferFrom === 'pemasok_luar'
                  ? 'Contoh: Setoran saldo sales Indosat nota #829'
                  : 'Contoh: Top-up saldo WeKios via BSI Mobile'
              }
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Proses Pindah Saldo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
