import React from 'react';
import { 
  Wallet, 
  ArrowRightLeft, 
  Receipt, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles
} from 'lucide-react';
import { ModalAccount, RilcellTransaction } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';

interface QuickOverviewSidebarProps {
  accounts: ModalAccount[];
  cashOnHand?: number;
  lowBalanceThreshold?: number;
  recentTransactions: RilcellTransaction[];
  onOpenTransferModal: () => void;
  onOpenEditCashModal?: () => void;
  onSelectTransactionReceipt: (trx: RilcellTransaction) => void;
  onViewAllSaldo: () => void;
  onViewAllHistory: () => void;
}

export const QuickOverviewSidebar: React.FC<QuickOverviewSidebarProps> = ({
  accounts,
  recentTransactions,
  onOpenTransferModal,
  onSelectTransactionReceipt,
  onViewAllSaldo,
  onViewAllHistory,
}) => {
  // Count today's transactions
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTransactions = recentTransactions.filter((t) => t.timestamp >= todayStart.getTime());
  const todaySuccessCount = todayTransactions.filter((t) => t.status === 'sukses').length;

  return (
    <aside className="space-y-4">
      {/* Keamanan Saldo & Pintasan Navigasi Saldo Modal */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-md border border-slate-700/50 relative overflow-hidden">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                Privasi & Keamanan Kasir
              </span>
              <h4 className="text-sm font-black text-white leading-snug">
                Saldo Terpusat di Menu Saldo
              </h4>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Informasi saldo modal server dan kas fisik konter kini dikelola khusus pada halaman <strong>Saldo Modal</strong> agar aman dari pandangan pelanggan saat transaksi.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/70">
          <button
            type="button"
            onClick={onViewAllSaldo}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Cek Saldo Modal</span>
          </button>

          <button
            type="button"
            onClick={onOpenTransferModal}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-600 transition active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Pindah / Top-Up</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Kasir Hari Ini */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Aktivitas Kasir Hari Ini</span>
          </h3>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            Kasir Aktif
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Trx Berhasil</span>
            </div>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {todaySuccessCount} <span className="text-xs font-medium text-slate-400">trx</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Total Diproses</span>
            </div>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {todayTransactions.length} <span className="text-xs font-medium text-slate-400">total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaksi Terakhir & Cetak Struk Cepat */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Transaksi Terakhir</span>
          </h3>
          <button
            type="button"
            onClick={onViewAllHistory}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5"
          >
            <span>Semua Riwayat</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Belum ada transaksi hari ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.slice(0, 5).map((trx) => (
              <div
                key={trx.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2 hover:bg-slate-50 rounded-lg px-1 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {trx.serviceName}
                    </span>
                    {trx.status === 'gagal' && (
                      <span className="text-[9px] font-extrabold bg-rose-100 text-rose-700 px-1 py-0.2 rounded">
                        Gagal
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {trx.targetNumber} • {formatDate(trx.timestamp)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 font-mono block">
                      {formatRupiah(trx.sellingPrice)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 block">
                      +{formatRupiah(trx.profit)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTransactionReceipt(trx)}
                    className="p-1.5 hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg transition"
                    title="Cetak Struk Thermal / Struk WA"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips Kasir Konter */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Tips Kasir RILCELL</span>
        </div>
        <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
          Gunakan tombol <strong>Pilihan Cepat Produk (Quick Pick Chips)</strong> di atas formulir untuk mengisi nama layanan, modal, dan harga jual secara instan dalam 1 klik.
        </p>
      </div>
    </aside>
  );
};
