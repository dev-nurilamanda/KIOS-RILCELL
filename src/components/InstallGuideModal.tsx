import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Download, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  Laptop
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=ffffff&color=059669`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cara Install di HP</h2>
              <p className="text-xs text-emerald-100">Jadikan aplikasi kasir native di layar utama HP Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveDeviceTab('android')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-all ${
              activeDeviceTab === 'android'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android (Chrome)</span>
          </button>

          <button
            onClick={() => setActiveDeviceTab('ios')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-all ${
              activeDeviceTab === 'ios'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Share className="w-4 h-4 text-sky-600" />
            <span>iPhone / iPad (iOS)</span>
          </button>

          <button
            onClick={() => setActiveDeviceTab('desktop')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-all ${
              activeDeviceTab === 'desktop'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Laptop className="w-4 h-4 text-indigo-600" />
            <span>Buka di HP</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          {/* Status Alert if Already Installed */}
          {isInstalled && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Aplikasi saat ini sudah terpasang dalam mode aplikasi standalone di perangkat ini.</span>
            </div>
          )}

          {/* Quick Install Button for Android/Chromium if event ready */}
          {activeDeviceTab === 'android' && isInstallable && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-emerald-950 text-sm">Peramban Anda Siap Install Langsung</p>
                <p className="text-xs text-emerald-700 mt-0.5">Klik tombol untuk memasang instan ke layar utama.</p>
              </div>
              <button
                onClick={async () => {
                  await install();
                  onClose();
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 shrink-0 transition"
              >
                <Download className="w-4 h-4" />
                <span>Install Sekarang</span>
              </button>
            </div>
          )}

          {/* Android Guide */}
          {activeDeviceTab === 'android' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Buka di Browser Google Chrome</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Buka link aplikasi kasir ini di Google Chrome pada HP Android Anda.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    Ketuk Menu Titik Tiga <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ketuk ikon tiga titik <strong>(⋮)</strong> di pojok kanan atas browser Google Chrome.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    Pilih "Tambahkan ke Layar Utama" / "Instal Aplikasi"
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cari dan pilih menu <strong>Tambahkan ke Layar Utama</strong> (atau <strong>Instal aplikasi</strong> / <em>Add to Home Screen</em>).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Selesai! Ikon Muncul di Beranda</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ikon <strong>Kasir POS</strong> akan otomatis terpasang di layar utama HP Anda dan dapat dibuka satu layar penuh tanpa bilah peramban.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* iOS Guide */}
          {activeDeviceTab === 'ios' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Buka Menggunakan Safari</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Buka tautan aplikasi kasir ini di peramban bawaan <strong>Safari</strong> pada iPhone atau iPad Anda.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    Ketuk Tombol Bagikan / Share <Share className="w-3.5 h-3.5 text-sky-600" />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ketuk ikon <strong>Bagikan</strong> (kotak dengan panah ke atas) pada bilah navigasi bagian bawah Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    Pilih "Tambah ke Layar Utama" <PlusSquare className="w-3.5 h-3.5 text-slate-600" />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gulir opsi ke bawah lalu ketuk <strong>Tambah ke Layar Utama</strong> (<em>Add to Home Screen</em>).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Ketuk "Tambah" (Add) di Kanan Atas</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aplikasi <strong>Kasir POS</strong> siap digunakan di layar beranda iOS Anda layaknya aplikasi App Store!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Desktop QR & Share */}
          {activeDeviceTab === 'desktop' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center">
                <p className="text-xs font-semibold text-slate-700 mb-2">Scan QR Code dengan Kamera HP Anda</p>
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Aplikasi Kasir"
                    className="w-40 h-40 object-contain rounded-lg"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Arahkan kamera HP ke QR Code di atas untuk membuka web kasir di ponsel Anda.
                </p>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-700">Tautan Web Aplikasi:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 truncate select-all"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Keunggulan PWA */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Buka cepat tanpa peramban</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Dukungan offline cache</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleCopyUrl}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Bagikan link ke WhatsApp</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
