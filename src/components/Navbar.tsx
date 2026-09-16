import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Wallet, 
  History, 
  BarChart3, 
  Settings, 
  Smartphone, 
  AlertTriangle, 
  Clock, 
  UserCheck,
  Package
} from 'lucide-react';
import { RilcellSettings, ModalAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export type RilcellNavTab = 'entry' | 'saldo' | 'products' | 'history' | 'analytics' | 'settings';

interface NavbarProps {
  activeTab: RilcellNavTab;
  setActiveTab: (tab: RilcellNavTab) => void;
  settings: RilcellSettings;
  accounts: ModalAccount[];
  lowBalanceCount: number;
  presetsCount?: number;
  onOpenInstallGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  accounts,
  lowBalanceCount,
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

  const navItems = [
    { id: 'entry' as const, label: 'Transaksi Baru', shortLabel: 'Transaksi', icon: Zap },
    { 
      id: 'saldo' as const, 
      label: 'Saldo Modal', 
      shortLabel: 'Saldo', 
      icon: Wallet,
      badge: lowBalanceCount > 0 ? `${lowBalanceCount}!` : undefined,
      badgeAlert: lowBalanceCount > 0
    },
    { id: 'products' as const, label: 'Master Produk', shortLabel: 'Produk', icon: Package },
    { id: 'history' as const, label: 'Riwayat & Kas', shortLabel: 'Riwayat', icon: History },
    { id: 'analytics' as const, label: 'Statistik & Grafik', shortLabel: 'Statistik', icon: BarChart3 },
    { id: 'settings' as const, label: 'Pengaturan', shortLabel: 'Pengaturan', icon: Settings },
  ];

  // Mobile Bottom Navigation only needs the 3 primary counter workflows (Saldo, Statistik, Pengaturan moved to Top Right)
  const mobileBottomNavItems = [
    { id: 'entry' as const, label: 'Transaksi Baru', shortLabel: 'Transaksi', icon: Zap },
    { id: 'products' as const, label: 'Master Produk', shortLabel: 'Produk', icon: Package },
    { id: 'history' as const, label: 'Riwayat & Kas', shortLabel: 'Riwayat', icon: History },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Store Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                  {settings.storeName}
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                  POS
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/70">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs scale-[1.01]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Info & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* PANEL SISI KANAN ATAS UNTUK MOBILE: Saldo, Statistik, dan Pengaturan */}
            <div className="flex md:hidden items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              {/* Saldo Modal */}
              <button
                type="button"
                id="mobile-top-nav-saldo"
                onClick={() => setActiveTab('saldo')}
                className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'saldo'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Saldo Modal"
                aria-label="Saldo Modal"
              >
                <div className="relative">
                  <Wallet className="w-4 h-4" />
                  {lowBalanceCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                      {lowBalanceCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px]">Saldo</span>
              </button>

              {/* Statistik */}
              <button
                type="button"
                id="mobile-top-nav-analytics"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Statistik & Grafik"
                aria-label="Statistik & Grafik"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden xs:inline text-[11px]">Stat</span>
              </button>

              {/* Pengaturan */}
              <button
                type="button"
                id="mobile-top-nav-settings"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Pengaturan Toko"
                aria-label="Pengaturan Toko"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop / Tablet Utilities */}
            <div className="hidden sm:flex items-center gap-2">
              <PWAInstallButton />

              {onOpenInstallGuide && (
                <button
                  id="btn-nav-install-guide"
                  onClick={onOpenInstallGuide}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition shrink-0"
                  title="Panduan Instalasi di HP"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Panduan HP</span>
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="tabular-nums font-mono">{time || '00:00:00'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-900 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/80 font-bold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[100px] truncate">{settings.cashierName}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar: Fokus 3 Menu Kasir Utama */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-3 py-2 flex items-center justify-around">
        {mobileBottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all ${
                isActive ? 'text-emerald-700 font-bold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[11px] mt-0.5 tracking-tight">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
