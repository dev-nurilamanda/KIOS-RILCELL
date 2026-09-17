import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Smartphone,
  Info
} from 'lucide-react';
import { APP_VERSION_INFO, markCurrentVersionAsSeen } from '../utils/version';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoPrompt?: boolean;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
  isAutoPrompt = false,
}) => {
  if (!isOpen) return null;

  const handleDismiss = () => {
    markCurrentVersionAsSeen();
    onClose();
  };

  return (
    <div 
      id="whats-new-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      <div 
        id="whats-new-card"
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200/90 space-y-4 animate-in zoom-in-95 duration-200 select-none max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with illustration banner */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Pembaruan Baru
                </span>
                <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                  v{APP_VERSION_INFO.version}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight mt-1">
                {APP_VERSION_INFO.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-whats-new"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {isAutoPrompt && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Hai Kasir RILCELL!</span> Aplikasi kasir baru saja diperbarui ke versi terbaru ({APP_VERSION_INFO.version}). Berikut rangkuman perubahan untuk mempermudah transaksi Anda:
              </div>
            </div>
          )}

          {/* Highlights */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Rangkuman Pembaruan</span>
            </h4>
            <div className="space-y-2">
              {APP_VERSION_INFO.items.map((item, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 transition space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item.title}</span>
                    </h5>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      item.type === 'feature' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : item.type === 'improvement'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.type === 'feature' ? 'Fitur Baru' : item.type === 'improvement' ? 'Peningkatan' : 'Perbaikan'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 pl-5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notice for Staff */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Panduan Penggunaan Kasir</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Seluruh saldo dan riwayat transaksi tersinkron secara realtime. Jika membuka menu Pengaturan, gunakan tombol navigasi kembali untuk kembali ke halaman utama.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            RILCELL POS • v{APP_VERSION_INFO.version}
          </span>
          <button
            type="button"
            id="btn-dismiss-whats-new"
            onClick={handleDismiss}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm shadow-emerald-600/30"
          >
            <span>Saya Mengerti & Lanjutkan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
