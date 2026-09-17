import React, { useState, useEffect } from 'react';
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
  Package,
  Palette,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Sparkles,
  X,
  Trash2,
  Eraser,
  ShieldCheck,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  Cloud
} from 'lucide-react';
import { RilcellSettings, ModalAccount, RilcellTransaction, AppTheme, ClearDemoOptions } from '../types';
import { GOOGLE_APPS_SCRIPT_TEMPLATE, syncAccountsToGoogleSheets, fetchFromGoogleSheets } from '../services/googleSheetsService';
import { 
  syncAllTransactionsToCloud, 
  syncAccountsToCloud, 
  syncSettingsAndCashToCloud,
  syncPresetsToCloud,
  syncCustomersToCloud
} from '../services/firebase';
import { formatRupiah } from '../utils/formatters';

interface SettingsViewProps {
  settings: RilcellSettings;
  accounts: ModalAccount[];
  transactions: RilcellTransaction[];
  presetsCount?: number;
  customersCount?: number;
  transfersCount?: number;
  cashOnHand?: number;
  onSaveSettings: (newSettings: RilcellSettings) => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => boolean;
  onResetToDemo: () => void;
  onClearDemoData?: (options: ClearDemoOptions) => void;
  onOpenInstallGuide?: () => void;
  onOpenMasterProducts?: () => void;
  onSyncWithGoogleSheets?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  accounts,
  transactions,
  presetsCount = 0,
  customersCount = 0,
  transfersCount = 0,
  cashOnHand = 0,
  onSaveSettings,
  onExportAllData,
  onImportAllData,
  onResetToDemo,
  onClearDemoData,
  onOpenInstallGuide,
  onOpenMasterProducts,
  onSyncWithGoogleSheets,
}) => {
  const [formData, setFormData] = useState<RilcellSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeSavedToast, setThemeSavedToast] = useState<string | null>(null);
  const [showClearDemoModal, setShowClearDemoModal] = useState(false);
  const [clearDemoSuccessToast, setClearDemoSuccessToast] = useState<string | null>(null);
  const [clearOptions, setClearOptions] = useState<ClearDemoOptions>({
    clearTransactions: true,
    clearTransfers: true,
    clearCustomers: true,
    resetBalancesToZero: true,
    clearPresets: false,
  });
  const [isCopyingScript, setIsCopyingScript] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncToast, setCloudSyncToast] = useState<string | null>(null);

  const handleManualCloudSync = async () => {
    setIsCloudSyncing(true);
    setCloudSyncToast(null);
    try {
      await Promise.all([
        syncAllTransactionsToCloud(transactions),
        syncAccountsToCloud(accounts),
        syncSettingsAndCashToCloud(formData, cashOnHand),
      ]);
      setCloudSyncToast('✅ Seluruh data transaksi, akun saldo, & kas berhasil disinkronkan ke Google Firebase Cloud!');
      setTimeout(() => setCloudSyncToast(null), 5000);
    } catch (e) {
      setCloudSyncToast('❌ Gagal sinkronisasi ke Firebase Cloud');
      setTimeout(() => setCloudSyncToast(null), 4000);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Keep form data in sync if parent settings change
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const totalAccountBalances = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  const totalAllMoney = totalAccountBalances + (cashOnHand || 0);

  const handleExecuteClearDemoData = () => {
    if (!onClearDemoData) return;
    onClearDemoData(clearOptions);
    setShowClearDemoModal(false);
    setClearDemoSuccessToast('✨ Data demo berhasil dibersihkan! Aplikasi siap digunakan untuk mencatat transaksi riil konter Anda.');
    setTimeout(() => setClearDemoSuccessToast(null), 5000);
  };

  const handleSelectTheme = (newTheme: AppTheme) => {
    const updated = { ...formData, theme: newTheme };
    setFormData(updated);
    onSaveSettings(updated);

    const themeName = newTheme === 'light' ? 'Mode Terang' : newTheme === 'dark' ? 'Mode Gelap' : 'Ikuti Sistem';
    setThemeSavedToast(`Tema berhasil diubah ke ${themeName}`);
    setTimeout(() => setThemeSavedToast(null), 3000);
  };

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

      {/* Google Firebase Cloud Firestore Integration Card */}
      <div className="bg-gradient-to-br from-teal-950 via-slate-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-teal-800/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Database Online Google Firebase (Firestore)</span>
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Terhubung & Realtime
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Semua transaksi, 8 akun saldo, kas laci, dan data pelanggan otomatis tersimpan permanen di Cloud Firestore & tersinkron multi-perangkat.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isCloudSyncing}
            onClick={handleManualCloudSync}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            <span>{isCloudSyncing ? 'Menyinkronkan...' : 'Sinkronkan Ulang ke Cloud'}</span>
          </button>
        </div>

        {cloudSyncToast && (
          <div className="text-xs p-3 rounded-xl bg-teal-900/60 border border-teal-700/50 text-teal-200 flex items-center gap-2">
            <span>{cloudSyncToast}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-teal-900/50 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block font-medium">Status Koneksi</span>
            <span className="text-xs font-bold text-emerald-400">Aktif & Offline-First</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block font-medium">Model Penyimpanan</span>
            <span className="text-xs font-bold text-teal-300">Firestore Cloud DB</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block font-medium">Multi-Kasir</span>
            <span className="text-xs font-bold text-white">Sinkron Otomatis</span>
          </div>
        </div>
      </div>

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
        {/* Pilihan Tema & Tampilan Antarmuka (Klik untuk Buka Pop-up) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200">
          <div 
            id="open-theme-modal-btn"
            role="button"
            tabIndex={0}
            onClick={() => setShowThemeModal(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowThemeModal(true); } }}
            className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:bg-slate-50 cursor-pointer transition-colors duration-150 select-none group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
                formData.theme === 'dark' 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : formData.theme === 'light' 
                  ? 'bg-amber-100 text-amber-600' 
                  : 'bg-teal-100 text-teal-600'
              }`}>
                {formData.theme === 'dark' ? (
                  <Moon className="w-5 h-5" />
                ) : formData.theme === 'light' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Palette className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Tema & Tampilan Aplikasi
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {formData.theme === 'dark' ? 'Mode Gelap Aktif' : formData.theme === 'light' ? 'Mode Terang Aktif' : 'Ikuti Sistem Aktif'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Klik untuk membuka pop up pilihan tema: Terang, Gelap, atau Sistem
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                <span>Pilih Tema</span>
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-500 group-hover:text-slate-700 transition">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Toast Notification when theme is saved */}
          {themeSavedToast && (
            <div className="px-5 sm:px-6 pb-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{themeSavedToast}</span>
              </div>
            </div>
          )}
        </div>

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

      {/* Operasional Data Riil & Pembersihan Data Demo Card */}
      <div className="bg-gradient-to-br from-white via-rose-50/20 to-amber-50/30 rounded-2xl p-5 sm:p-6 border border-rose-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Eraser className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">Operasional Data Riil & Bersihkan Data Demo</h3>
                {transactions.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Siap Operasi Riil (Data Bersih)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Tersedia {transactions.length} Transaksi Simulasi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Hapus transaksi contoh, pelanggan demo, dan nolkan saldo modal agar konter Anda mulai mencatat pembukuan asli dari nol.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="open-clear-demo-modal-btn"
            onClick={() => setShowClearDemoModal(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan Data Demo</span>
          </button>
        </div>

        {/* Ringkasan Status Data Saat Ini */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">Riwayat Transaksi</span>
            <span className="text-sm font-bold text-slate-900">{transactions.length} Trx</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">Buku Pelanggan</span>
            <span className="text-sm font-bold text-slate-900">{customersCount} Kontak</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">Riwayat Mutasi Saldo</span>
            <span className="text-sm font-bold text-slate-900">{transfersCount} Log</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] text-slate-500 block font-medium">Total Saldo + Kas</span>
            <span className="text-sm font-bold text-slate-900 truncate">{formatRupiah(totalAllMoney)}</span>
          </div>
        </div>

        {/* Toast Notifikasi Sukses Pembersihan */}
        {clearDemoSuccessToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{clearDemoSuccessToast}</span>
          </div>
        )}
      </div>

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
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                {isCopyingScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopyingScript ? 'Kode Tersalin!' : 'Salin Seluruh Kode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Modal Pilihan Tema Tampilan */}
      {showThemeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowThemeModal(false)}
        >
          <div 
            id="theme-selection-modal"
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pilih Tema Tampilan</h3>
                  <p className="text-xs text-slate-500">Sesuaikan mode tampilan antarmuka aplikasi</p>
                </div>
              </div>
              <button
                type="button"
                id="close-theme-modal-btn"
                onClick={() => setShowThemeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pilihan 3 Tema */}
            <div className="space-y-3">
              {/* Mode Terang */}
              <button
                type="button"
                id="modal-theme-light"
                onClick={() => handleSelectTheme('light')}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between gap-3.5 cursor-pointer ${
                  formData.theme === 'light'
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/25 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Sun className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 block">Mode Terang (Light)</span>
                      {formData.theme === 'light' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Tampilan cerah, bersih, dan kontras tajam untuk siang hari.
                    </span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  formData.theme === 'light'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}>
                  {formData.theme === 'light' && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Mode Gelap */}
              <button
                type="button"
                id="modal-theme-dark"
                onClick={() => handleSelectTheme('dark')}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between gap-3.5 cursor-pointer ${
                  formData.theme === 'dark'
                    ? 'border-emerald-500 bg-slate-900 text-white ring-2 ring-emerald-500/25 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Moon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 block">Mode Gelap (Dark)</span>
                      {formData.theme === 'dark' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Tampilan gelap nyaman di mata, tidak silau & hemat baterai.
                    </span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  formData.theme === 'dark'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}>
                  {formData.theme === 'dark' && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Mode Sistem */}
              <button
                type="button"
                id="modal-theme-system"
                onClick={() => handleSelectTheme('system')}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between gap-3.5 cursor-pointer ${
                  formData.theme === 'system' || !formData.theme
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/25 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 block">Ikuti Sistem (System)</span>
                      {(formData.theme === 'system' || !formData.theme) && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Otomatis menyesuaikan mode terang/gelap sesuai setelan perangkat.
                    </span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  formData.theme === 'system' || !formData.theme
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}>
                  {(formData.theme === 'system' || !formData.theme) && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Pilihan otomatis tersimpan & diterapkan langsung.
              </span>
              <button
                type="button"
                id="done-theme-modal-btn"
                onClick={() => setShowThemeModal(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Selesai</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pop-up Modal Dialog Pembersihan Data Demo (Siap Operasional Real) */}
      {showClearDemoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowClearDemoModal(false)}
        >
          <div 
            id="clear-demo-modal"
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Bersihkan Data Demo</h3>
                  <p className="text-xs text-slate-500">Persiapan membuka transaksi operasional riil konter</p>
                </div>
              </div>
              <button
                type="button"
                id="close-clear-modal-btn"
                onClick={() => setShowClearDemoModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Mode Preset Selectors */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setClearOptions({
                  clearTransactions: true,
                  clearTransfers: true,
                  clearCustomers: true,
                  resetBalancesToZero: true,
                  clearPresets: false,
                })}
                className="flex-1 text-[11px] font-bold py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pilihan Rekomendasi</span>
              </button>
              <button
                type="button"
                onClick={() => setClearOptions({
                  clearTransactions: true,
                  clearTransfers: true,
                  clearCustomers: true,
                  resetBalancesToZero: true,
                  clearPresets: true,
                })}
                className="text-[11px] font-bold py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Pilih Semua</span>
              </button>
            </div>

            {/* Checklist Options */}
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {/* Option 1: Transaksi */}
              <label 
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                  clearOptions.clearTransactions 
                    ? 'border-rose-300 bg-rose-50/50' 
                    : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearOptions.clearTransactions}
                  onChange={(e) => setClearOptions({ ...clearOptions, clearTransactions: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">Hapus Semua Riwayat Transaksi</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {transactions.length} Transaksi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Mengosongkan seluruh riwayat penjualan & mereset laporan laba/rugi menjadi Rp 0.
                  </p>
                </div>
              </label>

              {/* Option 2: Mutasi Saldo */}
              <label 
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                  clearOptions.clearTransfers 
                    ? 'border-rose-300 bg-rose-50/50' 
                    : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearOptions.clearTransfers}
                  onChange={(e) => setClearOptions({ ...clearOptions, clearTransfers: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">Hapus Riwayat Mutasi / Transfer Saldo</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {transfersCount} Log Mutasi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Membersihkan log perpindahan saldo antar server/bank/kas demo.
                  </p>
                </div>
              </label>

              {/* Option 3: Pelanggan Demo */}
              <label 
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                  clearOptions.clearCustomers 
                    ? 'border-rose-300 bg-rose-50/50' 
                    : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearOptions.clearCustomers}
                  onChange={(e) => setClearOptions({ ...clearOptions, clearCustomers: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">Hapus Data Pelanggan Demo</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {customersCount} Pelanggan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Menghapus kontak contoh (Pak Budi, Mas Dimas, Bu Siti) agar siap diisi pelanggan asli Anda.
                  </p>
                </div>
              </label>

              {/* Option 4: Saldo Akun ke 0 */}
              <label 
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                  clearOptions.resetBalancesToZero 
                    ? 'border-rose-300 bg-rose-50/50' 
                    : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearOptions.resetBalancesToZero}
                  onChange={(e) => setClearOptions({ ...clearOptions, resetBalancesToZero: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">Reset Semua Saldo Modal & Kas ke Rp 0</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 truncate max-w-[120px]">
                      {formatRupiah(totalAllMoney)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Nolkan saldo WeKios, DigiPOS, DANA, Bank, dan Kas Tunai agar Anda bisa mengisi saldo modal riil yang sebenarnya.
                  </p>
                </div>
              </label>

              {/* Option 5: Master Preset Produk (Optional) */}
              <label 
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                  clearOptions.clearPresets 
                    ? 'border-rose-300 bg-rose-50/50' 
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearOptions.clearPresets}
                  onChange={(e) => setClearOptions({ ...clearOptions, clearPresets: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">Hapus Daftar Master Produk & Preset</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {presetsCount} Produk
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    <strong className="text-emerald-700 font-semibold">Saran: Jangan dicentang</strong> jika Anda ingin tetap menggunakan daftar paket data, pulsa, dan token PLN siap pakai.
                  </p>
                </div>
              </label>
            </div>

            {/* Warning Note */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Pemberitahuan:</span>
                <span>Tindakan ini akan mengosongkan data yang dipilih pada penyimpanan lokal browser ini. Anda tetap dapat mencadangkan data JSON terlebih dahulu jika dibutuhkan.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearDemoModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="confirm-execute-clear-demo-btn"
                onClick={handleExecuteClearDemoData}
                disabled={!clearOptions.clearTransactions && !clearOptions.clearTransfers && !clearOptions.clearCustomers && !clearOptions.resetBalancesToZero && !clearOptions.clearPresets}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Bersihkan Data Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
