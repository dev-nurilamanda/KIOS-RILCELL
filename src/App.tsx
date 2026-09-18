import React, { useState, useEffect } from 'react';
import { 
  ModalAccount, 
  RilcellTransaction, 
  BalanceTransfer, 
  RilcellSettings, 
  AccountKey,
  QuickPresetProduct,
  CustomerRecord,
  ServiceCategory,
  ClearDemoOptions
} from './types';
import { 
  DEFAULT_OPERATIONAL_ACCOUNTS, 
  DEFAULT_OPERATIONAL_SETTINGS,
  DEMO_MODAL_ACCOUNTS,
  DEMO_SETTINGS,
  DEMO_TRANSACTIONS,
  DEMO_CUSTOMERS,
  QUICK_PRESETS,
  INITIAL_CUSTOMERS
} from './data/initialData';
import { Navbar, RilcellNavTab } from './components/Navbar';
import { QuickEntryForm } from './components/QuickEntryForm';
import { SaldoModalManager } from './components/SaldoModalManager';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { DashboardAnalyticsView } from './components/DashboardAnalyticsView';
import { SettingsView } from './components/SettingsView';
import { MasterProductManager } from './components/MasterProductManager';
import { CustomerManager } from './components/CustomerManager';
import { RilcellReceiptModal } from './components/RilcellReceiptModal';
import { InstallGuideModal } from './components/InstallGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TransferModal } from './components/TransferModal';
import { WhatsNewModal } from './components/WhatsNewModal';
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner';
import { isNewVersionAvailable } from './utils/version';
import { generateInvoiceNumber } from './utils/formatters';
import { sendTransactionToGoogleSheets } from './services/googleSheetsService';
import { 
  syncTransactionToCloud,
  syncAllTransactionsToCloud,
  deleteTransactionFromCloud,
  deletePresetFromCloud,
  deleteCustomerFromCloud,
  syncAccountsToCloud,
  syncTransferToCloud,
  syncPresetsToCloud,
  syncCustomersToCloud,
  syncSettingsAndCashToCloud,
  clearAllTransactionsFromCloud,
  clearAllTransfersFromCloud,
  clearAllCustomersFromCloud,
  clearAllPresetsFromCloud,
  fetchAllFromCloud
} from './services/firebase';

