import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Printer, 
  Share2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Smartphone, 
  Wallet, 
  Zap, 
  Landmark, 
  Gamepad2,
  Trash2,
  Check
} from 'lucide-react';
import { RilcellTransaction, ServiceCategory, AccountKey, ModalAccount, RilcellSettings } from '../types';
import { formatRupiah, formatDate, generateWhatsAppReceipt } from '../utils/formatters';

interface TransactionHistoryViewProps {
  transactions: RilcellTransaction[];
  accounts: ModalAccount[];
  settings: RilcellSettings;
  onToggleStatus: (id: string) => void;
  onSelectReceipt: (trx: RilcellTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  transactions,
  accounts,
  settings,
  onToggleStatus,
  onSelectReceipt,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | 'this_month'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return transactions.filter((trx) => {
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchInvoice = trx.invoiceNumber.toLowerCase().includes(term);
        const matchTarget = trx.targetNumber.toLowerCase().includes(term);
        const matchService = trx.serviceName.toLowerCase().includes(term);
        const matchSN = trx.snRefNumber.toLowerCase().includes(term);
        const matchCustomer = (trx.customerName || '').toLowerCase().includes(term);
        if (!matchInvoice && !matchTarget && !matchService && !matchSN && !matchCustomer) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && trx.category !== selectedCategory) {
        return false;
      }

      // Account filter
      if (selectedAccount !== 'all' && trx.sourceAccountId !== selectedAccount) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && trx.status !== selectedStatus) {
        return false;
      }

      // Date filter
      if (dateRange === 'today') {
        if (trx.timestamp < startOfToday.getTime()) return false;
      } else if (dateRange === '7days') {
        if (trx.timestamp < now - 7 * 24 * 60 * 60 * 1000) return false;
      } else if (dateRange === 'this_month') {
        const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1).getTime();
        if (trx.timestamp < startOfMonth) return false;
      }

      return true;
    });
  }, [transactions, searchTerm, selectedCategory, selectedAccount, selectedStatus, dateRange]);

  // Aggregate stats for filtered data
  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.status === 'sukses') {
          acc.totalSell += t.sellingPrice;
          acc.totalCost += t.costPrice;
          acc.totalProfit += t.profit;
          acc.successCount += 1;
        } else if (t.status === 'gagal') {
          acc.failCount += 1;
        }
        return acc;
      },
      { totalSell: 0, totalCost: 0, totalProfit: 0, successCount: 0, failCount: 0 }
    );
  }, [filteredTransactions]);

  const handleCopyWhatsApp = (trx: RilcellTransaction) => {
    const text = generateWhatsAppReceipt(trx, settings);
    navigator.clipboard.writeText(text);
    setCopiedId(trx.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getCategoryBadge = (cat: ServiceCategory) => {
    switch (cat) {
      case 'pulsa_data':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Smartphone className="w-3 h-3" />
            <span>Pulsa / Data</span>
          </span>
        );
      case 'pln_tagihan':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Zap className="w-3 h-3" />
            <span>PLN & Tagihan</span>
          </span>
        );
      case 'topup_ewallet':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Wallet className="w-3 h-3" />
            <span>Top-Up E-Wallet</span>
          </span>
        );
      case 'transfer_tarik':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Landmark className="w-3 h-3" />
            <span>Transfer Bank</span>
          </span>
        );
      case 'game_tv':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Gamepad2 className="w-3 h-3" />
            <span>Game & TV</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getAccountName = (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    return acc ? acc.name : accId.toUpperCase();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no. tujuan, nama layanan, no. invoice, atau SN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'today', label: 'Hari Ini' },
                { id: '7days', label: '7 Hari' },
                { id: 'this_month', label: 'Bulan Ini' },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  dateRange === d.id
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Account Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Kategori Layanan
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              <option value="pulsa_data">Pulsa & Paket Data</option>
              <option value="pln_tagihan">Token PLN & Tagihan</option>
              <option value="topup_ewallet">Top-Up E-Wallet</option>
              <option value="transfer_tarik">Transfer & Tarik Tunai</option>
              <option value="game_tv">Game & Kuota TV</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Sumber Saldo Modal
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="all">Semua Sumber Saldo</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Status Transaksi
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="sukses">Sukses</option>
              <option value="gagal">Gagal / Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Stats Mini Ribbon */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 px-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400 text-[10px] block">Transaksi</span>
            <span className="font-bold text-white">
              {summary.successCount} sukses {summary.failCount > 0 && `(${summary.failCount} gagal)`}
            </span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-slate-400 text-[10px] block">Total Omzet</span>
            <span className="font-bold text-emerald-400">{formatRupiah(summary.totalSell)}</span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-slate-400 text-[10px] block">Laba Bersih</span>
            <span className="font-bold text-amber-400">{formatRupiah(summary.totalProfit)}</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400">
          Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <p className="text-slate-500 font-semibold text-sm">Tidak ada transaksi yang cocok dengan filter.</p>
          <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau rentang tanggal.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu & Ref</th>
                  <th className="py-3 px-4">Layanan & Kategori</th>
                  <th className="py-3 px-4">Nomor Tujuan</th>
                  <th className="py-3 px-4">Sumber Saldo</th>
                  <th className="py-3 px-4 text-right">Modal Terpotong</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-right">Keuntungan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-slate-900 font-bold">{trx.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400">{formatDate(trx.timestamp)}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{trx.serviceName}</div>
                      <div className="mt-0.5">{getCategoryBadge(trx.category)}</div>
                      {trx.snRefNumber && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[160px]">
                          SN: {trx.snRefNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{trx.targetNumber}</div>
                      {trx.customerName && (
                        <div className="text-[11px] text-slate-500">{trx.customerName}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {getAccountName(trx.sourceAccountId)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-600">
                      {formatRupiah(trx.costPrice)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatRupiah(trx.sellingPrice)}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-emerald-600">
                      +{formatRupiah(trx.profit)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleStatus(trx.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                          trx.status === 'sukses'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                        title="Klik untuk ubah status Sukses / Gagal (Otomatis refund saldo jika gagal)"
                      >
                        {trx.status === 'sukses' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sukses</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Gagal</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCopyWhatsApp(trx)}
                          className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-lg transition"
                          title="Salin Teks Struk WhatsApp"
                        >
                          {copiedId === trx.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onSelectReceipt(trx)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition"
                          title="Cetak Struk Thermal"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredTransactions.map((trx) => (
              <div key={trx.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {trx.invoiceNumber}
                      </span>
                      <button
                        onClick={() => onToggleStatus(trx.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          trx.status === 'sukses'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {trx.status === 'sukses' ? 'Sukses' : 'Gagal'}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{formatDate(trx.timestamp)}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-900">{formatRupiah(trx.sellingPrice)}</div>
                    <div className="text-[11px] font-bold text-emerald-600">
                      Untung: +{formatRupiah(trx.profit)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="font-bold text-slate-900">{trx.serviceName}</div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tujuan: <strong className="font-mono text-slate-900">{trx.targetNumber}</strong></span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Via: {getAccountName(trx.sourceAccountId)}
                    </span>
                  </div>
                  {trx.snRefNumber && (
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      SN: {trx.snRefNumber}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="text-[11px] text-slate-500">
                    Modal: {formatRupiah(trx.costPrice)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyWhatsApp(trx)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition flex items-center gap-1 text-[11px]"
                    >
                      {copiedId === trx.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copiedId === trx.id ? 'Tersalin' : 'WA Struk'}</span>
                    </button>
                    <button
                      onClick={() => onSelectReceipt(trx)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition flex items-center gap-1 text-[11px]"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
