export interface VersionInfo {
  version: string;
  buildCode: number;
  buildDate: string;
  releaseNotes: string[];
}

export const APP_VERSION_INFO: VersionInfo = {
  version: '1.2.0',
  buildCode: 120,
  buildDate: '18 September 2026',
  releaseNotes: [
    'Tampilan menu Pengaturan baru bergaya daftar vertikal (list) ramah mobile',
    'Navigasi sub-menu halaman penuh dengan tombol kembali',
    'Sinkronisasi realtime database Google Firebase Firestore',
    'Dukungan integrasi Google Sheets 2 arah',
    'PWA Offline Ready dengan instalasi WebAPK Android & iOS',
  ],
};

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
