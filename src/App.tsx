import React, { useState, useEffect } from 'react';
import { 
  ModalAccount, 
  RilcellTransaction, 
  BalanceTransfer, 
  RilcellSettings, 
  AccountKey,
  QuickPresetProduct,
  CustomerRecord,
  ServiceCategory
} from './types';
import { 
  INITIAL_MODAL_ACCOUNTS, 
  INITIAL_SETTINGS, 
  INITIAL_TRANSACTIONS,
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
import { generateInvoiceNumber } from './utils/formatters';
import { sendTransactionToGoogleSheets } from './services/googleSheetsService';

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

  // Customers Database State
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading customers:', e);
    }
    return INITIAL_CUSTOMERS;
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

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

  // Customer CRUD Handlers
  const handleAddCustomer = (newCustData: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCust: CustomerRecord = {
      ...newCustData,
      id: `cust-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCustomers((prev) => [newCust, ...prev]);
  };

  const handleUpdateCustomer = (id: string, updatedFields: Partial<CustomerRecord>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields, updatedAt: Date.now() } : c))
    );
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleResetCustomers = () => {
    setCustomers(INITIAL_CUSTOMERS);
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

    // Add selling price to the selected payment method's destination balance / cash on hand
    if (!trxData.paymentMethod || trxData.paymentMethod === 'tunai') {
      setCashOnHand((prev) => prev + trxData.sellingPrice);
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

    if (newStatus === 'gagal') {
      if (!isPhysical) {
        // Revert: refund costPrice back to modal account
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
      } else {
        // Revert physical stock: return qty pcs to preset stock
        const qty = target.quantity || 1;
        if (target.presetId) {
          setPresets((prev) =>
            prev.map((p) =>
              p.id === target.presetId
                ? { ...p, stockQuantity: (p.stockQuantity ?? 0) + qty }
                : p
            )
          );
        }
      }
      // Revert received selling price from the chosen payment method
      if (!target.paymentMethod || target.paymentMethod === 'tunai') {
        setCashOnHand((prev) => Math.max(0, prev - target.sellingPrice));
      } else {
        const destId = target.destinationAccountId;
        if (destId) {
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === destId
                ? { ...acc, balance: Math.max(0, acc.balance - target.sellingPrice), updatedAt: Date.now() }
                : acc
            )
          );
        } else if (target.paymentMethod === 'qris') {
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.category === 'merchant' || acc.id.toLowerCase().includes('qris') || acc.id === 'gopay_merchant'
                ? { ...acc, balance: Math.max(0, acc.balance - target.sellingPrice), updatedAt: Date.now() }
                : acc
            )
          );
        } else if (target.paymentMethod === 'transfer') {
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.category === 'bank' || acc.category === 'ewallet'
                ? { ...acc, balance: Math.max(0, acc.balance - target.sellingPrice), updatedAt: Date.now() }
                : acc
            )
          );
        }
      }
    } else {
      if (!isPhysical) {
        // Re-apply: deduct costPrice from modal account
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
      } else {
        // Deduct qty pcs stock
        const qty = target.quantity || 1;
        if (target.presetId) {
          setPresets((prev) =>
            prev.map((p) =>
              p.id === target.presetId
                ? { ...p, stockQuantity: Math.max(0, (p.stockQuantity ?? 1) - qty) }
                : p
            )
          );
        }
      }
      // Re-add received selling price to the chosen payment method
      if (!target.paymentMethod || target.paymentMethod === 'tunai') {
        setCashOnHand((prev) => prev + target.sellingPrice);
      } else {
        const destId = target.destinationAccountId;
        if (destId) {
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === destId
                ? { ...acc, balance: acc.balance + target.sellingPrice, updatedAt: Date.now() }
                : acc
            )
          );
        } else if (target.paymentMethod === 'qris') {
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.category === 'merchant' || acc.id.toLowerCase().includes('qris') || acc.id === 'gopay_merchant'
                ? { ...acc, balance: acc.balance + target.sellingPrice, updatedAt: Date.now() }
                : acc
            )
          );
        } else if (target.paymentMethod === 'transfer') {
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.category === 'bank' || acc.category === 'ewallet'
                ? { ...acc, balance: acc.balance + target.sellingPrice, updatedAt: Date.now() }
                : acc
            )
          );
        }
      }
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  // 3. Transfer Balance / Top-Up Modal Handler (Supports Supplier without deducting internal accounts)
  const handleTransferBalance = (
    transfer: Omit<BalanceTransfer, 'id' | 'timestamp' | 'invoiceNumber'>
  ): boolean => {
    const totalDeducted = transfer.amount + transfer.fee;

    if (transfer.fromAccountId === 'pemasok_luar') {
      // Top-up from external supplier: no deduction from internal accounts
    } else if (transfer.fromAccountId === 'kas_tunai') {
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

  const handleResetToDemo = () => {
    setAccounts(INITIAL_MODAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setTransferHistory([]);
    setSettings(INITIAL_SETTINGS);
    setCashOnHand(INITIAL_SETTINGS.cashOnHand);
    setPresets(QUICK_PRESETS);
    setCustomers(INITIAL_CUSTOMERS);
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
        customersCount={customers.length}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-6 pb-24 md:pb-8">
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

      {/* Offline Status Pill */}
      <OfflineIndicator />
    </div>
  );
}
export default App;
