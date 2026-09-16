import React, { useState, useMemo } from 'react';
import { Download, Search, Printer, Calendar, Banknote, QrCode, CreditCard, Building2, TrendingUp, ShoppingCart, Users, ArrowDownRight, RefreshCw, Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';

interface ReportsViewProps {
  transactions: Transaction[];
  onSelectTransactionForReceipt: (trx: Transaction) => void;
  onClearTransactions: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  onSelectTransactionForReceipt,
  onClearTransactions,
}) => {
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | 'month' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Filter logic
  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return transactions.filter((trx) => {
      // Time filter
      if (timeFilter === 'today') {
        const trxDate = new Date(trx.timestamp);
        const todayDate = new Date();
        const isSameDay =
          trxDate.getDate() === todayDate.getDate() &&
          trxDate.getMonth() === todayDate.getMonth() &&
          trxDate.getFullYear() === todayDate.getFullYear();
        if (!isSameDay) return false;
      } else if (timeFilter === '7days') {
        if (now - trx.timestamp > 7 * oneDayMs) return false;
      } else if (timeFilter === 'month') {
        if (now - trx.timestamp > 30 * oneDayMs) return false;
      }

      // Method filter
      if (methodFilter !== 'all' && trx.paymentMethod !== methodFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchInvoice = trx.invoiceNumber.toLowerCase().includes(q);
        const matchCustomer = trx.customerName?.toLowerCase().includes(q);
        const matchCashier = trx.cashierName.toLowerCase().includes(q);
        const matchItem = trx.items.some((item) =>
          item.product.name.toLowerCase().includes(q)
        );
        if (!matchInvoice && !matchCustomer && !matchCashier && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, timeFilter, methodFilter, searchQuery]);

  // KPIs
  const totalRevenue = filteredTransactions.reduce((sum, trx) => sum + trx.total, 0);
  const totalTransactionsCount = filteredTransactions.length;
  const totalItemsSold = filteredTransactions.reduce(
    (sum, trx) => sum + trx.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const averageBasket =
    totalTransactionsCount > 0 ? Math.round(totalRevenue / totalTransactionsCount) : 0;

  // Breakdown by payment method
  const methodBreakdown = useMemo(() => {
    const breakdown = {
      tunai: 0,
      qris: 0,
      debit: 0,
      transfer: 0,
    };
    filteredTransactions.forEach((trx) => {
      if (breakdown[trx.paymentMethod] !== undefined) {
        breakdown[trx.paymentMethod] += trx.total;
      }
    });
    return breakdown;
  }, [filteredTransactions]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      'No Invoice',
      'Tanggal',
      'Kasir',
      'Pelanggan',
      'Meja/Catatan',
      'Metode Pembayaran',
      'Rincian Produk',
      'Subtotal',
      'Diskon',
      'Pajak',
      'Total Penjualan',
    ];

    const rows = filteredTransactions.map((trx) => {
      const itemsString = trx.items
        .map((item) => `${item.product.name} (${item.quantity}x)`)
        .join('; ');

      return [
        `"${trx.invoiceNumber}"`,
        `"${formatDate(trx.timestamp)}"`,
        `"${trx.cashierName}"`,
        `"${trx.customerName || '-'}"`,
        `"${trx.tableOrNote || '-'}"`,
        `"${trx.paymentMethod.toUpperCase()}"`,
        `"${itemsString}"`,
        trx.subtotal,
        trx.discountAmount,
        trx.taxAmount,
        trx.total,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Laporan_Penjualan_Kasir_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Time Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: '7days', label: '7 Hari Terakhir' },
            { id: 'month', label: '30 Hari' },
            { id: 'all', label: 'Semua Waktu' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id as any)}
              className={`flex-1 md:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeFilter === tab.id
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action buttons: Export CSV & Clear */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Excel / CSV</span>
          </button>

          {transactions.length > 0 && (
            <button
              onClick={() => {
                if (
                  confirm(
                    'Apakah Anda yakin ingin menghapus seluruh riwayat transaksi? Tindakan ini tidak dapat dibatalkan.'
                  )
                ) {
                  onClearTransactions();
                }
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
              title="Reset Riwayat Transaksi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Pendapatan</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {formatRupiah(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dari {totalTransactionsCount} transaksi berhasil
          </p>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Jumlah Transaksi</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {totalTransactionsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Nota pembayaran selesai</p>
        </div>

        {/* Total Produk Terjual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Produk Terjual</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {totalItemsSold} Unit
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total kuantitas barang</p>
        </div>

        {/* Rata-rata per Transaksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Rata-rata Pembelian</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {formatRupiah(averageBasket)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Rata-rata nilai per transaksi</p>
        </div>
      </div>

      {/* Payment Method Distribution Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Distribusi Metode Pembayaran
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Tunai (Cash)</p>
              <p className="text-sm font-bold text-slate-800">{formatRupiah(methodBreakdown.tunai)}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">QRIS</p>
              <p className="text-sm font-bold text-slate-800">{formatRupiah(methodBreakdown.qris)}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Kartu Debit</p>
              <p className="text-sm font-bold text-slate-800">{formatRupiah(methodBreakdown.debit)}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Transfer / E-Wallet</p>
              <p className="text-sm font-bold text-slate-800">{formatRupiah(methodBreakdown.transfer)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
        {/* Table Search & Method Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no nota, kasir, atau pelanggan..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Metode:
            </span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Semua Metode</option>
              <option value="tunai">Tunai</option>
              <option value="qris">QRIS</option>
              <option value="debit">Kartu Debit</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">No. Nota</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pelanggan / Meja</th>
                <th className="px-4 py-3">Item Pesanan</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3 text-right">Total Transaksi</th>
                <th className="px-4 py-3 text-center">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Belum ada riwayat transaksi pada filter ini
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {trx.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(trx.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">
                        {trx.customerName || 'Umum'}
                      </p>
                      {trx.tableOrNote && (
                        <p className="text-[11px] text-slate-400">{trx.tableOrNote}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {trx.items.length} jenis ({trx.items.reduce((s, i) => s + i.quantity, 0)}{' '}
                        pcs)
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {trx.items.map((i) => i.product.name).join(', ')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                          trx.paymentMethod === 'tunai'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : trx.paymentMethod === 'qris'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : trx.paymentMethod === 'debit'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {trx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900 tabular-nums">
                      {formatRupiah(trx.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onSelectTransactionForReceipt(trx)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Lihat & Cetak Struk"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium">Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
