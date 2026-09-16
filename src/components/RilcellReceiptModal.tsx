import React, { useState } from 'react';
import { Printer, Share2, Copy, Check, X, Smartphone } from 'lucide-react';
import { RilcellTransaction, RilcellSettings } from '../types';
import { formatRupiah, formatDate, generateWhatsAppReceipt } from '../utils/formatters';

interface RilcellReceiptModalProps {
  transaction: RilcellTransaction | null;
  settings: RilcellSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const RilcellReceiptModal: React.FC<RilcellReceiptModalProps> = ({
  transaction,
  settings,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppReceipt(transaction, settings);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppReceipt(transaction, settings));
    // If target number looks like a phone number, prefill to that number
    const cleanPhone = transaction.targetNumber.replace(/[^0-9]/g, '');
    let targetWa = '';
    if (cleanPhone.startsWith('08')) {
      targetWa = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('62')) {
      targetWa = cleanPhone;
    }
    const url = targetWa ? `https://wa.me/${targetWa}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print">
          <span className="font-bold text-sm">Struk Transaksi Konter</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body (Formatted for Thermal Paper 58mm/80mm) */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex justify-center">
          <div 
            id="thermal-receipt"
            className="w-full bg-white p-5 rounded-xl shadow-xs border border-slate-200 font-mono text-xs text-slate-800 space-y-3 select-text"
          >
            {/* Header */}
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-bold text-base tracking-wider text-slate-900">
                {settings.storeName.toUpperCase()}
              </h3>
              <p className="text-[10px] text-slate-500 font-sans leading-tight">
                {settings.tagline}
              </p>
              <p className="text-[10px] text-slate-400 font-sans">{settings.address}</p>
              <p className="text-[10px] text-slate-500">WA: {settings.phone}</p>
            </div>

            {/* Meta */}
            <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-400">No. Ref:</span>
                <span className="font-bold text-slate-900">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu:</span>
                <span>{formatDate(transaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kasir:</span>
                <span>{settings.cashierName}</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Layanan:</span>
                <span className="font-bold text-sm text-slate-900 block">{transaction.serviceName}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">No. Tujuan:</span>
                <span className="font-bold text-slate-900">{transaction.targetNumber}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Pelanggan:</span>
                  <span>{transaction.customerName}</span>
                </div>
              )}
              {transaction.snRefNumber && (
                <div className="mt-1 p-2 bg-slate-100 rounded text-[11px]">
                  <span className="text-slate-500 text-[10px] block">SN / TOKEN PLN:</span>
                  <span className="font-bold text-slate-900 break-all select-all">
                    {transaction.snRefNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Status:</span>
                <span className={`font-bold uppercase ${transaction.status === 'sukses' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {transaction.status}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="pt-1 text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Total Pembayaran</span>
              <span className="text-lg font-black text-slate-900">
                {formatRupiah(transaction.sellingPrice)}
              </span>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400 font-sans">
              <p>{settings.receiptFooter}</p>
              <p className="mt-1 font-mono text-[9px]">*** TERIMA KASIH ***</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2 no-print">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Teks Tersalin!' : 'Salin Teks'}</span>
            </button>
            <button
              type="button"
              onClick={handleDirectWhatsApp}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim ke WA</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Thermal (58mm/80mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
