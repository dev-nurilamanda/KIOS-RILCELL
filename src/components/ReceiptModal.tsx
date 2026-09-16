import React, { useState } from 'react';
import { X, Printer, Check, Copy, Share2, PlusCircle, ArrowRight } from 'lucide-react';
import { Transaction, StoreSettings } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  settings: StoreSettings;
  onNewTransaction: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  settings,
  onNewTransaction,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'tunai':
        return 'TUNAI (CASH)';
      case 'qris':
        return 'QRIS NASIONAL';
      case 'debit':
        return 'KARTU DEBIT / EDC';
      case 'transfer':
        return 'TRANSFER / E-WALLET';
      default:
        return method.toUpperCase();
    }
  };

  const handleCopyText = () => {
    const text = `
*${settings.storeName.toUpperCase()}*
${settings.address}
Telp: ${settings.phone}
================================
No. Nota : ${transaction.invoiceNumber}
Tanggal  : ${formatDate(transaction.timestamp)}
Kasir    : ${transaction.cashierName}
${transaction.customerName ? `Pelanggan: ${transaction.customerName}` : ''}
${transaction.tableOrNote ? `Meja/Ket : ${transaction.tableOrNote}` : ''}
--------------------------------
${transaction.items
  .map(
    (item) =>
      `${item.product.name}\n  ${item.quantity} x ${formatRupiah(item.product.price)} = ${formatRupiah(
        item.quantity * item.product.price
      )}${item.notes ? ` (${item.notes})` : ''}`
  )
  .join('\n')}
--------------------------------
Subtotal : ${formatRupiah(transaction.subtotal)}
${transaction.discountAmount > 0 ? `Diskon   : -${formatRupiah(transaction.discountAmount)}` : ''}
${transaction.taxAmount > 0 ? `PPN (${transaction.taxRate * 100}%) : ${formatRupiah(transaction.taxAmount)}` : ''}
*TOTAL    : ${formatRupiah(transaction.total)}*
Pembayaran : ${getMethodLabel(transaction.paymentMethod)}
Bayar      : ${formatRupiah(transaction.cashPaid)}
Kembalian  : ${formatRupiah(transaction.changeAmount)}
================================
${settings.receiptFooter}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-bold text-slate-800 text-sm">Transaksi Berhasil</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          {/* Thermal Receipt Paper */}
          <div
            id="thermal-receipt"
            className="w-full max-w-[340px] bg-white text-slate-900 p-5 rounded-lg shadow-sm border border-slate-200 font-mono text-xs leading-relaxed"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-bold tracking-tight text-slate-900 uppercase">
                {settings.storeName}
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">{settings.address}</p>
              <p className="text-[11px] text-slate-600">Telp: {settings.phone}</p>
            </div>

            {/* Transaction Metadata */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Struk:</span>
                <span className="font-semibold text-slate-800">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span>{formatDate(transaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="font-semibold">{transaction.customerName}</span>
                </div>
              )}
              {transaction.tableOrNote && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Meja/Ket:</span>
                  <span>{transaction.tableOrNote}</span>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span className="truncate pr-2">{item.product.name}</span>
                    <span className="tabular-nums shrink-0">
                      {formatRupiah(item.quantity * item.product.price)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>
                      {item.quantity} {item.product.unit || 'x'} @ {formatRupiah(item.product.price)}
                    </span>
                    {item.notes && <span className="italic text-slate-400">({item.notes})</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Section */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="tabular-nums font-medium">{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon:</span>
                  <span className="tabular-nums font-medium">
                    -{formatRupiah(transaction.discountAmount)}
                  </span>
                </div>
              )}
              {transaction.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>PPN ({transaction.taxRate * 100}%):</span>
                  <span className="tabular-nums font-medium">
                    {formatRupiah(transaction.taxAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>TOTAL:</span>
                <span className="tabular-nums">{formatRupiah(transaction.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="font-semibold">{getMethodLabel(transaction.paymentMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bayar:</span>
                <span className="tabular-nums">{formatRupiah(transaction.cashPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Kembalian:</span>
                <span className="tabular-nums text-slate-900">
                  {formatRupiah(transaction.changeAmount)}
                </span>
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="py-3 flex flex-col items-center justify-center">
              <div className="flex items-center gap-[2px] h-9">
                {[2, 1, 3, 1, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1].map(
                  (w, i) => (
                    <div
                      key={i}
                      className="bg-slate-800 h-full"
                      style={{ width: `${w}px` }}
                    />
                  )
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 tracking-widest">
                {transaction.invoiceNumber}
              </span>
            </div>

            {/* Footer Message */}
            <div className="text-center text-[10px] text-slate-500 whitespace-pre-line pt-1">
              {settings.receiptFooter}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden on Print) */}
        <div className="p-4 border-t border-slate-200 bg-white no-print space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Struk (WA)</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onNewTransaction}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Transaksi Baru</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
