import React, { useState, useEffect } from 'react';
import { X, Banknote, QrCode, CreditCard, ArrowRight, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { PaymentMethod, StoreSettings } from '../types';
import { formatRupiah } from '../utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  customerName: string;
  setCustomerName: (name: string) => void;
  tableOrNote: string;
  setTableOrNote: (val: string) => void;
  onCompletePayment: (paymentData: {
    paymentMethod: PaymentMethod;
    cashPaid: number;
    changeAmount: number;
    referenceCode?: string;
  }) => void;
  settings: StoreSettings;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  customerName,
  setCustomerName,
  tableOrNote,
  setTableOrNote,
  onCompletePayment,
  settings,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('tunai');
  const [cashInput, setCashInput] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('BCA');
  const [referenceCode, setReferenceCode] = useState<string>('');

  // Default cash input to exact amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setCashInput(total.toString());
      setReferenceCode('');
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const cashPaid = parseFloat(cashInput) || 0;
  const changeAmount = method === 'tunai' ? Math.max(0, cashPaid - total) : 0;
  const isCashInsufficient = method === 'tunai' && cashPaid < total;

  // Preset quick cash denominations
  const quickAmounts = [
    { label: 'Uang Pas', value: total },
    { label: 'Rp 10.000', value: 10000 },
    { label: 'Rp 20.000', value: 20000 },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
    { label: 'Rp 200.000', value: 200000 },
    { label: 'Rp 500.000', value: 500000 },
  ].filter((item) => item.label === 'Uang Pas' || item.value >= total);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'tunai' && cashPaid < total) {
      return;
    }
    onCompletePayment({
      paymentMethod: method,
      cashPaid: method === 'tunai' ? cashPaid : total,
      changeAmount: method === 'tunai' ? changeAmount : 0,
      referenceCode: method !== 'tunai' ? referenceCode || `${selectedBank}-${Date.now().toString().slice(-6)}` : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Proses Pembayaran</h2>
            <p className="text-xs text-slate-500">Pilih metode pembayaran dan masukkan rincian</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Total Highlight */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Total Tagihan
            </span>
            <div className="text-3xl font-extrabold text-emerald-900 mt-1">
              {formatRupiah(total)}
            </div>
          </div>

          {/* Customer & Table info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pelanggan (Opsional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Bpk. Dani"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Meja / Catatan
              </label>
              <input
                type="text"
                value={tableOrNote}
                onChange={(e) => setTableOrNote(e.target.value)}
                placeholder="Contoh: Meja 05 / Take Away"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMethod('tunai')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  method === 'tunai'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-600/20 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                <span className="text-xs">Tunai (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('qris')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  method === 'qris'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-600/20 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1 text-purple-600" />
                <span className="text-xs">QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('debit')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  method === 'debit'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-600/20 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-sky-600" />
                <span className="text-xs">Kartu Debit</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('transfer')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  method === 'transfer'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-600/20 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Building2 className="w-5 h-5 mb-1 text-amber-600" />
                <span className="text-xs">Transfer / E-Wallet</span>
              </button>
            </div>
          </div>

          {/* Conditional Method Inputs */}
          {method === 'tunai' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Uang Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    placeholder="0"
                    min={0}
                    autoFocus
                    className="w-full pl-10 pr-4 py-2 text-base font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quick denomination chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickAmounts.map((qa, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCashInput(qa.value.toString())}
                    className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 transition-colors"
                  >
                    {qa.label === 'Uang Pas' ? 'Uang Pas' : formatRupiah(qa.value)}
                  </button>
                ))}
              </div>

              {/* Kembalian Display */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Kembalian:</span>
                <span
                  className={`text-lg font-extrabold ${
                    isCashInsufficient
                      ? 'text-red-600'
                      : changeAmount > 0
                      ? 'text-emerald-600'
                      : 'text-slate-700'
                  }`}
                >
                  {isCashInsufficient ? (
                    <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Kurang {formatRupiah(total - cashPaid)}
                    </span>
                  ) : (
                    formatRupiah(changeAmount)
                  )}
                </span>
              </div>
            </div>
          )}

          {method === 'qris' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                <QrCode className="w-3.5 h-3.5" />
                QRIS Dinamis Nasional
              </div>
              
              {/* QR Code Graphics Simulation */}
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl shadow-xs border border-slate-300 flex flex-col items-center justify-center relative">
                {/* Simulated QR Pattern */}
                <div className="w-full h-full border-2 border-slate-900 p-1 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-4 border-slate-900 flex items-center justify-center">
                      <div className="w-3 h-3 bg-slate-900" />
                    </div>
                    <div className="w-8 h-8 border-4 border-slate-900 flex items-center justify-center">
                      <div className="w-3 h-3 bg-slate-900" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="bg-slate-900 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-sm">
                      QRIS
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-4 border-slate-900 flex items-center justify-center">
                      <div className="w-3 h-3 bg-slate-900" />
                    </div>
                    <div className="w-6 h-6 bg-slate-900 grid grid-cols-2 gap-1 p-1">
                      <div className="bg-white"></div>
                      <div className="bg-white"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600">
                <p className="font-semibold text-slate-800">{settings.storeName}</p>
                <p className="text-[11px] text-slate-500 font-mono">NMID: ID1020304910283</p>
                <p className="text-slate-500 mt-1">
                  Mendukung GoPay, OVO, ShopeePay, DANA, BCA Mobile, Livin Mandiri, BRImo
                </p>
              </div>
            </div>
          )}

          {method === 'debit' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Mesin / Bank EDC
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['BCA', 'Mandiri', 'BRI', 'BNI'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                        selectedBank === bank
                          ? 'border-sky-600 bg-sky-50 text-sky-700 ring-2 ring-sky-600/20'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Referensi / Approval Code (Opsional)
                </label>
                <input
                  type="text"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="Contoh: APPR-948210"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          )}

          {method === 'transfer' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tujuan Rekening / E-Wallet
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['BCA Transfer', 'Mandiri', 'GoPay/OVO', 'ShopeePay', 'DANA', 'Lainnya'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedBank(opt)}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all truncate ${
                        selectedBank === opt
                          ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-600/20'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bukti / ID Transaksi Transfer
                </label>
                <input
                  type="text"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="Contoh: TRX-TRF-09124"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isCashInsufficient}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all ${
              isCashInsufficient
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-600/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Selesaikan Pembayaran</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
