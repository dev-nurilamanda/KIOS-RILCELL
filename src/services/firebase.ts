import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  writeBatch,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { 
  RilcellTransaction, 
  ModalAccount, 
  BalanceTransfer, 
  QuickPresetProduct, 
  CustomerRecord, 
  RilcellSettings 
} from '../types';

// Firebase configuration
const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore with custom database ID if available
export const db = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Enable offline persistence if in browser environment
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firebase persistence failed: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firebase persistence not supported by browser');
      }
    });
  } catch (e) {
    console.warn('IndexedDb persistence setup note:', e);
  }
}

// Collections references
export const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
  TRANSFERS: 'transfers',
  PRESETS: 'presets',
  CUSTOMERS: 'customers',
  SETTINGS: 'settings',
};

// Sync Handlers
export const syncTransactionToCloud = async (transaction: RilcellTransaction) => {
  try {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, transaction.id);
    await setDoc(docRef, transaction, { merge: true });
    return true;
  } catch (error) {
    console.warn('Error syncing transaction to cloud:', error);
    return false;
  }
};

export const syncAllTransactionsToCloud = async (transactions: RilcellTransaction[]) => {
  try {
    const batch = writeBatch(db);
    transactions.slice(0, 450).forEach((t) => {
      const docRef = doc(db, COLLECTIONS.TRANSACTIONS, t.id);
      batch.set(docRef, t, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.warn('Error batch syncing transactions to cloud:', error);
    return false;
  }
};

export const deleteTransactionFromCloud = async (transactionId: string) => {
  try {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn('Error deleting transaction from cloud:', error);
    return false;
  }
};

// Clear entire collection from Cloud Firestore
export const clearCollectionFromCloud = async (collectionName: string) => {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    if (snapshot.empty) return true;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.warn(`Error clearing cloud collection ${collectionName}:`, error);
    return false;
  }
};

export const clearAllTransactionsFromCloud = async () => {
  return clearCollectionFromCloud(COLLECTIONS.TRANSACTIONS);
};

export const clearAllTransfersFromCloud = async () => {
  return clearCollectionFromCloud(COLLECTIONS.TRANSFERS);
};

export const clearAllCustomersFromCloud = async () => {
  return clearCollectionFromCloud(COLLECTIONS.CUSTOMERS);
};

export const clearAllPresetsFromCloud = async () => {
  return clearCollectionFromCloud(COLLECTIONS.PRESETS);
};

export const syncAccountsToCloud = async (accounts: ModalAccount[]) => {
  try {
    const batch = writeBatch(db);
    accounts.forEach((acc) => {
      const docRef = doc(db, COLLECTIONS.ACCOUNTS, acc.id);
      batch.set(docRef, acc, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.warn('Error syncing accounts to cloud:', error);
    return false;
  }
};

export const syncTransferToCloud = async (transfer: BalanceTransfer) => {
  try {
    const docRef = doc(db, COLLECTIONS.TRANSFERS, transfer.id);
    await setDoc(docRef, transfer, { merge: true });
    return true;
  } catch (error) {
    console.warn('Error syncing transfer to cloud:', error);
    return false;
  }
};

export const syncPresetsToCloud = async (presets: QuickPresetProduct[]) => {
  try {
    const batch = writeBatch(db);
    presets.forEach((p) => {
      const docRef = doc(db, COLLECTIONS.PRESETS, p.id);
      batch.set(docRef, p, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.warn('Error syncing presets to cloud:', error);
    return false;
  }
};

export const syncCustomersToCloud = async (customers: CustomerRecord[]) => {
  try {
    const batch = writeBatch(db);
    customers.forEach((c) => {
      const docRef = doc(db, COLLECTIONS.CUSTOMERS, c.id);
      batch.set(docRef, c, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.warn('Error syncing customers to cloud:', error);
    return false;
  }
};

export const syncSettingsAndCashToCloud = async (settings: RilcellSettings, cashOnHand: number) => {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'config');
    await setDoc(docRef, { ...settings, cashOnHand, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (error) {
    console.warn('Error syncing settings to cloud:', error);
    return false;
  }
};

// Initial Cloud Fetch Helper
export const fetchAllFromCloud = async () => {
  try {
    const [trxSnap, accSnap, trfSnap, preSnap, cusSnap, setSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.TRANSACTIONS)),
      getDocs(collection(db, COLLECTIONS.ACCOUNTS)),
      getDocs(collection(db, COLLECTIONS.TRANSFERS)),
      getDocs(collection(db, COLLECTIONS.PRESETS)),
      getDocs(collection(db, COLLECTIONS.CUSTOMERS)),
      getDocs(collection(db, COLLECTIONS.SETTINGS)),
    ]);

    const transactions = trxSnap.docs.map((d) => d.data() as RilcellTransaction);
    const accounts = accSnap.docs.map((d) => d.data() as ModalAccount);
    const transfers = trfSnap.docs.map((d) => d.data() as BalanceTransfer);
    const presets = preSnap.docs.map((d) => d.data() as QuickPresetProduct);
    const customers = cusSnap.docs.map((d) => d.data() as CustomerRecord);
    const settingsDoc = setSnap.docs.find((d) => d.id === 'config')?.data() as (RilcellSettings & { cashOnHand?: number }) | undefined;

    const isCloudConfigured = !setSnap.empty || !accSnap.empty || !trxSnap.empty;

    return {
      isCloudConfigured,
      transactions: transactions.sort((a, b) => b.timestamp - a.timestamp),
      accounts: accounts.length > 0 ? accounts : null,
      transfers: transfers.sort((a, b) => b.timestamp - a.timestamp),
      presets: presets.length > 0 ? presets : null,
      customers: customers.length > 0 ? customers : null,
      settings: settingsDoc || null,
      cashOnHand: typeof settingsDoc?.cashOnHand === 'number' ? settingsDoc.cashOnHand : null,
    };
  } catch (error) {
    console.warn('Error fetching all data from cloud:', error);
    return null;
  }
};
