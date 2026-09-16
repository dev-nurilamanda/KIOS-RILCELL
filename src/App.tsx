import React, { useState, useEffect } from 'react';
import { 
  ModalAccount, 
  RilcellTransaction, 
  BalanceTransfer, 
  RilcellSettings, 
  AccountKey,
  QuickPresetProduct 
} from './types';
import { 
  INITIAL_MODAL_ACCOUNTS, 
  INITIAL_SETTINGS, 
  INITIAL_TRANSACTIONS,
  QUICK_PRESETS 
} from './data/initialData';
import { Navbar, RilcellNavTab } from './components/Navbar';
import { QuickEntryForm } from './components/QuickEntryForm';
import { SaldoModalManager } from './components/SaldoModalManager';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { DashboardAnalyticsView } from './components/DashboardAnalyticsView';
import { SettingsView } from './components/SettingsView';
import { MasterProductManager } from './components/MasterProductManager';
import { RilcellReceiptModal } from './components/RilcellReceiptModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { generateInvoiceNumber } from './utils/formatters';
import { sendTransactionToGoogleSheets } from './services/googleSheetsService';

const STORAGE_KEYS = {
  ACCOUNTS: 'rilcell_accounts_v2',
  TRANSACTIONS: 'rilcell_transactions_v2',
  TRANSFERS: 'rilcell_transfers_v2',
  SETTINGS: 'rilcell_settings_v2',
  CASH: 'rilcell_cash_v2',
  PRESETS: 'rilcell_presets_v2',
};

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<RilcellNavTab>('entry');

  // Accounts State
  const [accounts, setAccounts] = useState<ModalAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading accounts:', e);
    }
    return INITIAL_MODAL_ACCOUNTS;
  });

  // Transactions State
  const [transactions, setTransactions] = useState<RilcellTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading transactions:', e);
    }
    return INITIAL_TRANSACTIONS;
  });

  // Transfers History State
  const [transferHistory, setTransferHistory] = useState<BalanceTransfer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading transfers:', e);
    }
    return [];
  });

  // Settings State
  const [settings, setSettings] = useState<RilcellSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    return INITIAL_SETTINGS;
  });

  // Cash on Hand State
  const [cashOnHand, setCashOnHand] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASH);
      if (saved !== null) {
        const parsed = Number(saved);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading cash on hand:', e);
    }
    return INITIAL_SETTINGS.cashOnHand;
  });

  // Master Presets State (Product Presets)
  const [presets, setPresets] = useState<QuickPresetProduct[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading presets:', e);
    }
    return QUICK_PRESETS;
  });

  // Selected Preset to auto-fill into transaction form
  const [selectedPresetToFill, setSelectedPresetToFill] = useState<QuickPresetProduct | null>(null);

  // Modals State
  const [activeReceiptTrx, setActiveReceiptTrx] = useState<RilcellTransaction | null>(null);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transferHistory));
  }, [transferHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH, cashOnHand.toString());
  }, [cashOnHand]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  }, [presets]);

  // Master Preset CRUD Handlers
  const handleAddPreset = (newPresetData: Omit<QuickPresetProduct, 'id'>) => {
    const newPreset: QuickPresetProduct = {
      ...newPresetData,
      id: `qp-${Date.now()}`,
    };
    setPresets((prev) => [newPreset, ...prev]);
  };

  const handleUpdatePreset = (id: string, updatedFields: Partial<QuickPresetProduct>) => {
    setPresets((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    );
  };

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetPresets = () => {
    setPresets(QUICK_PRESETS);
  };

  // Low Balance Accounts Alert Count
  const lowBalanceCount = accounts.filter(
    (a) => a.balance <= (a.minAlertThreshold || settings.lowBalanceThreshold)
  ).length;

  // 1. Submit New Transaction Handler
  const handleCreateTransaction = (
    trxData: Omit<RilcellTransaction, 'id' | 'invoiceNumber' | 'timestamp' | 'status' | 'syncedToSheets'>
  ): boolean => {
    const sourceAcc = accounts.find((a) => a.id === trxData.sourceAccountId);
    if (!sourceAcc) {
      alert('Akun modal sumber tidak ditemukan!');
      return false;
    }

    if (sourceAcc.balance < trxData.costPrice) {
      alert(`Saldo ${sourceAcc.name} tidak mencukupi untuk transaksi ini.`);
      return false;
    }

    const newTrxId = `trx-${Date.now()}`;
    const invoiceNumber = generateInvoiceNumber(transactions.length + 1);
    const newTransaction: RilcellTransaction = {
      ...trxData,
      id: newTrxId,
      invoiceNumber,
      timestamp: Date.now(),
      status: 'sukses',
      syncedToSheets: false,
    };

    // Deduct cost price from source modal account
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === trxData.sourceAccountId) {
        return {
          ...acc,
          balance: acc.balance - trxData.costPrice,
          updatedAt: Date.now(),
        };
      }
      return acc;
    });

    // Add selling price to cash on hand
    setCashOnHand((prev) => prev + trxData.sellingPrice);
    setAccounts(updatedAccounts);
    setTransactions((prev) => [newTransaction, ...prev]);

    // Open receipt modal right away for cashier convenience
    setActiveReceiptTrx(newTransaction);

    // Sync to Google Sheets if configured
    if (settings.autoSyncGoogleSheets && settings.googleAppsScriptUrl) {
      sendTransactionToGoogleSheets(settings.googleAppsScriptUrl, newTransaction, updatedAccounts).catch(
        (err) => console.warn('Google Sheets background sync notice:', err)
      );
    }

    return true;
  };

  // 2. Toggle Status (Sukses / Gagal with automatic refund logic)
  const handleToggleStatus = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    const newStatus = target.status === 'sukses' ? 'gagal' : 'sukses';

    if (newStatus === 'gagal') {
      // Revert: refund costPrice back to modal account, deduct sellingPrice from cash
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === target.sourceAccountId) {
            return {
              ...acc,
              balance: acc.balance + target.costPrice,
              updatedAt: Date.now(),
            };
          }
          return acc;
        })
      );
      setCashOnHand((prev) => Math.max(0, prev - target.sellingPrice));
    } else {
      // Re-apply: deduct costPrice from modal account, add sellingPrice to cash
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === target.sourceAccountId) {
            return {
              ...acc,
              balance: Math.max(0, acc.balance - target.costPrice),
              updatedAt: Date.now(),
            };
          }
          return acc;
        })
      );
      setCashOnHand((prev) => prev + target.sellingPrice);
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  // 3. Transfer Balance / Top-Up Modal Handler
  const handleTransferBalance = (
    transfer: Omit<BalanceTransfer, 'id' | 'timestamp' | 'invoiceNumber'>
  ): boolean => {
    const totalDeducted = transfer.amount + transfer.fee;

    // Deduct from source
    if (transfer.fromAccountId === 'kas_tunai') {
      if (cashOnHand < totalDeducted) {
        alert('Kas tunai tidak mencukupi');
        return false;
      }
      setCashOnHand((prev) => prev - totalDeducted);
    } else {
      const srcAcc = accounts.find((a) => a.id === transfer.fromAccountId);
      if (!srcAcc || srcAcc.balance < totalDeducted) {
        alert('Saldo sumber tidak mencukupi');
        return false;
      }
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === transfer.fromAccountId) {
            return { ...a, balance: a.balance - totalDeducted, updatedAt: Date.now() };
          }
          return a;
        })
      );
    }

    // Add to destination account
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id === transfer.toAccountId) {
          return { ...a, balance: a.balance + transfer.amount, updatedAt: Date.now() };
        }
        return a;
      })
    );

    // Record transfer log
    const transferRecord: BalanceTransfer = {
      ...transfer,
      id: `mutasi-${Date.now()}`,
      timestamp: Date.now(),
      invoiceNumber: `MUT-${Date.now().toString().slice(-6)}`,
    };
    setTransferHistory((prev) => [transferRecord, ...prev]);

    return true;
  };

  // 4. Update Account Balance Directly
  const handleUpdateAccountBalance = (accountId: AccountKey, newBalance: number) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, balance: newBalance, updatedAt: Date.now() } : a))
    );
  };

  // 5. Update Cash on Hand Directly
  const handleUpdateCashOnHand = (newCash: number) => {
    setCashOnHand(newCash);
  };

  // 6. Save Settings
  const handleSaveSettings = (newSettings: RilcellSettings) => {
    setSettings(newSettings);
  };

  // 7. Export / Import / Reset Data
  const handleExportAllData = () => {
    const backup = {
      version: 'rilcell_v2',
      exportDate: new Date().toISOString(),
      accounts,
      transactions,
      transferHistory,
      settings,
      cashOnHand,
      presets,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `rilcell-backup-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  const handleImportAllData = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (Array.isArray(data.transferHistory)) setTransferHistory(data.transferHistory);
        if (data.settings) setSettings(data.settings);
        if (typeof data.cashOnHand === 'number') setCashOnHand(data.cashOnHand);
        if (Array.isArray(data.presets)) setPresets(data.presets);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  };

  const handleResetToDemo = () => {
    setAccounts(INITIAL_MODAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setTransferHistory([]);
    setSettings(INITIAL_SETTINGS);
    setCashOnHand(INITIAL_SETTINGS.cashOnHand);
    setPresets(QUICK_PRESETS);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 pb-20 md:pb-8">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        accounts={accounts}
        lowBalanceCount={lowBalanceCount}
        presetsCount={presets.length}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-6">
        {activeTab === 'entry' && (
          <QuickEntryForm
            accounts={accounts}
            presets={presets}
            onSubmitTransaction={handleCreateTransaction}
            onSelectTransactionReceipt={(trx) => setActiveReceiptTrx(trx)}
            onOpenMasterProducts={() => setActiveTab('products')}
            selectedPresetToFill={selectedPresetToFill}
            onClearSelectedPreset={() => setSelectedPresetToFill(null)}
          />
        )}

        {activeTab === 'saldo' && (
          <SaldoModalManager
            accounts={accounts}
            cashOnHand={cashOnHand}
            lowBalanceThreshold={settings.lowBalanceThreshold}
            onUpdateAccountBalance={handleUpdateAccountBalance}
            onTransferBalance={handleTransferBalance}
            onUpdateCashOnHand={handleUpdateCashOnHand}
            transferHistory={transferHistory}
          />
        )}

        {activeTab === 'products' && (
          <MasterProductManager
            presets={presets}
            accounts={accounts}
            onAddPreset={handleAddPreset}
            onUpdatePreset={handleUpdatePreset}
            onDeletePreset={handleDeletePreset}
            onResetPresets={handleResetPresets}
            onSelectPresetToTransact={(preset) => {
              setSelectedPresetToFill(preset);
              setActiveTab('entry');
            }}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistoryView
            transactions={transactions}
            accounts={accounts}
            settings={settings}
            onToggleStatus={handleToggleStatus}
            onSelectReceipt={(trx) => setActiveReceiptTrx(trx)}
          />
        )}

        {activeTab === 'analytics' && (
          <DashboardAnalyticsView
            transactions={transactions}
            accounts={accounts}
            cashOnHand={cashOnHand}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            accounts={accounts}
            transactions={transactions}
            presetsCount={presets.length}
            onSaveSettings={handleSaveSettings}
            onExportAllData={handleExportAllData}
            onImportAllData={handleImportAllData}
            onResetToDemo={handleResetToDemo}
            onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
            onOpenMasterProducts={() => setActiveTab('products')}
          />
        )}
      </main>

      {/* Thermal & WhatsApp Receipt Modal */}
      <RilcellReceiptModal
        transaction={activeReceiptTrx}
        settings={settings}
        isOpen={!!activeReceiptTrx}
        onClose={() => setActiveReceiptTrx(null)}
      />

      {/* Mobile Install Guide Modal */}
      <InstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />

      {/* Offline Status Pill */}
      <OfflineIndicator />
    </div>
  );
}
export default App;
