import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  ShieldAlert, 
  RefreshCw, 
  MessageSquare, 
  Zap, 
  DollarSign, 
  ChevronRight,
  User,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { RilcellTransaction, ModalAccount, CustomerRecord } from '../types';
import { formatRupiah } from '../utils/formatters';

interface AIBusinessAdvisorProps {
  transactions: RilcellTransaction[];
  accounts: ModalAccount[];
  cashOnHand: number;
  customers?: CustomerRecord[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export const AIBusinessAdvisor: React.FC<AIBusinessAdvisorProps> = ({
  transactions,
  accounts,
  cashOnHand,
  customers = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Halo Juragan RILCELL! 🚀\n\nSaya adalah **RILCELL AI Business Advisor** Anda. Saya 100% didedikasikan murni untuk **menganalisis performa bisnis konter, mengevaluasi arus kas/saldo server, serta memberikan strategi dan saran taktis penambah cuan**.\n\nSaya telah membaca seluruh data transaksi, akun saldo server, dan perputaran kas Anda saat ini. Ada yang ingin kita bedah bersama?`,
      timestamp: new Date(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickAnalysisReport, setQuickAnalysisReport] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Aggregate Business Metrics Context for AI
  const businessContext = React.useMemo(() => {
    const validTrx = transactions.filter((t) => t.status === 'sukses');
    const totalOmzet = validTrx.reduce((s, t) => s + t.sellingPrice, 0);
    const totalCost = validTrx.reduce((s, t) => s + t.costPrice, 0);
    const totalProfit = validTrx.reduce((s, t) => s + t.profit, 0);
    const marginRate = totalOmzet > 0 ? ((totalProfit / totalOmzet) * 100).toFixed(1) : '0';
    const totalSaldoServer = accounts.reduce((s, a) => s + a.balance, 0);

    // Method breakdown
    let tunaiOmzet = 0, qrisOmzet = 0, transferOmzet = 0;
    validTrx.forEach((t) => {
      if (t.paymentMethod === 'tunai') tunaiOmzet += t.sellingPrice;
      else if (t.paymentMethod === 'qris') qrisOmzet += t.sellingPrice;
      else if (t.paymentMethod === 'transfer') transferOmzet += t.sellingPrice;
    });

    // Accounts summary
    const serverAccountsSummary = accounts.map((a) => {
      const serverTrx = validTrx.filter((t) => t.sourceAccountId === a.id);
      const spent = serverTrx.reduce((s, t) => s + t.costPrice, 0);
      const profit = serverTrx.reduce((s, t) => s + t.profit, 0);
      return {
        namaAkun: a.name,
        kategori: a.category,
        sisaSaldoSaatIni: a.balance,
        modalTerpakai: spent,
        labaDihasilkan: profit,
        jumlahTransaksi: serverTrx.length,
      };
    });

    // Top categories
    const categoryStats: Record<string, { omzet: number; profit: number; count: number }> = {};
    validTrx.forEach((t) => {
      const cat = t.category;
      if (!categoryStats[cat]) categoryStats[cat] = { omzet: 0, profit: 0, count: 0 };
      categoryStats[cat].omzet += t.sellingPrice;
      categoryStats[cat].profit += t.profit;
      categoryStats[cat].count += 1;
    });

    // Top products
    const serviceStats: Record<string, { count: number; profit: number; omzet: number }> = {};
    validTrx.forEach((t) => {
      const name = t.serviceName;
      if (!serviceStats[name]) serviceStats[name] = { count: 0, profit: 0, omzet: 0 };
      serviceStats[name].count += 1;
      serviceStats[name].profit += t.profit;
      serviceStats[name].omzet += t.sellingPrice;
    });

    const topServices = Object.entries(serviceStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    return {
      namaToko: 'RILCELL Kasir & POS',
      totalTransaksiSukses: validTrx.length,
      totalOmzetKotor: totalOmzet,
      totalModalKeluar: totalCost,
      totalLabaBersih: totalProfit,
      marginKeuntunganRataRata: `${marginRate}%`,
      uangTunaiLaciKas: cashOnHand,
      totalSaldoServerMengendap: totalSaldoServer,
      totalAsetLikuid: cashOnHand + totalSaldoServer,
      komposisiPembayaran: {
        tunaiKasLaci: tunaiOmzet,
        qrisNonTunai: qrisOmzet,
        transferBankEWallet: transferOmzet,
      },
      performaAkunServer: serverAccountsSummary,
      performaKategori: categoryStats,
      top5ProdukPalingCuan: topServices,
      totalPelangganTerdaftar: customers.length,
    };
  }, [transactions, accounts, cashOnHand, customers]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/business-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          businessContext,
          chatHistory: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses jawaban.');
      }

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Tidak ada balasan dari advisor.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Maaf Juragan, terjadi kendala saat menghubungkan ke AI Business Advisor: ${err.message || 'Coba sesaat lagi.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuickAudit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/business-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Lakukan Audit Cepat Kesehatan Bisnis RILCELL (Full Business Health Audit). Berikan:
1. Status Likuiditas & Arus Kas (apakah uang kas laci cukup untuk putaran modal hari ini?)
2. Evaluasi Saldo Server (server mana yang idle/mengendap dan mana yang perlu diisi ulang)
3. Analisis Margin Produk & Kategori (rekomendasi penetapan harga & promosi)
4. 3 Tindakan Strategis Taktis Prioritas yang harus juragan lakukan hari ini untuk melipatgandakan keuntungan.`,
          businessContext,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setQuickAnalysisReport(data.reply);
        const assistantMessage: ChatMessage = {
          id: `audit-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      alert(`Gagal membuat audit cepat: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionPrompts = [
    {
      title: 'Audit Cepat Kesehatan Bisnis',
      prompt: 'Analisis kesehatan menyeluruh bisnis RILCELL berdasarkan data omzet, laba, dan saldo server saat ini.',
      icon: TrendingUp,
      badge: 'Rekomendasi',
    },
    {
      title: 'Evaluasi Efisiensi Saldo Server',
      prompt: 'Server saldo mana yang paling produktif menghasilkan laba dan saldo mana yang perputarannya terlalu lambat?',
      icon: Layers,
      badge: 'Perputaran Modal',
    },
    {
      title: 'Strategi Optimasi Margin & Cuan',
      prompt: 'Bagaimana cara meningkatkan margin keuntungan RILCELL tanpa kehilangan pelanggan di produk pulsa dan PPOB?',
      icon: DollarSign,
      badge: 'Strategi Harga',
    },
    {
      title: 'Evaluasi Arus Kas Tunai vs QRIS',
      prompt: 'Berdasarkan perbandingan transaksi Tunai vs QRIS/Transfer saat ini, apakah arus kas likuiditas saya sehat?',
      icon: ShieldAlert,
      badge: 'Likuiditas',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col h-[650px] sm:h-[720px]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between gap-3 shrink-0 border-b border-indigo-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                RILCELL AI Business Advisor
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                100% Analisis Bisnis
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
              Konsultan cerdas keuangan, strategi margin, perputaran saldo server & arus kas konter
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generateQuickAudit}
          disabled={isLoading}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-900/30 shrink-0 disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">Audit Cepat Bisnis</span>
          <span className="sm:hidden">Audit</span>
        </button>
      </div>

      {/* Strict Role & Read-Only Notice */}
      <div className="bg-indigo-50/80 dark:bg-indigo-950/30 px-4 py-2 border-b border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-2 shrink-0">
        <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="truncate">
          AI ini <strong>hanya bertugas membaca data & memberi saran strategi bisnis</strong>. Tidak mengubah atau menghapus data transaksi.
        </span>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                  isUser
                    ? 'bg-slate-900 dark:bg-slate-800 text-white font-bold'
                    : 'bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans space-y-2">
                  {msg.text.split('\n\n').map((paragraph, pIdx) => {
                    // Quick check for bullet lists
                    return (
                      <p key={pIdx} className="leading-relaxed">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
                <div
                  className={`text-[9px] mt-2 font-medium ${
                    isUser ? 'text-slate-400 text-right' : 'text-slate-400 text-left'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xs shadow-xs">
            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
            <span className="font-semibold">AI sedang menganalisis data bisnis RILCELL...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="p-2 sm:px-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max pb-1">
          {suggestionPrompts.map((sug, idx) => {
            const Icon = sug.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(sug.prompt)}
                disabled={isLoading}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{sug.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Prompt Box */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Tanyakan analisis bisnis, strategi cuan, atau evaluasi saldo server..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
