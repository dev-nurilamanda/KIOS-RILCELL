import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Wallet, 
  History, 
  BarChart3, 
  Settings, 
  Smartphone, 
  Clock, 
  UserCheck,
  Package,
  Users,
  Sparkles,
  Bot
} from 'lucide-react';
import { RilcellSettings, ModalAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export type RilcellNavTab = 'entry' | 'customers' | 'saldo' | 'products' | 'history' | 'analytics' | 'settings';

interface NavbarProps {
  activeTab: RilcellNavTab;
  setActiveTab: (tab: RilcellNavTab) => void;
  settings: RilcellSettings;
  accounts: ModalAccount[];
  lowBalanceCount: number;
  presetsCount?: number;
  customersCount?: number;
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
    { id: 'customers' as const, label: 'Database Pelanggan', shortLabel: 'Pelanggan', icon: Users },
    { 
      id: 'saldo' as const, 
      label: 'Saldo Modal', 
      shortLabel: 'Saldo', 
      icon: Wallet,
      badge: lowBalanceCount > 0 ? `${lowBalanceCount}!` : undefined,
      badgeAlert: lowBalanceCount > 0
    },
    { id: 'products' as const, label: 'Daftar Produk', shortLabel: 'Produk', icon: Package },
    { id: 'history' as const, label: 'Riwayat & Kas', shortLabel: 'Riwayat', icon: History },
    { id: 'analytics' as const, label: 'Statistik & Grafik', shortLabel: 'Statistik', icon: BarChart3 },
    { id: 'settings' as const, label: 'Pengaturan', shortLabel: 'Pengaturan', icon: Settings },
  ];

  // Mobile Bottom Navigation: Transaksi, Pelanggan, Produk, Riwayat
  const mobileBottomNavItems = [
    { id: 'entry' as const, label: 'Transaksi Baru', shortLabel: 'Transaksi', icon: Zap },
    { id: 'customers' as const, label: 'Pelanggan', shortLabel: 'Pelanggan', icon: Users },
    { id: 'products' as const, label: 'Daftar Produk', shortLabel: 'Produk', icon: Package },
    { id: 'history' as const, label: 'Riwayat & Kas', shortLabel: 'Riwayat', icon: History },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-[70px] flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Logo & Store Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                  {settings.storeName}
                </h1>
                <span className="hidden sm:inline-block text-[11px] uppercase font-extrabold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                  POS
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs - Enlarged & Roomy */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-[13px] transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Medium Screens (MD) Nav Tabs */}
          <nav className="hidden md:flex lg:hidden items-center gap-1 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/70">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-md-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.shortLabel}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white">
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
            <div className="flex md:hidden items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
              {/* Saldo Modal */}
              <button
                type="button"
                id="mobile-top-nav-saldo"
                onClick={() => setActiveTab('saldo')}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer h-10 ${
                  activeTab === 'saldo'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
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
                <span className="text-xs font-bold">Saldo</span>
              </button>

              {/* Statistik */}
              <button
                type="button"
                id="mobile-top-nav-analytics"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer h-10 ${
                  activeTab === 'analytics'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Statistik & Grafik"
                aria-label="Statistik & Grafik"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs font-bold">Stat</span>
              </button>

              {/* Pengaturan */}
              <button
                type="button"
                id="mobile-top-nav-settings"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center justify-center p-2 rounded-xl text-xs font-bold transition-all cursor-pointer h-10 w-10 ${
                  activeTab === 'settings'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
                title="Pengaturan Toko"
                aria-label="Pengaturan Toko"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop / Tablet Utilities */}
            <div className="hidden sm:flex items-center gap-2.5">
              <PWAInstallButton />

              {onOpenInstallGuide && (
                <button
                  id="btn-nav-install-guide"
                  onClick={onOpenInstallGuide}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition shrink-0 cursor-pointer"
                  title="Panduan Instalasi di HP"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Panduan HP</span>
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="tabular-nums font-mono">{time || '00:00:00'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-900 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 font-bold">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="max-w-[120px] truncate">{settings.cashierName}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Floating Capsule Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-3.5 inset-x-3.5 max-w-sm sm:max-w-md mx-auto z-40 pointer-events-none">
        <nav 
          aria-label="Navigasi Utama Bawah"
          className="pointer-events-auto bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-white/15 dark:border-white/10 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.2)] rounded-full p-1.5 flex items-center justify-between ring-1 ring-black/10"
        >
          {mobileBottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                id={`mobile-bottom-nav-${item.id}`}
                type="button"
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.04 }}
                className={`relative flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-full transition-colors cursor-pointer select-none min-h-[50px] ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Smooth Sliding Pill Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="floatingCapsuleActiveBg"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full shadow-md shadow-emerald-900/50 border border-emerald-400/30"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                {/* Animated Icon & Label */}
                <motion.div 
                  className="relative z-10 flex flex-col items-center gap-0.5"
                  animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'text-amber-300 stroke-[2.4] drop-shadow-xs' : 'text-slate-400 stroke-[1.8]'
                  }`} />
                  <span className={`text-[11px] tracking-tight leading-none ${
                    isActive ? 'font-black text-white' : 'font-medium text-slate-400'
                  }`}>
                    {item.shortLabel}
                  </span>
                </motion.div>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
