export interface ChangelogItem {
  type: 'feature' | 'improvement' | 'fix';
  title: string;
  description: string;
}

export interface VersionInfo {
  version: string;
  buildCode: number;
  buildDate: string;
  title: string;
  highlights: string[];
  items: ChangelogItem[];
}

export const APP_VERSION_INFO: VersionInfo = {
  version: '1.2.0',
  buildCode: 120,
  buildDate: '18 September 2026',
  title: 'Pembaruan Tampilan Mobile & Cloud Realtime',
  highlights: [
    'Menu Pengaturan Baru: Navigasi vertikal (list) full screen yang jauh lebih rapi di HP kasir',
    'Sinkronisasi Cloud Realtime Firebase: Data transaksi & saldo otomatis aman tersimpan di cloud',
    'Integrasi Google Sheets 2 Arah: Laporan keuangan toko sinkron otomatis ke spreadsheet',
    'Notifikasi Update Otomatis: Karyawan langsung tahu pembaruan fitur tanpa buka Play Store'
  ],
  items: [
    {
      type: 'feature',
      title: 'Desain Menu Pengaturan List Mobile-First',
      description: 'Pengaturan kini tersusun dalam daftar vertikal dengan tombol kembali, memudahkan pengelolaan akun modal, produk cepat, dan data pelanggan di layar smartphone.'
    },
    {
      type: 'feature',
      title: 'Pop-up Otomatis "Apa yang Baru"',
      description: 'Setiap kali toko mengupdate sistem, pop-up informatif ini otomatis muncul agar kasir langsung paham perubahan fitur baru.'
    },
    {
      type: 'improvement',
      title: 'PWA WebAPK Offline-Ready',
      description: 'Aplikasi kasir tetap bisa dibuka dan mencatat transaksi meskipun koneksi internet kasir sedang tidak stabil.'
    },
    {
      type: 'improvement',
      title: 'Cetak Struk & Ekspor Transaksi Rapi',
      description: 'Format struk kasir RILCELL yang presisi untuk printer thermal Bluetooth 58mm/80mm serta salin teks WhatsApp.'
    }
  ],
};

const STORAGE_KEY_SEEN_VERSION = 'rilcell_seen_app_version';

export function isNewVersionAvailable(): boolean {
  try {
    const seenVersion = localStorage.getItem(STORAGE_KEY_SEEN_VERSION);
    if (!seenVersion) {
      // First time user or first time this version system is deployed
      return true;
    }
    return seenVersion !== APP_VERSION_INFO.version;
  } catch {
    return false;
  }
}

export function markCurrentVersionAsSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY_SEEN_VERSION, APP_VERSION_INFO.version);
  } catch (e) {
    console.error('Failed to save seen version:', e);
  }
}

export async function checkPWAUpdate(): Promise<{ hasUpdate: boolean; message: string }> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          return {
            hasUpdate: true,
            message: 'Versi baru terdeteksi! Memperbarui aplikasi...',
          };
        }
      }
    } catch (e) {
      console.warn('Gagal memeriksa update service worker:', e);
    }
  }
  return {
    hasUpdate: false,
    message: 'Aplikasi sudah menggunakan versi terbaru (v' + APP_VERSION_INFO.version + ').',
  };
}
