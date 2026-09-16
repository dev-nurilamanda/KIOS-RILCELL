import React, { useState } from 'react';
import { Store, Receipt, Percent, Save, Download, Upload, RotateCcw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { StoreSettings } from '../types';

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings) => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => boolean;
  onResetToDemo: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onExportAllData,
  onImportAllData,
  onResetToDemo,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = onImportAllData(text);
        if (success) {
          setImportError(null);
          alert('Data berhasil diimpor!');
        } else {
          setImportError('Format file JSON tidak valid.');
        }
      } catch (err) {
        setImportError('Gagal membaca file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Pengaturan Kasir & Toko</h2>
        <p className="text-xs text-slate-500">
          Kelola profil toko, nama kasir, format struk, dan cadangan data aplikasi
        </p>
      </div>

      {/* Save Success Alert */}
      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan toko berhasil diperbarui!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Toko */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Identitas Toko / Usaha</h3>
              <p className="text-xs text-slate-400">Informasi ini akan dicetak pada bagian atas struk</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Toko / Resto / Cafe *
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="Contoh: Kopi Kenangan Kita"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Contoh: Nikmat Rasanya, Hemat Harganya"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Petugas Kasir Saat Ini
              </label>
              <input
                type="text"
                value={formData.cashierName}
                onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                placeholder="Contoh: Kasir 01 (Budi)"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lengkap Toko
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Contoh: Jl. Ahmad Yani No. 88, Surabaya"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Pajak & Struk */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pajak (PPN) & Format Struk</h3>
              <p className="text-xs text-slate-400">Atur penghitungan PPN otomatis dan pesan penutup</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tarif PPN Bawaan (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.taxRatePercent}
                  onChange={(e) =>
                    setFormData({ ...formData, taxRatePercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={formData.enableTax}
                  onChange={(e) => setFormData({ ...formData, enableTax: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Aktifkan PPN secara bawaan pada pesanan baru</span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pesan Footer Struk (Catatan Penutup)
              </label>
              <textarea
                rows={3}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                placeholder="Contoh: Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Cadangan & Pemulihan Data (Backup / Restore) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cadangan & Pemulihan Data</h3>
            <p className="text-xs text-slate-400">
              Amankan data produk dan transaksi ke komputer Anda dalam format JSON
            </p>
          </div>
        </div>

        {importError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>{importError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Backup Button */}
          <button
            onClick={onExportAllData}
            className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-center"
          >
            <Download className="w-5 h-5 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-slate-800">Cadangkan Data (JSON)</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Unduh data produk & transaksi</span>
          </button>

          {/* Restore Button */}
          <label className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-center cursor-pointer">
            <Upload className="w-5 h-5 text-blue-600 mb-2" />
            <span className="text-xs font-bold text-slate-800">Pulihkan Data (JSON)</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Unggah berkas cadangan JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (
                confirm(
                  'Apakah Anda ingin memuat kembali data demo awal? Produk dan transaksi akan disesuaikan ke contoh awal.'
                )
              ) {
                onResetToDemo();
              }
            }}
            className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-center"
          >
            <RotateCcw className="w-5 h-5 text-amber-600 mb-2" />
            <span className="text-xs font-bold text-slate-800">Muat Ulang Demo</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Kembalikan produk & sampel awal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
