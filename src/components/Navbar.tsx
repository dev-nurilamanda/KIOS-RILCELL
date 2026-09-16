import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, BarChart3, Settings, Store, Clock, UserCheck, Smartphone } from 'lucide-react';
import { StoreSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: 'pos' | 'inventory' | 'reports' | 'settings';
  setActiveTab: (tab: 'pos' | 'inventory' | 'reports' | 'settings') => void;
  settings: StoreSettings;
  cartCount: number;
  lowStockCount: number;
  onOpenInstallGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  cartCount,
  lowStockCount,
  onOpenInstallGuide,
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Store Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 truncate leading-tight tracking-tight">
                {settings.storeName}
              </h1>
              <p className="text-xs text-slate-500 truncate hidden sm:block">
                {settings.tagline || 'Aplikasi Kasir Web Modern'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              id="nav-tab-pos"
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pos'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden md:inline">Kasir POS</span>
              {cartCount > 0 && (
                <span className="bg-emerald-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inventory'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="hidden md:inline">Produk & Stok</span>
              {lowStockCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none" title={`${lowStockCount} produk stok menipis`}>
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'reports'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Riwayat & Laporan</span>
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Pengaturan</span>
            </button>
          </nav>

          {/* Right Info: Clock, Cashier Name & Install PWA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton />

            {onOpenInstallGuide && (
              <button
                id="btn-nav-install-guide"
                onClick={onOpenInstallGuide}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition shrink-0"
                title="Petunjuk & QR Code Buka di HP"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Panduan HP</span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums font-mono">{time || '00:00:00'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200/80 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[120px] truncate">{settings.cashierName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
