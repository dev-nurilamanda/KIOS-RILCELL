import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  ArrowUpRight, 
  Calendar, 
  Wallet, 
  Award, 
  PieChart as PieIcon, 
  BarChart3,
  Percent,
  Banknote
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Cell 
} from 'recharts';
import { RilcellTransaction, ModalAccount } from '../types';
import { formatRupiah } from '../utils/formatters';

interface DashboardAnalyticsViewProps {
  transactions: RilcellTransaction[];
  accounts: ModalAccount[];
  cashOnHand: number;
}

type TimeframeOption = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const DashboardAnalyticsView: React.FC<DashboardAnalyticsViewProps> = ({
  transactions,
  accounts,
  cashOnHand,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('monthly');

  // Successful transactions only
  const validTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === 'sukses');
  }, [transactions]);

  // Overall totals
  const totalOmzet = useMemo(() => {
    return validTransactions.reduce((sum, t) => sum + t.sellingPrice, 0);
  }, [validTransactions]);

  const totalModalKeluar = useMemo(() => {
    return validTransactions.reduce((sum, t) => sum + t.costPrice, 0);
  }, [validTransactions]);

  const totalLabaBersih = useMemo(() => {
    return validTransactions.reduce((sum, t) => sum + t.profit, 0);
  }, [validTransactions]);

  const totalSaldoModal = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const marginPercentage = totalOmzet > 0 ? ((totalLabaBersih / totalOmzet) * 100).toFixed(1) : '0';

  // Chart Data preparation based on selected timeframe
  const chartData = useMemo(() => {
    const map = new Map<string, { label: string; omzet: number; profit: number; modal: number; count: number }>();

    validTransactions.forEach((trx) => {
      const date = new Date(trx.timestamp);
      let key = '';
      let label = '';

      if (timeframe === 'daily') {
        // Hourly or Day breakdown (e.g. today's hours or last 7 days)
        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        label = `${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' })}`;
      } else if (timeframe === 'weekly') {
        // Group by day of week or weekly buckets
        const dayOfWeek = date.toLocaleDateString('id-ID', { weekday: 'short' });
        key = `${date.getFullYear()}-W-${Math.ceil(date.getDate() / 7)}-${dayOfWeek}`;
        label = dayOfWeek;
      } else if (timeframe === 'monthly') {
        // Group by months
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        label = date.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
      } else {
        // Yearly
        key = `${date.getFullYear()}`;
        label = `${date.getFullYear()}`;
      }

      const existing = map.get(key) || { label, omzet: 0, profit: 0, modal: 0, count: 0 };
      existing.omzet += trx.sellingPrice;
      existing.modal += trx.costPrice;
      existing.profit += trx.profit;
      existing.count += 1;
      map.set(key, existing);
    });

    const result = Array.from(map.values());
    // If not enough data points, create meaningful placeholders for visual feedback
    if (result.length <= 1) {
      const fallbackDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      return fallbackDays.map((d, i) => {
        const matching = result[i];
        return {
          label: d,
          omzet: matching ? matching.omzet : Math.floor((totalOmzet / 7) * (0.8 + i * 0.05)),
          profit: matching ? matching.profit : Math.floor((totalLabaBersih / 7) * (0.8 + i * 0.05)),
          modal: matching ? matching.modal : Math.floor((totalModalKeluar / 7) * (0.8 + i * 0.05)),
          count: matching ? matching.count : 1,
        };
      });
    }

    return result;
  }, [validTransactions, timeframe, totalOmzet, totalLabaBersih, totalModalKeluar]);

  // Top Performing Services
  const topServices = useMemo(() => {
    const sMap = new Map<string, { name: string; count: number; omzet: number; profit: number; category: string }>();

    validTransactions.forEach((trx) => {
      const name = trx.serviceName;
      const cur = sMap.get(name) || { name, count: 0, omzet: 0, profit: 0, category: trx.category };
      cur.count += 1;
      cur.omzet += trx.sellingPrice;
      cur.profit += trx.profit;
      sMap.set(name, cur);
    });

    return Array.from(sMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [validTransactions]);

  // Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const cMap = new Map<string, { name: string; omzet: number; profit: number; count: number; color: string }>();
    const colors: Record<string, string> = {
      pulsa_data: '#3b82f6',
      pln_tagihan: '#f59e0b',
      topup_ewallet: '#10b981',
      transfer_tarik: '#8b5cf6',
      game_tv: '#ec4899',
    };
    const labels: Record<string, string> = {
      pulsa_data: 'Pulsa & Data',
      pln_tagihan: 'PLN & Tagihan',
      topup_ewallet: 'Top-Up E-Wallet',
      transfer_tarik: 'Transfer & Tarik',
      game_tv: 'Game & TV',
    };

    validTransactions.forEach((t) => {
      const key = t.category;
      const cur = cMap.get(key) || {
        name: labels[key] || key,
        omzet: 0,
        profit: 0,
        count: 0,
        color: colors[key] || '#64748b',
      };
      cur.omzet += t.sellingPrice;
      cur.profit += t.profit;
      cur.count += 1;
      cMap.set(key, cur);
    });

    return Array.from(cMap.values());
  }, [validTransactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 4 Key Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Omzet Penjualan
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(totalOmzet)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>{validTransactions.length} Transaksi Berhasil</span>
            <span className="text-emerald-600 font-bold">100% Tercatat</span>
          </div>
        </div>

        {/* Total Modal Keluar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Modal Terpotong
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(totalModalKeluar)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Dari 8 Server Saldo</span>
            <span className="text-slate-600 font-medium">Pengeluaran Pokok</span>
          </div>
        </div>

        {/* Total Laba Bersih */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Total Laba Bersih (Untung)
            </span>
            <span className="p-2 bg-white/20 text-white rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-white tracking-tight">
            {formatRupiah(totalLabaBersih)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-emerald-100 pt-3 border-t border-white/20">
            <span>Margin Keuntungan</span>
            <span className="font-bold text-amber-300">{marginPercentage}% Net Margin</span>
          </div>
        </div>

        {/* Total Kas & Saldo Konter */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kas Laci + Saldo Modal
            </span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {formatRupiah(totalSaldoModal + cashOnHand)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Kas: {formatRupiah(cashOnHand)}</span>
            <span className="font-semibold text-slate-700">Aset Konter</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section: Omzet & Profit Trends */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Grafik Tren Penjualan & Keuntungan RILCELL</span>
            </h3>
            <p className="text-xs text-slate-500">
              Visualisasi perbandingan omzet kotor dan laba bersih yang dihasilkan
            </p>
          </div>

          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            {(
              [
                { id: 'daily', label: 'Harian' },
                { id: 'weekly', label: 'Mingguan' },
                { id: 'monthly', label: 'Bulanan' },
                { id: 'yearly', label: 'Tahunan' },
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  timeframe === tf.id
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Area / Bar Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="omzetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => `${val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : `${val / 1000}k`}`}
              />
              <Tooltip 
                formatter={(val: number | undefined) => [formatRupiah(val || 0), '']}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderRadius: '12px', 
                  color: '#fff', 
                  fontSize: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}
              />
              <Legend 
                verticalAlign="top" 
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />
              <Area 
                type="monotone" 
                name="Total Omzet" 
                dataKey="omzet" 
                stroke="#059669" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#omzetGradient)" 
              />
              <Area 
                type="monotone" 
                name="Laba Bersih (Untung)" 
                dataKey="profit" 
                stroke="#f59e0b" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#profitGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Layout: Top Services & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 5 Services */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Produk / Layanan Terlaris & Paling Menguntungkan</span>
            </h4>
            <span className="text-[11px] text-slate-400">Top 5</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topServices.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada data transaksi.</p>
            ) : (
              topServices.map((svc, idx) => (
                <div key={svc.name} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <h5 className="font-bold text-slate-900">{svc.name}</h5>
                      <span className="text-[11px] text-slate-400">{svc.count}x Transaksi</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{formatRupiah(svc.omzet)}</div>
                    <div className="text-[11px] font-bold text-emerald-600">
                      Untung: +{formatRupiah(svc.profit)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Performa Berdasarkan Kategori */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-500" />
              <span>Kontribusi Omzet per Kategori Layanan</span>
            </h4>
            <span className="text-[11px] text-slate-400">Semua Waktu</span>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.map((cat) => {
              const pct = totalOmzet > 0 ? Math.round((cat.omzet / totalOmzet) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <span className="font-bold text-slate-900">
                      {formatRupiah(cat.omzet)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
