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
  UserCheck 
} from 'lucide-react';
import { RilcellSettings, ModalAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export type RilcellNavTab = 'entry' | 'saldo' | 'history' | 'analytics' | 'settings';

interface NavbarProps {
  activeTab: RilcellNavTab;
  setActiveTab: (tab: RilcellNavTab) => void;
  settings: RilcellSettings;
  accounts: ModalAccount[];
  lowBalanceCount: number;
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
    { id: 'history' as const, label: 'Riwayat & Kas', shortLabel: 'Riwayat', icon: History },
    { id: 'analytics' as const, label: 'Statistik & Grafik', shortLabel: 'Statistik', icon: BarChart3 },
    { id: 'settings' as const, label: 'Pengaturan', shortLabel: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Store Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900 leading-tight">
                  {settings.storeName}
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  POS & Pembukuan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs leading-none mt-0.5">
                {settings.tagline}
              </p>
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
          <div className="flex items-center gap-2 sm:gap-2.5">
            <PWAInstallButton />

            {onOpenInstallGuide && (
              <button
                id="btn-nav-install-guide"
                onClick={onOpenInstallGuide}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition shrink-0"
                title="Panduan Instalasi di HP"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Panduan HP</span>
              </button>
            )}

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

      {/* Mobile Bottom Navigation Bar for Android/iPhone Touch Comfort */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 stroke-[2.5]' : 'text-slate-400'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-black bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
