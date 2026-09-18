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
  ArrowLeft,
  Sparkles,
  X,
  Trash2,
  Eraser,
  ShieldCheck,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Sliders,
  Settings,
  Info,
  Layers,
  History,
  CheckCircle,
  Clock
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
import { APP_VERSION_INFO, checkPWAUpdate } from '../utils/version';
import { WhatsNewModal } from './WhatsNewModal';
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
  onResetPresets?: () => void;
  onSyncWithGoogleSheets?: () => Promise<void>;
  onRefreshApp?: () => Promise<void> | void;
}

export type SettingsSubMenu = 'profil' | 'database' | 'tampilan' | 'data' | null;

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
  onResetPresets,
  onSyncWithGoogleSheets,
  onRefreshApp,
}) => {
  const [activeSubMenu, setActiveSubMenu] = useState<SettingsSubMenu>(null);
  const [formData, setFormData] = useState<RilcellSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeSavedToast, setThemeSavedToast] = useState<string | null>(null);
  const [showClearDemoModal, setShowClearDemoModal] = useState(false);
  const [clearDemoSuccessToast, setClearDemoSuccessToast] = useState<string | null>(null);
  const [resetPresetsToast, setResetPresetsToast] = useState<string | null>(null);
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
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatusToast, setUpdateStatusToast] = useState<string | null>(null);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [isRefreshingApp, setIsRefreshingApp] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  const handleRefreshApplication = async () => {
    setIsRefreshingApp(true);
    setRefreshToast('Memuat ulang & menyinkronkan data...');
    try {
      if (onRefreshApp) {
        await onRefreshApp();
      } else {
        await Promise.allSettled([
          syncAllTransactionsToCloud(transactions),
          syncAccountsToCloud(accounts),
          syncSettingsAndCashToCloud(formData, cashOnHand),
        ]);
        await new Promise((r) => setTimeout(r, 600));
        window.location.reload();
      }
      setRefreshToast('✅ Data & aplikasi berhasil dimuat ulang!');
    } catch {
      window.location.reload();
    } finally {
      setIsRefreshingApp(false);
      setTimeout(() => setRefreshToast(null), 3500);
    }
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatusToast(null);
    try {
      const res = await checkPWAUpdate();
      setUpdateStatusToast(res.message);
      if (res.hasUpdate) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch {
      setUpdateStatusToast(`Aplikasi aktif versi v${APP_VERSION_INFO.version}`);
    } finally {
      setIsCheckingUpdate(false);
      setTimeout(() => {
        setUpdateStatusToast(null);
      }, 5000);
    }
  };

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

  const subMenuItems = [
    {
      id: 'profil' as const,
      label: 'Profil & Struk',
      title: 'Identitas Konter & Struk Kasir',
      desc: 'Nama konter, tagline, WhatsApp, kasir, alamat & footer struk',
      icon: Store,
      color: 'emerald',
      badge: formData.storeName || 'RILCELL',
    },
    {
      id: 'database' as const,
      label: 'Database, Cloud & Sinkron',
      title: 'Database Cloud Firestore, Refresh & Sheets',
      desc: 'Koneksi realtime, muat ulang / refresh aplikasi, dan Google Sheets',
      icon: Cloud,
      color: 'sky',
      badge: 'Realtime Cloud',
    },
    {
      id: 'tampilan' as const,
      label: 'Tampilan, Fitur & Versi',
      title: 'Tampilan, Saldo, Master Produk & Versi Aplikasi',
      desc: `Mode tema, batas saldo minimal, master produk, dan info versi v${APP_VERSION_INFO.version}`,
      icon: Palette,
      color: 'indigo',
      badge: formData.theme === 'dark' ? 'Mode Gelap' : formData.theme === 'light' ? 'Mode Terang' : 'Sistem Auto',
    },
    {
      id: 'data' as const,
      label: 'Manajemen Data',
      title: 'Operasional Riil & Backup Data',
      desc: 'Bersihkan data demo, cadangkan/pulihkan JSON, & reset sistem',
      icon: Database,
      color: 'rose',
      badge: transactions.length > 0 ? `${transactions.length} Trx Tersimpan` : 'Data Bersih',
    },
  ];

  const currentSubMenuInfo = subMenuItems.find(item => item.id === activeSubMenu);

  return (
    <div className="max-w-4xl mx-auto space-y-3.5 animate-in fade-in duration-200">
      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengaturan RILCELL berhasil disimpan!</span>
        </div>
      )}

      {/* Refresh Application Toast Alert */}
      {refreshToast && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{refreshToast}</span>
        </div>
      )}

      {/* VIEW MODE 1: MAIN MENU (LIST BERJEJER KE BAWAH / SETTINGS HUB) */}
      {activeSubMenu === null && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Top Store Overview Card - Pinned & Non-Scrolling Sticky Header */}
          <div className="sticky top-[68px] sm:top-[70px] z-20 pt-0.5 pb-1 -mt-1 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-md">
            <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-inner">
                  <Store className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                      {formData.storeName || 'RILCELL'}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Online Realtime
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 truncate">
                    {formData.tagline || 'Konter Pulsa, Paket Data & PPOB'}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                    Kasir: <span className="text-slate-200 font-semibold">{formData.cashierName || 'Kasir RILCELL'}</span> • Saldo + Kas: <span className="text-emerald-400 font-bold font-mono">{formatRupiah(totalAllMoney)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="refresh-app-btn-header"
                  onClick={handleRefreshApplication}
                  disabled={isRefreshingApp}
                  title="Muat Ulang / Refresh Aplikasi & Data"
                  className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingApp ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isRefreshingApp ? 'Memuat...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section Title */}
          <div className="flex items-center justify-between px-1 pt-0.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Menu Pengaturan & Konfigurasi
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Pilih menu untuk melihat detail</span>
          </div>

          {/* List Sub-Menu Berjejer ke Bawah - Uniform Full Width */}
          <div className="space-y-2.5">
            {subMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  id={`menu-item-${item.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveSubMenu(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveSubMenu(item.id);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm group select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                      item.color === 'emerald'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        : item.color === 'sky'
                        ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400'
                        : item.color === 'indigo'
                        ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.label}
                        </h4>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.color === 'emerald'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : item.color === 'sky'
                              ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : item.color === 'indigo'
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-center text-slate-400 transition">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Shortcuts - Clean Uniform Full Width Cards */}
          <div className="space-y-2.5 pt-1">
            {/* Quick Refresh Action Card */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleRefreshApplication}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRefreshApplication(); } }}
              className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm group select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <RefreshCw className={`w-5 h-5 ${isRefreshingApp ? 'animate-spin' : ''}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Muat Ulang / Refresh Aplikasi & Data
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Instan
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Ganti fungsi tarik layar: Segarkan seluruh data transaksi, saldo akun, dan status koneksi konter
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                  {isRefreshingApp ? 'Menyinkronkan...' : 'Refresh Sekarang'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-600 flex items-center justify-center text-slate-400 transition">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {onOpenMasterProducts && (
              <div
                role="button"
                tabIndex={0}
                onClick={onOpenMasterProducts}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenMasterProducts(); } }}
                className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm group select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Master Produk & Preset Cepat
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {presetsCount} Produk Tersimpan
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Kelola daftar paket data, pulsa, token PLN, e-wallet, dan harga modal/jual
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600 flex items-center justify-center text-slate-400 transition shrink-0">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            )}

            {onOpenInstallGuide && (
              <div
                role="button"
                tabIndex={0}
                onClick={onOpenInstallGuide}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenInstallGuide(); } }}
                className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 text-left transition-all duration-150 cursor-pointer shadow-xs hover:shadow-sm group select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        Pasang Aplikasi di HP (PWA)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        Layar Penuh
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Panduan pasang shortcut & icon instan di layar utama Android atau iPhone
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/50 group-hover:text-teal-600 flex items-center justify-center text-slate-400 transition shrink-0">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: SUB-MENU DETAIL VIEW WITH NATIVE BACK BUTTON */}
      {activeSubMenu !== null && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Sub-Menu Header Navigation Bar */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <button
              type="button"
              id="back-to-settings-main-btn"
              onClick={() => setActiveSubMenu(null)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer group shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
              <span>Kembali</span>
            </button>

            <div className="text-right min-w-0">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                {currentSubMenuInfo?.title || 'Pengaturan'}
              </h2>
              <span className="text-[10px] text-slate-500">Pengaturan RILCELL</span>
            </div>
          </div>

      {/* SUB MENU 1: PROFIL & STRUK */}
      {activeSubMenu === 'profil' && (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Identitas Konter RILCELL</h3>
                <p className="text-xs text-slate-500">Nama konter dan informasi kontak yang tampil di struk dan nota WhatsApp</p>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kaki Struk (Receipt Footer)</label>
                <input
                  type="text"
                  value={formData.receiptFooter}
                  onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil Konter</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB MENU 2: DATABASE & CLOUD */}
      {activeSubMenu === 'database' && (
        <div className="space-y-5 animate-in fade-in duration-200">
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
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
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
                    <span>Integrasi Opsional Google Sheets</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300">
                      Ekspor / Backup
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Salin seluruh transaksi konter langsung ke spreadsheet Google Drive Anda secara paralel.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowScriptModal(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Code className="w-4 h-4" />
                <span>Lihat Script GAS</span>
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
                  onChange={(e) => {
                    const updated = { ...formData, googleAppsScriptUrl: e.target.value };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleTestGoogleSheetsSync}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
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
                  onChange={(e) => {
                    const updated = { ...formData, autoSyncGoogleSheets: e.target.checked };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-800 cursor-pointer"
                />
                <label htmlFor="autoSync" className="text-xs text-slate-300 cursor-pointer">
                  Otomatis kirim setiap transaksi baru ke Google Sheets
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB MENU 3: TAMPILAN & FITUR */}
      {activeSubMenu === 'tampilan' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Pilihan Tema & Tampilan Antarmuka */}
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

          {/* Ambang Peringatan Saldo Menipis */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Batas Peringatan Saldo Menipis</h3>
                <p className="text-xs text-slate-500">Tampilkan notifikasi merah saat saldo modal akun di bawah batas ini</p>
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
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 100000;
                    const updated = { ...formData, lowBalanceThreshold: val };
                    setFormData(updated);
                    onSaveSettings(updated);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

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
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onResetPresets && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Kembalikan / Muat ulang daftar master produk ke data bawaan standar? Seluruh produk paket data, pulsa, dan token PLN contoh akan dimuat kembali ke sistem.')) {
                        onResetPresets();
                        setResetPresetsToast('Master produk bawaan standar berhasil dimuat ulang!');
                        setTimeout(() => setResetPresetsToast(null), 3000);
                      }
                    }}
                    className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Muat ulang produk template standar bawaan"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Muat Bawaan</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenMasterProducts}
                  className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Buka Produk</span>
                </button>
              </div>
            </div>
          )}

          {/* PWA Mobile Installation Card */}
          {onOpenInstallGuide && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 p-5 rounded-2xl border border-emerald-200/90 dark:border-emerald-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Install Aplikasi Kasir RILCELL di HP</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Pasang aplikasi di layar utama Android atau iPhone tanpa Play Store untuk akses cepat layar penuh.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenInstallGuide}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Lihat Panduan & QR Code</span>
              </button>
            </div>
          )}

          {/* Info Versi & Pembaruan Sistem Card (Dipindahkan ke Sub-Menu Relevan) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      RILCELL Kasir POS
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Versi {APP_VERSION_INFO.version}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                      Build {APP_VERSION_INFO.buildCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Pembaruan Terakhir: {APP_VERSION_INFO.buildDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowChangelogModal(true)}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Catatan Rilis</span>
                </button>

                <button
                  type="button"
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? 'Memeriksa...' : 'Cek Pembaruan'}</span>
                </button>
              </div>
            </div>

            {updateStatusToast && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{updateStatusToast}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Status WebAPK: <strong className="text-slate-600 dark:text-slate-300 font-medium">Sinkron Otomatis (Chrome WebAPK)</strong></span>
              <span className="font-mono">RILCELL POS Engine</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB MENU 4: MANAJEMEN DATA */}
      {activeSubMenu === 'data' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Operasional Data Riil & Pembersihan Data Demo Card */}
          <div className="bg-gradient-to-br from-white via-rose-50/20 to-amber-50/30 rounded-2xl p-5 sm:p-6 border border-rose-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Eraser className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">Operasional Data Riil & Bersihkan Demo</h3>
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

          {/* Master Produk Standar & Template Bawaan Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Master Produk Bawaan Standar</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {presetsCount} Produk Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pulihkan atau muat ulang daftar template paket data, pulsa, token PLN, e-wallet, dan produk konter ke standar bawaan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onOpenMasterProducts && (
                  <button
                    type="button"
                    onClick={onOpenMasterProducts}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-slate-600" />
                    <span>Lihat Produk</span>
                  </button>
                )}
                {onResetPresets && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Kembalikan / Muat ulang daftar master produk ke data bawaan standar? Seluruh paket data, pulsa, dan token PLN contoh akan dimuat kembali ke sistem dan database.')) {
                        onResetPresets();
                        setResetPresetsToast('Master produk bawaan standar berhasil dimuat ulang!');
                        setTimeout(() => setResetPresetsToast(null), 3000);
                      }
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Muat Produk Bawaan</span>
                  </button>
                )}
              </div>
            </div>

            {/* Toast Notifikasi Reset Produk Bawaan */}
            {resetPresetsToast && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">{resetPresetsToast}</span>
              </div>
            )}
          </div>

          {/* Backup & Restore JSON Data */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cadangkan & Pulihkan Data Lokal (JSON)</h3>
                <p className="text-xs text-slate-500">Ekspor atau impor seluruh data transaksi dan saldo konter Anda secara mandiri</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={onExportAllData}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Cadangkan (Unduh JSON)</span>
              </button>

              <label className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 cursor-pointer text-center">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Pulihkan (Unggah JSON)</span>
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
                className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-rose-200 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset ke Data Demo</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      )}

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

      {/* Catatan Rilis & Changelog Modal */}
      <WhatsNewModal
        isOpen={showChangelogModal}
        onClose={() => setShowChangelogModal(false)}
      />
    </div>
  );
};
