import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowRightLeft, 
  AlertTriangle, 
  PlusCircle, 
  Edit3, 
  Check, 
  X, 
  TrendingUp, 
  Building2, 
  Smartphone, 
  Landmark, 
  Banknote,
  RefreshCw
} from 'lucide-react';
import { ModalAccount, AccountKey, BalanceTransfer } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';

interface SaldoModalManagerProps {
  accounts: ModalAccount[];
  cashOnHand: number;
  lowBalanceThreshold: number;
  onUpdateAccountBalance: (accountId: AccountKey, newBalance: number) => void;
  onTransferBalance: (transfer: Omit<BalanceTransfer, 'id' | 'timestamp' | 'invoiceNumber'>) => boolean;
  onUpdateCashOnHand: (newCash: number) => void;
  transferHistory: BalanceTransfer[];
}

export const SaldoModalManager: React.FC<SaldoModalManagerProps> = ({
  accounts,
  cashOnHand,
  lowBalanceThreshold,
  onUpdateAccountBalance,
  onTransferBalance,
  onUpdateCashOnHand,
  transferHistory,
}) => {
  // Modals state
  const [editingAccountId, setEditingAccountId] = useState<AccountKey | null>(null);
  const [tempBalance, setTempBalance] = useState<string>('');

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<AccountKey | 'kas_tunai'>('bsi_byond');
  const [transferTo, setTransferTo] = useState<AccountKey>('wekios');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferFee, setTransferFee] = useState<string>('0');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');

  const [isCashEditOpen, setIsCashEditOpen] = useState(false);
  const [tempCash, setTempCash] = useState<string>('');

  // Total calculations
  const totalModalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalCapitalAssets = totalModalBalance + cashOnHand;
  const lowBalanceAccounts = accounts.filter((acc) => acc.balance <= (acc.minAlertThreshold || lowBalanceThreshold));

  const startEditBalance = (acc: ModalAccount) => {
    setEditingAccountId(acc.id);
    setTempBalance(acc.balance.toString());
  };

  const saveEditBalance = (accountId: AccountKey) => {
    const val = parseInt(tempBalance.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateAccountBalance(accountId, val);
    }
    setEditingAccountId(null);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    const amountNum = parseInt(transferAmount.replace(/[^0-9]/g, ''), 10);
    const feeNum = parseInt(transferFee.replace(/[^0-9]/g, ''), 10) || 0;

    if (isNaN(amountNum) || amountNum <= 0) {
      setTransferError('Nominal transfer harus lebih dari Rp 0');
      return;
    }

    if (transferFrom === transferTo) {
      setTransferError('Akun asal dan akun tujuan tidak boleh sama');
      return;
    }

    // Check balance
    let sourceBalance = 0;
    if (transferFrom === 'kas_tunai') {
      sourceBalance = cashOnHand;
    } else {
      const srcAcc = accounts.find((a) => a.id === transferFrom);
      sourceBalance = srcAcc ? srcAcc.balance : 0;
    }

    if (amountNum + feeNum > sourceBalance) {
      setTransferError(`Saldo ${transferFrom === 'kas_tunai' ? 'Kas Tunai' : 'sumber'} tidak mencukupi (Tersedia: ${formatRupiah(sourceBalance)})`);
      return;
    }

    const ok = onTransferBalance({
      fromAccountId: transferFrom,
      toAccountId: transferTo,
      amount: amountNum,
      fee: feeNum,
      notes: transferNotes.trim() || `Top-up modal dari ${transferFrom.toUpperCase()} ke ${transferTo.toUpperCase()}`,
    });

    if (ok) {
      setIsTransferModalOpen(false);
      setTransferAmount('');
      setTransferFee('0');
      setTransferNotes('');
    }
  };

  const getAccountIcon = (category: ModalAccount['category']) => {
    switch (category) {
      case 'server_pulsa':
        return <Smartphone className="w-5 h-5" />;
      case 'bank':
        return <Landmark className="w-5 h-5" />;
      case 'merchant':
        return <Building2 className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Saldo Modal */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              Total Saldo 8 Akun Modal
            </span>
            <span className="p-2 bg-white/15 rounded-xl">
              <Wallet className="w-5 h-5 text-white" />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
            {formatRupiah(totalModalBalance)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-emerald-100/90 pt-3 border-t border-white/15">
            <span>8 Akun Konter Terdaftar</span>
            <span className="font-semibold text-white">100% Aktif</span>
          </div>
        </div>

        {/* Kas Tunai Konter */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kas Tunai Laci Konter
            </span>
            <button
              onClick={() => {
                setTempCash(cashOnHand.toString());
                setIsCashEditOpen(true);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
              title="Edit Kas Tunai"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {formatRupiah(cashOnHand)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Uang Fisik Diterima</span>
            </span>
            <button
              onClick={() => {
                setTempCash(cashOnHand.toString());
                setIsCashEditOpen(true);
              }}
              className="text-emerald-600 font-bold hover:underline"
            >
              Sesuaikan Kas
            </button>
          </div>
        </div>

        {/* Total Aset Konter & Action Button */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xs sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Aset (Saldo + Kas)
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                RILCELL
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatRupiah(totalCapitalAssets)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              id="btn-open-transfer-modal"
              onClick={() => {
                setTransferError('');
                setIsTransferModalOpen(true);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Pindah Saldo / Top-Up Modal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banner for Low Balance */}
      {lowBalanceAccounts.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-rose-100 rounded-lg text-rose-600 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900">
                Peringatan: Ada {lowBalanceAccounts.length} Akun Modal Menipis!
              </h4>
              <p className="text-xs text-rose-700 mt-1">
                Saldo akun berikut di bawah batas minimal (Rp {lowBalanceThreshold.toLocaleString('id-ID')}):{' '}
                <strong className="font-bold">
                  {lowBalanceAccounts.map((a) => `${a.name} (${formatRupiah(a.balance)})`).join(', ')}
                </strong>
                . Segera lakukan top-up modal agar transaksi pelanggan tidak terganggu.
              </p>
            </div>
            <button
              onClick={() => {
                setTransferTo(lowBalanceAccounts[0].id);
                setTransferFrom('bsi_byond');
                setIsTransferModalOpen(true);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0 transition"
            >
              Isi Sekarang
            </button>
          </div>
        </div>
      )}

      {/* 8 Modal Accounts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Daftar Akun Saldo Modal</h3>
            <p className="text-xs text-slate-500">Pantau dan kelola saldo modal di 8 penyedia layanan konter Anda</p>
          </div>
          <button
            onClick={() => {
              setTransferError('');
              setIsTransferModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Pindah Saldo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc) => {
            const isLow = acc.balance <= (acc.minAlertThreshold || lowBalanceThreshold);
            const isEditing = editingAccountId === acc.id;

            return (
              <div
                key={acc.id}
                className={`bg-white rounded-2xl p-4 border transition-all duration-200 shadow-2xs hover:shadow-md relative flex flex-col justify-between ${
                  isLow ? 'border-rose-300 ring-2 ring-rose-400/20' : 'border-slate-200'
                }`}
              >
                {/* Account Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${acc.color} text-white flex items-center justify-center shadow-xs shrink-0`}>
                        {getAccountIcon(acc.category)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{acc.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {acc.accountNumber || acc.category.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Low Alert Badge */}
                    {isLow && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1 animate-pulse shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Menipis!</span>
                      </span>
                    )}
                  </div>

                  {/* Balance Display or Edit Input */}
                  <div className="mt-4">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Saldo Saat Ini
                    </span>

                    {isEditing ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={tempBalance}
                          onChange={(e) => setTempBalance(e.target.value)}
                          className="w-full text-base font-bold bg-slate-100 border border-emerald-500 rounded-lg px-2 py-1 text-slate-900 focus:outline-none"
                          placeholder="Nominal"
                        />
                        <button
                          onClick={() => saveEditBalance(acc.id)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                          title="Simpan Saldo"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingAccountId(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                          title="Batal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className={`text-xl font-black tracking-tight ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {formatRupiah(acc.balance)}
                        </span>
                        <button
                          onClick={() => startEditBalance(acc)}
                          className="text-slate-400 hover:text-emerald-600 p-1 rounded-md transition"
                          title="Koreksi / Ubah Saldo Manual"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Card Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Batas: {formatRupiah(acc.minAlertThreshold || lowBalanceThreshold)}
                  </span>
                  <button
                    onClick={() => {
                      setTransferTo(acc.id);
                      setTransferFrom('bsi_byond');
                      setIsTransferModalOpen(true);
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1 text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Isi Saldo</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Riwayat Pindah Saldo Modal Terakhir */}
      {transferHistory && transferHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Top-Up / Pindah Saldo Modal Terbaru</span>
            </h4>
            <span className="text-xs text-slate-400">{transferHistory.length} mutasi tercatat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Dari Akun</th>
                  <th className="py-2.5 px-3">Ke Akun</th>
                  <th className="py-2.5 px-3 text-right">Nominal Pindah</th>
                  <th className="py-2.5 px-3 text-right">Biaya Admin</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transferHistory.slice(0, 5).map((th) => (
                  <tr key={th.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                      {formatDate(th.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 uppercase">
                      {th.fromAccountId === 'kas_tunai' ? 'Kas Tunai' : th.fromAccountId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-700 uppercase">
                      {th.toAccountId}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatRupiah(th.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {th.fee > 0 ? formatRupiah(th.fee) : 'Gratis'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-[200px]">
                      {th.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Pindah Saldo / Top-Up Modal */}
      {isTransferModalOpen && (
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
                  <p className="text-[11px] text-emerald-100">Mutasi dana internal antar akun modal atau kas tunai</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4">
              {transferError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {/* Dari Akun (Sumber) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sumber Saldo (Dari):
                </label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value as AccountKey | 'kas_tunai')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                >
                  <optgroup label="Akun Bank & Kas">
                    <option value="bsi_byond">BYOND by BSI (Saldo: {formatRupiah(accounts.find(a => a.id === 'bsi_byond')?.balance || 0)})</option>
                    <option value="kas_tunai">Kas Tunai Laci (Tersedia: {formatRupiah(cashOnHand)})</option>
                  </optgroup>
                  <optgroup label="E-Wallet & Merchant">
                    <option value="dana">DANA (Saldo: {formatRupiah(accounts.find(a => a.id === 'dana')?.balance || 0)})</option>
                    <option value="gopay">GoPay (Saldo: {formatRupiah(accounts.find(a => a.id === 'gopay')?.balance || 0)})</option>
                    <option value="shopeepay">ShopeePay (Saldo: {formatRupiah(accounts.find(a => a.id === 'shopeepay')?.balance || 0)})</option>
                    <option value="ovo">OVO (Saldo: {formatRupiah(accounts.find(a => a.id === 'ovo')?.balance || 0)})</option>
                    <option value="gopay_merchant">GoPay Merchant (Saldo: {formatRupiah(accounts.find(a => a.id === 'gopay_merchant')?.balance || 0)})</option>
                  </optgroup>
                  <optgroup label="Server Pulsa">
                    <option value="wekios">WeKios (Saldo: {formatRupiah(accounts.find(a => a.id === 'wekios')?.balance || 0)})</option>
                    <option value="digipos">DigiPOS Aja! (Saldo: {formatRupiah(accounts.find(a => a.id === 'digipos')?.balance || 0)})</option>
                  </optgroup>
                </select>
              </div>

              {/* Ke Akun (Tujuan) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Akun Tujuan Top-Up (Ke):
                </label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value as AccountKey)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Saldo Saat Ini: {formatRupiah(acc.balance)})
                    </option>
                  ))}
                </select>
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
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Biaya Admin Transfer (Jika ada):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="500"
                    placeholder="0"
                    value={transferFee}
                    onChange={(e) => setTransferFee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Catatan / No. Referensi:
                </label>
                <input
                  type="text"
                  placeholder="Misal: Top-up via Virtual Account BSI"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
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
      )}

      {/* Modal: Edit Kas Tunai Laci */}
      {isCashEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-slate-900">Sesuaikan Kas Tunai di Laci</h3>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan total uang fisik tunai yang saat ini ada di laci konter RILCELL.
            </p>

            <div className="mt-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nominal Kas Tunai:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  step="1000"
                  autoFocus
                  value={tempCash}
                  onChange={(e) => setTempCash(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCashEditOpen(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(tempCash.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(val) && val >= 0) {
                    onUpdateCashOnHand(val);
                  }
                  setIsCashEditOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition"
              >
                Simpan Kas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
