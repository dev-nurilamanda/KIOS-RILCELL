import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  Award, 
  PieChart as PieIcon, 
  BarChart3,
  Banknote,
  Coins,
  QrCode,
  CreditCard,
  Layers,
  Clock,
  Users,
  ShieldAlert,
  Info,
  Calendar,
  ArrowUpRight
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
import { RilcellTransaction, ModalAccount, CustomerRecord } from '../types';
import { formatRupiah } from '../utils/formatters';

interface DashboardAnalyticsViewProps {
  transactions: RilcellTransaction[];
  accounts: ModalAccount[];
  cashOnHand: number;
  customers?: CustomerRecord[];
}

type TimeframeOption = 'daily' | 'weekly' | 'monthly' | 'yearly';
type AnalyticsTab = 'semua' | 'arus_kas' | 'modal_server' | 'margin' | 'pelanggan' | 'admin_fee';

export const DashboardAnalyticsView: React.FC<DashboardAnalyticsViewProps> = ({
  transactions,
  accounts,
  cashOnHand,
  customers = [],
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('monthly');
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsTab>('semua');

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

  // ==========================================
  // 1. ANALISIS ARUS KAS & METODE PEMBAYARAN
  // ==========================================
  const paymentBreakdown = useMemo(() => {
    let tunaiOmzet = 0;
    let tunaiProfit = 0;
    let tunaiCount = 0;

    let qrisOmzet = 0;
    let qrisProfit = 0;
    let qrisCount = 0;

    let transferOmzet = 0;
    let transferProfit = 0;
    let transferCount = 0;

    validTransactions.forEach((t) => {
      const method = t.paymentMethod || 'tunai';
      if (method === 'tunai') {
        tunaiOmzet += t.sellingPrice;
        tunaiProfit += t.profit;
        tunaiCount += 1;
      } else if (method === 'qris') {
        qrisOmzet += t.sellingPrice;
        qrisProfit += t.profit;
        qrisCount += 1;
      } else if (method === 'transfer') {
        transferOmzet += t.sellingPrice;
        transferProfit += t.profit;
        transferCount += 1;
      }
    });

    const totalCalculated = tunaiOmzet + qrisOmzet + transferOmzet;

    return [
      {
        id: 'tunai',
        label: 'Tunai (Laci Kas)',
        omzet: tunaiOmzet,
        profit: tunaiProfit,
        count: tunaiCount,
        pct: totalCalculated > 0 ? Math.round((tunaiOmzet / totalCalculated) * 100) : 0,
        icon: Banknote,
        color: '#10b981',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        desc: 'Uang fisik di konter, siap langsung dipakai belanja saldo kasir'
      },
      {
        id: 'qris',
        label: 'QRIS Statis/Dinami',
        omzet: qrisOmzet,
        profit: qrisProfit,
        count: qrisCount,
        pct: totalCalculated > 0 ? Math.round((qrisOmzet / totalCalculated) * 100) : 0,
        icon: QrCode,
        color: '#3b82f6',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
        desc: 'Masuk rekening merchant/e-wallet, ada jeda settlement / MDR'
      },
      {
        id: 'transfer',
        label: 'Transfer Bank / E-Wallet',
        omzet: transferOmzet,
        profit: transferProfit,
        count: transferCount,
        pct: totalCalculated > 0 ? Math.round((transferOmzet / totalCalculated) * 100) : 0,
        icon: CreditCard,
        color: '#8b5cf6',
        bgColor: 'bg-purple-50 dark:bg-purple-950/40',
        textColor: 'text-purple-700 dark:text-purple-300',
        borderColor: 'border-purple-200 dark:border-purple-800',
        desc: 'Masuk langsung ke rekening Bank BSI, DANA, GoPay konter'
      }
    ];
  }, [validTransactions]);

  // ==========================================
  // 2. PERPUTARAN MODAL SERVER (CAPITAL TURNOVER)
  // ==========================================
  const accountTurnoverBreakdown = useMemo(() => {
    const map = new Map<string, {
      account: ModalAccount;
      spentModal: number;
      omzetGenerated: number;
      profitGenerated: number;
      trxCount: number;
    }>();

    // Init accounts
    accounts.forEach((acc) => {
      map.set(acc.id, {
        account: acc,
        spentModal: 0,
        omzetGenerated: 0,
        profitGenerated: 0,
        trxCount: 0
      });
    });

    // Populate from transactions
    validTransactions.forEach((trx) => {
      const entry = map.get(trx.sourceAccountId);
      if (entry) {
        entry.spentModal += trx.costPrice;
        entry.omzetGenerated += trx.sellingPrice;
        entry.profitGenerated += trx.profit;
        entry.trxCount += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.spentModal - a.spentModal);
  }, [accounts, validTransactions]);

  // ==========================================
  // 3. KESEHATAN MARGIN & PERFORMA KATEGORI
  // ==========================================
  const categoryHealth = useMemo(() => {
    const cMap = new Map<string, {
      key: string;
      name: string;
      omzet: number;
      modal: number;
      profit: number;
      count: number;
      color: string;
    }>();

    const colors: Record<string, string> = {
      pulsa_data: '#3b82f6',
      voucher_fisik: '#059669',
      kartu_perdana: '#0d9488',
      pln_tagihan: '#f59e0b',
      topup_ewallet: '#10b981',
      transfer_tarik: '#8b5cf6',
      game_tv: '#ec4899',
      aksesori_lainnya: '#64748b'
    };

    const labels: Record<string, string> = {
      pulsa_data: 'Pulsa & Paket Data',
      voucher_fisik: 'Voucher Fisik / Gesek',
      kartu_perdana: 'Kartu Perdana',
      pln_tagihan: 'PLN & Tagihan PPOB',
      topup_ewallet: 'Top-Up E-Wallet',
      transfer_tarik: 'Transfer & Tarik Tunai',
      game_tv: 'Voucher Game & TV',
      aksesori_lainnya: 'Aksesoris & Lainnya'
    };

    validTransactions.forEach((t) => {
      const key = t.category;
      const cur = cMap.get(key) || {
        key,
        name: labels[key] || key,
        omzet: 0,
        modal: 0,
        profit: 0,
        count: 0,
        color: colors[key] || '#64748b',
      };
      cur.omzet += t.sellingPrice;
      cur.modal += t.costPrice;
      cur.profit += t.profit;
      cur.count += 1;
      cMap.set(key, cur);
    });

    return Array.from(cMap.values())
      .map((item) => {
        const marginPct = item.omzet > 0 ? ((item.profit / item.omzet) * 100).toFixed(1) : '0';
        const avgProfitPerTrx = item.count > 0 ? Math.round(item.profit / item.count) : 0;
        return {
          ...item,
          marginPct: parseFloat(marginPct),
          avgProfitPerTrx,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [validTransactions]);

  // ==========================================
  // 4. POLA JAM SIBUK & PELANGGAN SETIA
  // ==========================================
  const hourlyHeatmap = useMemo(() => {
    // 24 hours slots
    const hours = Array.from({ length: 24 }, (_, i) => {
      return {
        hour: `${String(i).padStart(2, '0')}:00`,
        shortHour: `${i}`,
        count: 0,
        omzet: 0,
        profit: 0
      };
    });

    validTransactions.forEach((trx) => {
      const date = new Date(trx.timestamp);
      const h = date.getHours();
      if (hours[h]) {
        hours[h].count += 1;
        hours[h].omzet += trx.sellingPrice;
        hours[h].profit += trx.profit;
      }
    });

    return hours;
  }, [validTransactions]);

  const peakHourSummary = useMemo(() => {
    let maxCount = 0;
    let peakHourLabel = '-';
    hourlyHeatmap.forEach((h) => {
      if (h.count > maxCount) {
        maxCount = h.count;
        peakHourLabel = `${h.hour} - ${String(parseInt(h.shortHour) + 1).padStart(2, '0')}:00`;
      }
    });
    return { peakHourLabel, maxCount };
  }, [hourlyHeatmap]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone: string;
      trxCount: number;
      totalOmzet: number;
      totalProfit: number;
      favoriteCategory: string;
    }>();

    validTransactions.forEach((trx) => {
      // Identity key: customerName if available, otherwise targetNumber
      const name = trx.customerName?.trim() || trx.targetNumber || 'Umum';
      const phone = trx.targetNumber || '-';
      const existing = map.get(name) || {
        name,
        phone,
        trxCount: 0,
        totalOmzet: 0,
        totalProfit: 0,
        favoriteCategory: trx.category
      };

      existing.trxCount += 1;
      existing.totalOmzet += trx.sellingPrice;
      existing.totalProfit += trx.profit;
      map.set(name, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 6);
  }, [validTransactions]);

  // ==========================================
  // 5. ESTIMASI BIAYA ADMIN & POTONGAN MDR QRIS
  // ==========================================
  const feeAnalysis = useMemo(() => {
    let qrisGross = 0;
    let qrisMdrEstimate = 0; // standard 0.3% untuk UMI / non-subsidi
    let transferAdminEarned = 0;

    validTransactions.forEach((t) => {
      if (t.paymentMethod === 'qris') {
        qrisGross += t.sellingPrice;
        // Biaya MDR rata-rata 0.3%
        qrisMdrEstimate += Math.round(t.sellingPrice * 0.003);
      }
      if (t.profitType === 'admin_fee' || t.adminFee > 0) {
        transferAdminEarned += t.adminFee;
      }
    });

    const netProfitAfterEstimatedMdr = Math.max(0, totalLabaBersih - qrisMdrEstimate);

    return {
      qrisGross,
      qrisMdrEstimate,
      transferAdminEarned,
      netProfitAfterEstimatedMdr
    };
  }, [validTransactions, totalLabaBersih]);

  // Chart Data preparation based on selected timeframe
  const chartData = useMemo(() => {
    if (validTransactions.length === 0) {
      return [];
    }

    const sortedTrx = [...validTransactions].sort((a, b) => a.timestamp - b.timestamp);

    if (timeframe === 'daily') {
      const dayMap = new Map<string, { label: string; dateSort: number; omzet: number; profit: number; modal: number; count: number }>();

      sortedTrx.forEach((trx) => {
        const d = new Date(trx.timestamp);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        const label = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;

        const existing = dayMap.get(key) || {
          label,
          dateSort: new Date(yyyy, d.getMonth(), d.getDate()).getTime(),
          omzet: 0,
          profit: 0,
          modal: 0,
          count: 0,
        };
        existing.omzet += trx.sellingPrice;
        existing.modal += trx.costPrice;
        existing.profit += trx.profit;
        existing.count += 1;
        dayMap.set(key, existing);
      });

      return Array.from(dayMap.values()).sort((a, b) => a.dateSort - b.dateSort);
    }

    if (timeframe === 'weekly') {
      const weekMap = new Map<string, { label: string; weekSort: number; omzet: number; profit: number; modal: number; count: number }>();

      sortedTrx.forEach((trx) => {
        const d = new Date(trx.timestamp);
        const dayOfWeek = (d.getDay() + 6) % 7;
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const key = `${startOfWeek.getFullYear()}-${startOfWeek.getMonth() + 1}-${startOfWeek.getDate()}`;
        const label = `${startOfWeek.getDate()} ${startOfWeek.toLocaleString('id-ID', { month: 'short' })}`;

        const existing = weekMap.get(key) || {
          label: `Mgg ${label}`,
          weekSort: startOfWeek.getTime(),
          omzet: 0,
          profit: 0,
          modal: 0,
          count: 0,
        };
        existing.omzet += trx.sellingPrice;
        existing.modal += trx.costPrice;
        existing.profit += trx.profit;
        existing.count += 1;
        weekMap.set(key, existing);
      });

      return Array.from(weekMap.values()).sort((a, b) => a.weekSort - b.weekSort);
    }

    if (timeframe === 'monthly') {
      const monthMap = new Map<string, { label: string; monthSort: number; omzet: number; profit: number; modal: number; count: number }>();

      sortedTrx.forEach((trx) => {
        const d = new Date(trx.timestamp);
        const yyyy = d.getFullYear();
        const mm = d.getMonth();
        const key = `${yyyy}-${mm}`;
        const label = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });

        const existing = monthMap.get(key) || {
          label,
          monthSort: new Date(yyyy, mm, 1).getTime(),
          omzet: 0,
          profit: 0,
          modal: 0,
          count: 0,
        };
        existing.omzet += trx.sellingPrice;
        existing.modal += trx.costPrice;
        existing.profit += trx.profit;
        existing.count += 1;
        monthMap.set(key, existing);
      });

      return Array.from(monthMap.values()).sort((a, b) => a.monthSort - b.monthSort);
    }

    // Yearly
    const yearMap = new Map<string, { label: string; yearSort: number; omzet: number; profit: number; modal: number; count: number }>();
    sortedTrx.forEach((trx) => {
      const d = new Date(trx.timestamp);
      const yyyy = d.getFullYear();
      const key = `${yyyy}`;
      const label = `${yyyy}`;

      const existing = yearMap.get(key) || {
        label,
        yearSort: yyyy,
        omzet: 0,
        profit: 0,
        modal: 0,
        count: 0,
      };
      existing.omzet += trx.sellingPrice;
      existing.modal += trx.costPrice;
      existing.profit += trx.profit;
      existing.count += 1;
      yearMap.set(key, existing);
    });

    return Array.from(yearMap.values()).sort((a, b) => a.yearSort - b.yearSort);
  }, [validTransactions, timeframe]);

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
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }, [validTransactions]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* 1. Unified Compact 4-in-1 Performance & Asset Summary Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ringkasan Finansial RILCELL
            </span>
            <span className="px-2 py-0.2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-bold rounded-full">
              {validTransactions.length} Trx Sukses
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            Akumulasi Realtime
          </span>
        </div>

        {/* 4 Metric Compact Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* 1. Omzet Penjualan */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-2.5 sm:p-3 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">
                Total Omzet
              </span>
              <span className="p-1 bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-md shrink-0">
                <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </div>
            <div className="mt-1.5">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                {formatRupiah(totalOmzet)}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate mt-0.5">
                Nilai Penjualan Kotor
              </div>
            </div>
          </div>

          {/* 2. Modal Terpotong */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-2.5 sm:p-3 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">
                Modal Terpotong
              </span>
              <span className="p-1 bg-rose-100/80 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-md shrink-0">
                <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </div>
            <div className="mt-1.5">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                {formatRupiah(totalModalKeluar)}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate mt-0.5">
                Pengeluaran Pokok Saldo
              </div>
            </div>
          </div>

          {/* 3. Laba Bersih */}
          <div className="bg-emerald-50/90 dark:bg-emerald-950/40 rounded-xl p-2.5 sm:p-3 border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-tight truncate">
                Laba Bersih (Cuan)
              </span>
              <span className="p-1 bg-emerald-600 text-white rounded-md shrink-0">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </div>
            <div className="mt-1.5">
              <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
                {formatRupiah(totalLabaBersih)}
              </div>
              <div className="text-[9px] sm:text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold truncate mt-0.5">
                Margin Rata-rata: {marginPercentage}%
              </div>
            </div>
          </div>

          {/* 4. Kas Laci + Saldo Modal (Total Aset) */}
          <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-2.5 sm:p-3 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">
                Aset (Kas + Saldo)
              </span>
              <span className="p-1 bg-purple-100/80 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 rounded-md shrink-0">
                <Banknote className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </div>
            <div className="mt-1.5">
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                {formatRupiah(totalSaldoModal + cashOnHand)}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate mt-0.5">
                Kas: {formatRupiah(cashOnHand)} • Saldo: {formatRupiah(totalSaldoModal)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER NAVIGASI TAB MODUL BISNIS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            { id: 'semua', label: 'Ringkasan & Tren', icon: BarChart3 },
            { id: 'arus_kas', label: '1. Arus Kas & Metode Bayar', icon: Banknote },
            { id: 'modal_server', label: '2. Modal Server', icon: Layers },
            { id: 'margin', label: '3. Margin Kategori', icon: PieIcon },
            { id: 'pelanggan', label: '4. Pelanggan & Jam Sibuk', icon: Users },
            { id: 'admin_fee', label: '5. Biaya & Fee QRIS', icon: Coins },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION: RINGKASAN & TREN GRAFIK UTAMA */}
      {/* ========================================================================= */}
      {(activeSubTab === 'semua') && (
        <div className="space-y-4 sm:space-y-5">
          {/* Main Chart Section: Omzet & Profit Trends */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <span>Grafik Tren Penjualan & Keuntungan RILCELL</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visualisasi perbandingan omzet kotor dan laba bersih yang dihasilkan
                </p>
              </div>

              {/* Timeframe Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-start sm:self-auto overflow-x-auto no-scrollbar">
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
                    className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      timeframe === tf.id
                        ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 w-full pt-2">
              {chartData.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <BarChart3 className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Data Transaksi</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Grafik omzet dan keuntungan akan otomatis terbentuk secara riil begitu Anda mulai mencatat transaksi di menu Kasir.
                  </p>
                </div>
              ) : (
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
              )}
            </div>
          </div>

          {/* Two Column Layout: Top Services & Quick Cash Flow Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top 5 Services */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Produk / Layanan Paling Menguntungkan</span>
                </h4>
                <span className="text-[11px] text-slate-400">Top 5 Cuan</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {topServices.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Belum ada data transaksi yang tercatat.</p>
                ) : (
                  topServices.map((svc, idx) => (
                    <div key={svc.name} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 text-xs">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 dark:text-white truncate">{svc.name}</h5>
                          <span className="text-[11px] text-slate-400">{svc.count}x Transaksi</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatRupiah(svc.profit)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Omzet {formatRupiah(svc.omzet)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Method Snapshot */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Komposisi Arus Uang Masuk</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('arus_kas')}
                  className="text-[11px] text-emerald-600 hover:underline font-bold"
                >
                  Detail &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {paymentBreakdown.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-slate-500" />
                          {item.label}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatRupiah(item.omzet)} ({item.pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.pct > 0 ? Math.max(3, item.pct) : 0}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DETAIL ARUS KAS & METODE PEMBAYARAN */}
      {/* ========================================================================= */}
      {(activeSubTab === 'arus_kas' || activeSubTab === 'semua') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>1. Analisis Arus Kas & Likuiditas Riil Konter</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Memastikan uang hasil jualan tidak macet di rekening dan saldo kas laci selalu siap untuk belanja stok
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Kas Laci Saat Ini: {formatRupiah(cashOnHand)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {paymentBreakdown.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-4 border ${item.borderColor} ${item.bgColor} flex flex-col justify-between space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.count} Transaksi</span>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {item.pct}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      {formatRupiah(item.omzet)}
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                      <span>Laba Terkumpul:</span>
                      <span>+{formatRupiah(item.profit)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PERPUTARAN MODAL SERVER (CAPITAL TURNOVER) */}
      {/* ========================================================================= */}
      {(activeSubTab === 'modal_server' || activeSubTab === 'semua') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
                <span>2. Produktivitas & Perputaran Modal per Server</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Melihat server mana yang modalnya berputar paling cepat (*Fast-Moving Capital*) dan menghasilkan cuan tertinggi
              </p>
            </div>
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800">
              Total Saldo Mengendap: {formatRupiah(totalSaldoModal)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Akun / Server</th>
                  <th className="py-2.5 px-3 text-right">Sisa Saldo</th>
                  <th className="py-2.5 px-3 text-right">Modal Terputar</th>
                  <th className="py-2.5 px-3 text-right">Laba Dihasilkan</th>
                  <th className="py-2.5 px-3 text-center">Frekuensi</th>
                  <th className="py-2.5 px-3 text-center">Status Putaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accountTurnoverBreakdown.map((item) => {
                  const turnoverRatio = item.account.balance > 0 ? (item.spentModal / item.account.balance).toFixed(1) : '-';
                  const isFastMoving = item.spentModal > (item.account.balance * 0.5) && item.trxCount > 0;
                  return (
                    <tr key={item.account.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.account.color }}
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {item.account.name}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">
                              {item.account.category.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(item.account.balance)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatRupiah(item.spentModal)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatRupiah(item.profitGenerated)}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                        {item.trxCount}x
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.trxCount === 0
                            ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                            : isFastMoving
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        }`}>
                          {item.trxCount === 0 ? 'Belum Ada Transaksi' : isFastMoving ? '⚡ Sangat Aktif' : '🐢 Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. KESEHATAN MARGIN & PERFORMA KATEGORI */}
      {/* ========================================================================= */}
      {(activeSubTab === 'margin' || activeSubTab === 'semua') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-indigo-600" />
                <span>3. Kesehatan Margin Keuntungan per Kategori</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Membedakan kategori volume tinggi vs kategori margin tebal untuk strategi penetapan harga
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              Rata-rata Margin: {marginPercentage}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categoryHealth.map((cat) => {
              const isThickMargin = cat.marginPct >= 10;
              return (
                <div
                  key={cat.key}
                  className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {cat.name}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                      isThickMargin
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                    }`}>
                      {cat.marginPct}% Margin
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      Laba: <span className="text-emerald-600 dark:text-emerald-400">+{formatRupiah(cat.profit)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Omzet: {formatRupiah(cat.omzet)}</span>
                      <span>({cat.count} Trx)</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Rata-rata untung/trx:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">+{formatRupiah(cat.avgProfitPerTrx)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. POLA JAM SIBUK & TOP PELANGGAN */}
      {/* ========================================================================= */}
      {(activeSubTab === 'pelanggan' || activeSubTab === 'semua') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Heatmap / Pola Jam Ramai */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Pola Jam Ramai Transaksi (Peak Hours)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribusi waktu keramaian pelanggan konter sepanjang 24 jam
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                Puncak: {peakHourSummary.peakHourLabel}
              </span>
            </div>

            <div className="h-48 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyHeatmap} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="shortHour" 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fontSize: 9, fill: '#64748b' }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    formatter={(val: number | undefined) => [`${val || 0} Transaksi`, 'Frekuensi']}
                    labelFormatter={(label) => `Pukul ${label}:00`}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '8px', 
                      color: '#fff', 
                      fontSize: '11px',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    {hourlyHeatmap.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.count === peakHourSummary.maxCount && entry.count > 0 ? '#10b981' : '#f59e0b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Jam Paling Ramai
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Jam Normal
              </span>
            </div>
          </div>

          {/* Top Pelanggan Setia */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Pelanggan Paling Bernilai (Top Loyal)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pelanggan dengan sumbangan keuntungan terbesar untuk RILCELL
                </p>
              </div>
              <span className="text-[11px] text-slate-400">Top 6</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topCustomers.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada data pelanggan tercatat.</p>
              ) : (
                topCustomers.map((cust, idx) => (
                  <div key={cust.name + idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-xs">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-900 dark:text-white truncate">{cust.name}</h5>
                        <span className="text-[11px] text-slate-400">{cust.trxCount}x Transaksi • {cust.phone}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatRupiah(cust.totalProfit)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Omzet {formatRupiah(cust.totalOmzet)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ESTIMASI BIAYA ADMIN & POTONGAN MDR QRIS */}
      {/* ========================================================================= */}
      {(activeSubTab === 'admin_fee' || activeSubTab === 'semua') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-rose-600" />
                <span>5. Transparansi Biaya Admin & Potongan MDR QRIS</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Estimasi potongan MDR QRIS (0.3%) dan pendapatan murni biaya admin transfer/top-up
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Laba Bersih Realistis: {formatRupiah(feeAnalysis.netProfitAfterEstimatedMdr)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Omzet Pembayaran QRIS
              </span>
              <div className="text-base font-black text-slate-900 dark:text-white">
                {formatRupiah(feeAnalysis.qrisGross)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Total pembayaran non-tunai lewat QRIS barcode
              </p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3.5 border border-rose-200 dark:border-rose-800/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">
                  Estimasi Biaya MDR (0.3%)
                </span>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-base font-black text-rose-600 dark:text-rose-400">
                -{formatRupiah(feeAnalysis.qrisMdrEstimate)}
              </div>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                Potongan sistem merchant QRIS yang memotong margin
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  Pendapatan Biaya Admin / Fee
                </span>
                <Coins className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                +{formatRupiah(feeAnalysis.transferAdminEarned)}
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                Cuan murni dari jasa admin transfer, tarik tunai, & top-up
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
