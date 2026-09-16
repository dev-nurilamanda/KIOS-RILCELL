import React, { useState } from 'react';
import { 
  Store, 
  Database, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Smartphone, 
  FileSpreadsheet, 
  Check, 
  ExternalLink, 
  Copy, 
  AlertTriangle,
  RefreshCw,
  Code,
  Package
} from 'lucide-react';
import { RilcellSettings, ModalAccount, RilcellTransaction } from '../types';
import { GOOGLE_APPS_SCRIPT_TEMPLATE, syncAccountsToGoogleSheets, fetchFromGoogleSheets } from '../services/googleSheetsService';
import { formatRupiah } from '../utils/formatters';

interface SettingsViewProps {
  settings: RilcellSettings;
  accounts: ModalAccount[];
  transactions: RilcellTransaction[];
  presetsCount?: number;
  onSaveSettings: (newSettings: RilcellSettings) => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => boolean;
  onResetToDemo: () => void;
  onOpenInstallGuide?: () => void;
  onOpenMasterProducts?: () => void;
  onSyncWithGoogleSheets?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  accounts,
  transactions,
  presetsCount = 0,
  onSaveSettings,
  onExportAllData,
  onImportAllData,
  onResetToDemo,
  onOpenInstallGuide,
  onOpenMasterProducts,
  onSyncWithGoogleSheets,
}) => {
  const [formData, setFormData] = useState<RilcellSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCopyingScript, setIsCopyingScript] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE.trim());
    setIsCopyingScript(true);
    setTimeout(() => setIsCopyingScript(false), 2500);
  };

  const handleTestGoogleSheetsSync = async () => {
    if (!formData.googleAppsScriptUrl) {
      setSyncStatus('⚠️ Masukkan Google Apps Script URL terlebih dahulu');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Menghubungkan ke Google Sheets...');

    try {
      const res = await syncAccountsToGoogleSheets(formData.googleAppsScriptUrl, accounts);
      if (res.success) {
        setSyncStatus('✅ Berhasil terhubung & tersinkronisasi dengan Google Sheets!');
      } else {
        setSyncStatus(`❌ Gagal: ${res.message}`);
      }
    } catch (err) {
      setSyncStatus('❌ Terjadi kesalahan saat sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = onImportAllData(content);
        if (ok) {
          alert('Data pembukuan RILCELL berhasil dipulihkan!');
        } else {
          alert('Format berkas JSON cadangan tidak valid.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan RILCELL berhasil disimpan!</span>
        </div>
      )}

      {/* Google Sheets Database Integration Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md border border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Integrasi Database Google Sheets</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300">
                  Cloud Backend
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simpan seluruh transaksi konter dan mutasi saldo modal langsung ke spreadsheet Google Drive Anda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowScriptModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <Code className="w-4 h-4" />
            <span>Lihat Script Google Apps Script</span>
          </button>
        </div>

        {/* Input Google Apps Script URL */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 block">
            Google Apps Script Web App URL (Deployment /exec):
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              value={formData.googleAppsScriptUrl}
              onChange={(e) => setFormData({ ...formData, googleAppsScriptUrl: e.target.value })}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleTestGoogleSheetsSync}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkronisasi...' : 'Tes & Sinkronkan'}</span>
            </button>
          </div>

          {syncStatus && (
            <div className="text-xs p-2.5 rounded-lg bg-slate-800 text-slate-300 font-mono mt-2">
              {syncStatus}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="autoSync"
              checked={formData.autoSyncGoogleSheets}
              onChange={(e) => setFormData({ ...formData, autoSyncGoogleSheets: e.target.checked })}
              className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-800"
            />
            <label htmlFor="autoSync" className="text-xs text-slate-300 cursor-pointer">
              Otomatis kirim setiap transaksi baru ke Google Sheets (Fallback otomatis ke LocalStorage jika offline)
            </label>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Konter RILCELL */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Identitas Konter RILCELL</h3>
              <p className="text-xs text-slate-500">Nama konter dan informasi kontak yang tampil di struk dan WhatsApp</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Konter / Toko</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tagline Layanan</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp Konter</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kasir Bertugas</label>
              <input
                type="text"
                value={formData.cashierName}
                onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Konter</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kaki Struk</label>
              <input
                type="text"
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Ambang Peringatan Saldo Menipis */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Batas Peringatan Saldo Menipis</h3>
              <p className="text-xs text-slate-500">Tampilkan notifikasi merah saat saldo modal di bawah batas ini</p>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Batas Saldo Minimal (Rupiah):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                step="10000"
                value={formData.lowBalanceThreshold}
                onChange={(e) => setFormData({ ...formData, lowBalanceThreshold: parseInt(e.target.value, 10) || 100000 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Master Produk & Preset Shortcut Card */}
      {onOpenMasterProducts && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Master Produk & Preset Cepat</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {presetsCount} Produk Tersimpan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur daftar produk langganan, harga modal, harga jual, dan server saldo default untuk input transaksi otomatis.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenMasterProducts}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 shrink-0"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Buka Master Produk</span>
          </button>
        </div>
      )}

      {/* PWA Mobile Installation Card */}
      {onOpenInstallGuide && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 rounded-2xl border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Install Aplikasi Kasir RILCELL di HP</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Pasang aplikasi di layar utama Android atau iPhone tanpa Play Store untuk akses cepat layar penuh.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenInstallGuide}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            <span>Lihat Panduan & QR Code</span>
          </button>
        </div>
      )}

      {/* Backup & Restore JSON Data */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-slate-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cadangkan & Pulihkan Data Lokal (JSON)</h3>
            <p className="text-xs text-slate-500">Ekspor atau impor seluruh data transaksi dan saldo konter Anda secara mandiri</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onExportAllData}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-200"
          >
            <Download className="w-4 h-4" />
            <span>Cadangkan Data (Unduh JSON)</span>
          </button>

          <label className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 cursor-pointer text-center">
            <Upload className="w-4 h-4" />
            <span>Pulihkan Data (Unggah JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin mengatur ulang data kembali ke data contoh bawaan?')) {
                onResetToDemo();
              }
            }}
            className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-rose-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset ke Data Demo</span>
          </button>
        </div>
      </div>

      {/* Google Apps Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">Kode Google Apps Script (GAS)</h3>
                <p className="text-xs text-slate-500">Salin dan tempel kode ini ke Google Sheets &gt; Ekstensi &gt; Apps Script</p>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-y-auto flex-1 select-text">
              <pre>{GOOGLE_APPS_SCRIPT_TEMPLATE.trim()}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Langkah: Ekstensi &gt; Apps Script &gt; Tempel &gt; Terapkan sebagai Web App.
              </span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                {isCopyingScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopyingScript ? 'Kode Tersalin!' : 'Salin Seluruh Kode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