const STORAGE_KEYS = {
  ACCOUNTS: 'rilcell_accounts_v2',
  TRANSACTIONS: 'rilcell_transactions_v2',
  TRANSFERS: 'rilcell_transfers_v2',
  SETTINGS: 'rilcell_settings_v2',
  CASH: 'rilcell_cash_v2',
  PRESETS: 'rilcell_presets_v2',
  CUSTOMERS: 'rilcell_customers_v2',
};

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<RilcellNavTab>('entry');

  // Accounts State (Defaults to 0 balance for clean real store operations)
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
    return DEFAULT_OPERATIONAL_ACCOUNTS;
  });

  // Transactions State (Defaults to clean empty list)
  const [transactions, setTransactions] = useState<RilcellTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading transactions:', e);
    }
    return [];
  });

  // Transfers History State (Defaults to clean empty list)
  const [transferHistory, setTransferHistory] = useState<BalanceTransfer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      if (saved !== null) {
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
    return DEFAULT_OPERATIONAL_SETTINGS;
  });

  // Cash on Hand State (Defaults to 0)
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
    return 0;
  });

  // Master Presets State (Product Presets)
  const [presets, setPresets] = useState<QuickPresetProduct[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading presets:', e);
    }
    return QUICK_PRESETS;
  });

  // Selected Preset to auto-fill into transaction form
  const [selectedPresetToFill, setSelectedPresetToFill] = useState<QuickPresetProduct | null>(null);

  // Customers Database State (Defaults to clean empty list)
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading customers:', e);
    }
    return [];
  });

  const [selectedCustomerToFill, setSelectedCustomerToFill] = useState<{
    customer: CustomerRecord;
    category: ServiceCategory;
    targetValue: string;
  } | null>(null);

  // Modals State
  const [activeReceiptTrx, setActiveReceiptTrx] = useState<RilcellTransaction | null>(null);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isEditCashModalOpen, setIsEditCashModalOpen] = useState(false);
  const [tempCashInput, setTempCashInput] = useState('');
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  // Check for new app version updates
  useEffect(() => {
    if (isNewVersionAvailable()) {
      const timer = setTimeout(() => {
        setIsWhatsNewOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Firebase Cloud Synchronization
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Sync from Firestore on initial mount
  useEffect(() => {
    let isMounted = true;
    fetchAllFromCloud().then((cloudData) => {
      if (!isMounted || !cloudData) return;
      setIsCloudSynced(true);

      if (cloudData.isCloudConfigured) {
        // Cloud has existing data records
        if (cloudData.transactions !== null) {
          setTransactions(cloudData.transactions);
        }
        if (cloudData.accounts && cloudData.accounts.length > 0) {
          setAccounts(cloudData.accounts);
        }
        if (cloudData.transfers !== null) {
          setTransferHistory(cloudData.transfers);
        }
        if (cloudData.presets !== null) {
          setPresets(cloudData.presets);
        }
        if (cloudData.customers !== null) {
          setCustomers(cloudData.customers);
        }
        if (cloudData.settings) {
          setSettings((prev) => ({ ...prev, ...cloudData.settings }));
        }
        if (typeof cloudData.cashOnHand === 'number') {
          setCashOnHand(cloudData.cashOnHand);
        }
      } else {
        // Initial clean boot - sync clean initial structure without injecting demo transactions
        syncAccountsToCloud(accounts);
        syncSettingsAndCashToCloud(settings, cashOnHand);
        if (presets.length > 0) {
          syncPresetsToCloud(presets);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  // Apply Theme Mode (light, dark, system)
  useEffect(() => {
    const theme = settings.theme || 'system';
    const root = document.documentElement;

    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        isDark = Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      }

      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }

      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#090d16' : '#059669');
      }
    };

    applyTheme();

    if (theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
      } else if (mediaQuery.addListener) {
        // Fallback for older browsers
        mediaQuery.addListener(listener);
        return () => mediaQuery.removeListener(listener);
      }
    }
  }, [settings.theme]);

    // Master Preset CRUD Handlers
  const handleAddPreset = (newPresetData: Omit<QuickPresetProduct, 'id'>) => {
    const newPreset: QuickPresetProduct = {
      ...newPresetData,
      id: `qp-${Date.now()}`,
    };
    setPresets((prev) => {
      const updated = [newPreset, ...prev];
      syncPresetsToCloud(updated);
      return updated;
    });
  };

  const handleUpdatePreset = (id: string, updatedFields: Partial<QuickPresetProduct>) => {
    setPresets((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item));
      syncPresetsToCloud(updated);
      return updated;
    });
  };

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(updated));
      return updated;
    });
    deletePresetFromCloud(id);
  };

  const handleClearAllPresets = async () => {
    setPresets([]);
    localStorage.setItem(STORAGE_KEYS.PRESETS, '[]');
    await clearAllPresetsFromCloud();
  };

  const handleResetPresets = () => {
    setPresets(QUICK_PRESETS);
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(QUICK_PRESETS));
    syncPresetsToCloud(QUICK_PRESETS);
  };

  // Customer CRUD Handlers
  const handleAddCustomer = (newCustData: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCust: CustomerRecord = {
      ...newCustData,
      id: `cust-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCustomers((prev) => {
      const updated = [newCust, ...prev];
      syncCustomersToCloud(updated);
      return updated;
    });
  };

  const handleUpdateCustomer = (id: string, updatedFields: Partial<CustomerRecord>) => {
    setCustomers((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updatedFields, updatedAt: Date.now() } : c));
      syncCustomersToCloud(updated);
      return updated;
    });
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
      return updated;
    });
    deleteCustomerFromCloud(id);
  };

  const handleResetCustomers = () => {
    setCustomers(INITIAL_CUSTOMERS);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    syncCustomersToCloud(INITIAL_CUSTOMERS);
  };

  // Low Balance Accounts Alert Count
  const lowBalanceCount = accounts.filter(
    (a) => a.balance <= (a.minAlertThreshold || settings.lowBalanceThreshold)
  ).length;

  // 1. Submit New Transaction Handler
  const handleCreateTransaction = (
    trxData: Omit<RilcellTransaction, 'id' | 'invoiceNumber' | 'timestamp' | 'status' | 'syncedToSheets'>
  ): boolean => {
    const isPhysical = trxData.productType === 'fisik' || trxData.sourceAccountId === 'stok_fisik';

    if (!isPhysical) {
      const sourceAcc = accounts.find((a) => a.id === trxData.sourceAccountId);
      if (!sourceAcc) {
        alert('Akun modal sumber tidak ditemukan!');
        return false;
      }

      if (sourceAcc.balance < trxData.costPrice) {
        alert(`Saldo ${sourceAcc.name} tidak mencukupi untuk transaksi ini.`);
        return false;
      }
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

    let updatedAccounts = accounts;
    if (!isPhysical) {
      // Deduct cost price from source modal account
      updatedAccounts = accounts.map((acc) => {
        if (acc.id === trxData.sourceAccountId) {
          return {
            ...acc,
            balance: acc.balance - trxData.costPrice,
            updatedAt: Date.now(),
          };
        }
        return acc;
      });
      setAccounts(updatedAccounts);
    } else {
      // Physical product: deduct quantity pcs from preset stock
      const qty = trxData.quantity || 1;
      if (trxData.presetId) {
        setPresets((prev) =>
          prev.map((p) =>
            p.id === trxData.presetId
              ? { ...p, stockQuantity: Math.max(0, (p.stockQuantity ?? 1) - qty) }
              : p
          )
        );
      } else {
        setPresets((prev) =>
          prev.map((p) =>
            p.name.toLowerCase() === trxData.serviceName.toLowerCase() && p.productType === 'fisik'
              ? { ...p, stockQuantity: Math.max(0, (p.stockQuantity ?? 1) - qty) }
              : p
          )
        );
      }
    }

    let finalCashOnHand = cashOnHand;
    if (!trxData.paymentMethod || trxData.paymentMethod === 'tunai') {
      finalCashOnHand = cashOnHand + trxData.sellingPrice;
      setCashOnHand(finalCashOnHand);
    } else {
      // Find destination account explicitly chosen or fallback
      let destAccount = trxData.destinationAccountId
        ? updatedAccounts.find((a) => a.id === trxData.destinationAccountId)
        : null;

      if (!destAccount) {
        if (trxData.paymentMethod === 'qris') {
          destAccount = updatedAccounts.find(
            (a) => a.category === 'merchant' || a.id.toLowerCase().includes('qris') || a.id === 'gopay_merchant'
          ) || updatedAccounts.find((a) => a.category === 'ewallet');
        } else if (trxData.paymentMethod === 'transfer') {
          destAccount = updatedAccounts.find((a) => a.category === 'bank') || 
            updatedAccounts.find((a) => a.category === 'ewallet') || 
            updatedAccounts[0];
        }
      }

      if (destAccount) {
        updatedAccounts = updatedAccounts.map((acc) =>
          acc.id === destAccount!.id
            ? { ...acc, balance: acc.balance + trxData.sellingPrice, updatedAt: Date.now() }
            : acc
        );
        setAccounts(updatedAccounts);
      }
    }

    setTransactions((prev) => [newTransaction, ...prev]);

    // Sync to Firebase Cloud Firestore
    syncTransactionToCloud(newTransaction);
    syncAccountsToCloud(updatedAccounts);
    syncSettingsAndCashToCloud(settings, finalCashOnHand);

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

  // 2. Toggle Status (Sukses / Gagal with automatic refund & stock return logic)
  const handleToggleStatus = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    const newStatus = target.status === 'sukses' ? 'gagal' : 'sukses';
    const isPhysical = target.productType === 'fisik' || target.sourceAccountId === 'stok_fisik';
    let updatedAccs = [...accounts];
    let updatedCash = cashOnHand;

    if (newStatus === 'gagal') {
      if (!isPhysical) {
        // Revert: refund costPrice back to modal account
        updatedAccs = updatedAccs.map((acc) => {
          if (acc.id === target.sourceAccountId) {
            return {
              ...acc,
              balance: acc.balance + target.costPrice,
              updatedAt: Date.now(),
            };
          }
          return acc;
        });
        setAccounts(updatedAccs);
      } else {
        // Revert physical stock: return qty pcs to preset stock
        const qty = target.quantity || 1;
        if (target.presetId) {
          setPresets((prev) => {
            const updated = prev.map((p) =>
              p.id === target.presetId
                ? { ...p, stockQuantity: (p.stockQuantity ?? 0) + qty }
                : p
            );
            syncPresetsToCloud(updated);
            return updated;
          });
        }
      }
      // Revert received selling price from the chosen payment method
      if (!target.paymentMethod || target.paymentMethod === 'tunai') {
        updatedCash = Math.max(0, cashOnHand - target.sellingPrice);
        setCashOnHand(updatedCash);
      } else {
        const destId = target.destinationAccountId;
        if (destId) {
          updatedAccs = updatedAccs.map((acc) =>
            acc.id === destId
              ? { ...acc, balance: Math.max(0, acc.balance - target.sellingPrice), updatedAt: Date.now() }
              : acc
          );
          setAccounts(updatedAccs);
        } else if (target.paymentMethod === 'qris') {
          updatedAccs = updatedAccs.map((acc) =>
            acc.category === 'merchant' || acc.id.toLowerCase().includes('qris') || acc.id === 'gopay_merchant'
              ? { ...acc, balance: Math.max(0, acc.balance - target.sellingPrice), updatedAt: Date.now() }
              : acc
          );
          setAccounts(updatedAccs);
        } else if (target.paymentMethod === 'transfer') {
          updatedAccs = updatedAccs.map((acc) =>
            acc.category === 'bank' || acc.category === 'ewallet'
              ? { ...acc, balance: Math.max(0, acc.balance - target.sellingPrice), updatedAt: Date.now() }
              : acc
          );
          setAccounts(updatedAccs);
        }
      }
    } else {
      if (!isPhysical) {
        // Re-apply: deduct costPrice from modal account
        updatedAccs = updatedAccs.map((acc) => {
          if (acc.id === target.sourceAccountId) {
            return {
              ...acc,
              balance: Math.max(0, acc.balance - target.costPrice),
              updatedAt: Date.now(),
            };
          }
          return acc;
        });
        setAccounts(updatedAccs);
      } else {
        // Deduct qty pcs stock
        const qty = target.quantity || 1;
        if (target.presetId) {
          setPresets((prev) => {
            const updated = prev.map((p) =>
              p.id === target.presetId
                ? { ...p, stockQuantity: Math.max(0, (p.stockQuantity ?? 1) - qty) }
                : p
            );
            syncPresetsToCloud(updated);
            return updated;
          });
        }
      }
      // Re-add received selling price to the chosen payment method
      if (!target.paymentMethod || target.paymentMethod === 'tunai') {
        updatedCash = cashOnHand + target.sellingPrice;
        setCashOnHand(updatedCash);
      } else {
        const destId = target.destinationAccountId;
        if (destId) {
          updatedAccs = updatedAccs.map((acc) =>
            acc.id === destId
              ? { ...acc, balance: acc.balance + target.sellingPrice, updatedAt: Date.now() }
              : acc
          );
          setAccounts(updatedAccs);
        } else if (target.paymentMethod === 'qris') {
          updatedAccs = updatedAccs.map((acc) =>
            acc.category === 'merchant' || acc.id.toLowerCase().includes('qris') || acc.id === 'gopay_merchant'
              ? { ...acc, balance: acc.balance + target.sellingPrice, updatedAt: Date.now() }
              : acc
          );
          setAccounts(updatedAccs);
        } else if (target.paymentMethod === 'transfer') {
          updatedAccs = updatedAccs.map((acc) =>
            acc.category === 'bank' || acc.category === 'ewallet'
              ? { ...acc, balance: acc.balance + target.sellingPrice, updatedAt: Date.now() }
              : acc
          );
          setAccounts(updatedAccs);
        }
      }
    }

    const updatedTransaction = { ...target, status: newStatus };
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? updatedTransaction : t))
    );

    // Sync to Cloud
    syncTransactionToCloud(updatedTransaction);
    syncAccountsToCloud(updatedAccs);
    syncSettingsAndCashToCloud(settings, updatedCash);
  };

  // Delete Single Transaction Handler
  const handleDeleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;
    if (!window.confirm(`Hapus catatan transaksi ${target.invoiceNumber} (${target.serviceName})?`)) {
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    deleteTransactionFromCloud(id);
  };

  // 3. Transfer Balance / Top-Up Modal Handler (Supports Supplier without deducting internal accounts)
  const handleTransferBalance = (
    transfer: Omit<BalanceTransfer, 'id' | 'timestamp' | 'invoiceNumber'>
  ): boolean => {
    const totalDeducted = transfer.amount + transfer.fee;
    let updatedAccs = [...accounts];
    let updatedCash = cashOnHand;

    if (transfer.fromAccountId === 'pemasok_luar') {
      // Top-up from external supplier: no deduction from internal accounts
    } else if (transfer.fromAccountId === 'kas_tunai') {
      if (cashOnHand < totalDeducted) {
        alert('Kas tunai tidak mencukupi');
        return false;
      }
      updatedCash = cashOnHand - totalDeducted;
      setCashOnHand(updatedCash);
    } else {
      const srcAcc = accounts.find((a) => a.id === transfer.fromAccountId);
      if (!srcAcc || srcAcc.balance < totalDeducted) {
        alert('Saldo sumber tidak mencukupi');
        return false;
      }
      updatedAccs = updatedAccs.map((a) => {
        if (a.id === transfer.fromAccountId) {
          return { ...a, balance: a.balance - totalDeducted, updatedAt: Date.now() };
        }
        return a;
      });
      setAccounts(updatedAccs);
    }

    // Add to destination account
    updatedAccs = updatedAccs.map((a) => {
      if (a.id === transfer.toAccountId) {
        return { ...a, balance: a.balance + transfer.amount, updatedAt: Date.now() };
      }
      return a;
    });
    setAccounts(updatedAccs);

    // Record transfer log
    const transferRecord: BalanceTransfer = {
      ...transfer,
      id: `mutasi-${Date.now()}`,
      timestamp: Date.now(),
      invoiceNumber: `MUT-${Date.now().toString().slice(-6)}`,
    };
    setTransferHistory((prev) => [transferRecord, ...prev]);

    // Sync to Cloud
    syncTransferToCloud(transferRecord);
    syncAccountsToCloud(updatedAccs);
    syncSettingsAndCashToCloud(settings, updatedCash);

    return true;
  };

  // 4. Update Account Balance Directly
  const handleUpdateAccountBalance = (accountId: AccountKey, newBalance: number) => {
    setAccounts((prev) => {
      const updated = prev.map((a) => (a.id === accountId ? { ...a, balance: newBalance, updatedAt: Date.now() } : a));
      syncAccountsToCloud(updated);
      return updated;
    });
  };

  // 5. Update Cash on Hand Directly
  const handleUpdateCashOnHand = (newCash: number) => {
    setCashOnHand(newCash);
    syncSettingsAndCashToCloud(settings, newCash);
  };

  // 6. Save Settings
  const handleSaveSettings = (newSettings: RilcellSettings) => {
    setSettings(newSettings);
    syncSettingsAndCashToCloud(newSettings, cashOnHand);
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
      customers,
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
        if (Array.isArray(data.customers)) setCustomers(data.customers);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  };

  const handleResetToDemo = async () => {
    setAccounts(DEMO_MODAL_ACCOUNTS);
    setTransactions(DEMO_TRANSACTIONS);
    setTransferHistory([]);
    setSettings(DEMO_SETTINGS);
    setCashOnHand(DEMO_SETTINGS.cashOnHand);
    setPresets(QUICK_PRESETS);
    setCustomers(DEMO_CUSTOMERS);

    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEMO_MODAL_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEMO_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, '[]');
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEMO_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.CASH, String(DEMO_SETTINGS.cashOnHand));
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(QUICK_PRESETS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEMO_CUSTOMERS));

    await Promise.all([
      syncAllTransactionsToCloud(DEMO_TRANSACTIONS),
      syncAccountsToCloud(DEMO_MODAL_ACCOUNTS),
      syncSettingsAndCashToCloud(DEMO_SETTINGS, DEMO_SETTINGS.cashOnHand),
      syncPresetsToCloud(QUICK_PRESETS),
      syncCustomersToCloud(DEMO_CUSTOMERS),
      clearAllTransfersFromCloud(),
    ]);
  };

  // 8. Clear Demo Data for Real Operational Readiness
  const handleClearDemoData = async (options: ClearDemoOptions) => {
    if (options.clearTransactions) {
      setTransactions([]);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, '[]');
      await clearAllTransactionsFromCloud();
    }
    if (options.clearTransfers) {
      setTransferHistory([]);
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, '[]');
      await clearAllTransfersFromCloud();
    }
    if (options.clearCustomers) {
      setCustomers([]);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, '[]');
      await clearAllCustomersFromCloud();
    }
    if (options.resetBalancesToZero) {
      const zeroAccs = accounts.map((acc) => ({
        ...acc,
        balance: 0,
        initialBalance: 0,
        updatedAt: Date.now(),
      }));
      setAccounts(zeroAccs);
      setCashOnHand(0);
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(zeroAccs));
      localStorage.setItem(STORAGE_KEYS.CASH, '0');
      await syncAccountsToCloud(zeroAccs);
      await syncSettingsAndCashToCloud(settings, 0);
    }
    if (options.clearPresets) {
      setPresets([]);
      localStorage.setItem(STORAGE_KEYS.PRESETS, '[]');
      await clearAllPresetsFromCloud();
    }
    await syncSettingsAndCashToCloud(settings, options.resetBalancesToZero ? 0 : cashOnHand);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        accounts={accounts}
        lowBalanceCount={lowBalanceCount}
        presetsCount={presets.length}
        customersCount={customers.length}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-24 md:pb-8">
        {activeTab === 'entry' && (
          <div className="w-full max-w-4xl mx-auto">
            <QuickEntryForm
              accounts={accounts}
              presets={presets}
              cashOnHand={cashOnHand}
              onSubmitTransaction={handleCreateTransaction}
              onSelectTransactionReceipt={(trx) => setActiveReceiptTrx(trx)}
              onOpenMasterProducts={() => setActiveTab('products')}
              selectedPresetToFill={selectedPresetToFill}
              onClearSelectedPreset={() => setSelectedPresetToFill(null)}
              customers={customers}
              selectedCustomerToFill={selectedCustomerToFill}
              onClearSelectedCustomer={() => setSelectedCustomerToFill(null)}
              onOpenCustomerManager={() => setActiveTab('customers')}
              onQuickSaveCustomer={handleAddCustomer}
            />
          </div>
        )}

        {activeTab === 'customers' && (
          <CustomerManager
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onResetCustomers={handleResetCustomers}
            onSelectCustomerForTransaction={(customer, category, targetValue) => {
              setSelectedCustomerToFill({ customer, category, targetValue });
              setActiveTab('entry');
            }}
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
            onClearAllPresets={handleClearAllPresets}
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
            onDeleteTransaction={handleDeleteTransaction}
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
            customersCount={customers.length}
            transfersCount={transferHistory.length}
            cashOnHand={cashOnHand}
            onSaveSettings={handleSaveSettings}
            onExportAllData={handleExportAllData}
            onImportAllData={handleImportAllData}
            onResetToDemo={handleResetToDemo}
            onClearDemoData={handleClearDemoData}
            onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
            onOpenMasterProducts={() => setActiveTab('products')}
            onResetPresets={handleResetPresets}
            onRefreshApp={() => {
              window.location.reload();
            }}
          />
        )}
      </main>

      {/* Reusable Transfer Balance / Top-Up Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        cashOnHand={cashOnHand}
        onTransferBalance={handleTransferBalance}
      />

      {/* Quick Edit Cash on Hand Modal */}
      {isEditCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Sesuaikan Kas Fisik di Laci</h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui nominal fisik uang kertas & koin yang ada di laci konter saat ini.
            </p>
            <div className="relative mb-4">
              <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">Rp</span>
              <input
                type="number"
                step="1000"
                autoFocus
                value={tempCashInput}
                onChange={(e) => setTempCashInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditCashModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(tempCashInput.replace(/[^0-9]/g, ''), 10) || 0;
                  handleUpdateCashOnHand(val);
                  setIsEditCashModalOpen(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Simpan Kas
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* What's New & Release Changelog Modal */}
      <WhatsNewModal
        isOpen={isWhatsNewOpen}
        onClose={() => setIsWhatsNewOpen(false)}
        isAutoPrompt={true}
      />

      {/* Background Service Worker Update Banner */}
      <UpdateNotificationBanner />

      {/* Offline Status Pill */}
      <OfflineIndicator />
    </div>
  );
}
export default App;
