import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  X, 
  Phone, 
  Wallet, 
  Landmark, 
  Zap, 
  Gamepad2, 
  Edit, 
  Trash2, 
  Copy, 
  Check, 
  MessageCircle, 
  ArrowUpRight, 
  Download, 
  Upload, 
  RotateCcw,
  Sparkles,
  UserCheck,
  Building,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  CustomerRecord, 
  CustomerEWalletProfile, 
  CustomerBankAccount, 
  CustomerMeterProfile, 
  CustomerGameProfile, 
  ServiceCategory 
} from '../types';

interface CustomerManagerProps {
  customers: CustomerRecord[];
  onAddCustomer: (customer: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCustomer: (id: string, customer: Partial<CustomerRecord>) => void;
  onDeleteCustomer: (id: string) => void;
  onResetCustomers: () => void;
  onSelectCustomerForTransaction?: (
    customer: CustomerRecord, 
    category: ServiceCategory, 
    targetValue: string
  ) => void;
}

const SUPPORTED_GAMES: {
  key: CustomerGameProfile['gameKey'];
  name: string;
  hasZoneId: boolean;
  zonePlaceholder?: string;
  zoneLabel?: string;
  idPlaceholder: string;
  idLabel: string;
  servers?: string[];
}[] = [
  {
    key: 'mlbb',
    name: 'Mobile Legends: Bang Bang',
    hasZoneId: true,
    zonePlaceholder: 'Contoh: 2041',
    zoneLabel: 'Zone ID (4-5 Digit)',
    idPlaceholder: 'Contoh: 84729104',
    idLabel: 'User ID MLBB',
  },
  {
    key: 'ff',
    name: 'Free Fire / FF Max',
    hasZoneId: false,
    idPlaceholder: 'Contoh: 298174619 (8-10 digit)',
    idLabel: 'Player ID / UID Free Fire',
  },
  {
    key: 'pubgm',
    name: 'PUBG Mobile',
    hasZoneId: false,
    idPlaceholder: 'Contoh: 5123984712 (Numerik)',
    idLabel: 'Character ID PUBG',
  },
  {
    key: 'genshin',
    name: 'Genshin Impact / Honkai',
    hasZoneId: true,
    zonePlaceholder: 'Pilih Server',
    zoneLabel: 'Server Wilayah',
    servers: ['Asia', 'America', 'Europe', 'TW, HK, MO'],
    idPlaceholder: 'Contoh: 812948192 (9 digit)',
    idLabel: 'UID Akun',
  },
  {
    key: 'hok',
    name: 'Honor of Kings (HOK)',
    hasZoneId: false,
    idPlaceholder: 'Contoh: 284910284',
    idLabel: 'Player ID HOK',
  },
  {
    key: 'valorant',
    name: 'Valorant / Riot Games',
    hasZoneId: false,
    idPlaceholder: 'Contoh: Nickname#Tagline (Budi#IDN)',
    idLabel: 'Riot ID + Tagline',
  },
  {
    key: 'roblox',
    name: 'Roblox',
    hasZoneId: false,
    idPlaceholder: 'Username / User ID Roblox',
    idLabel: 'Username / ID',
  },
  {
    key: 'point_blank',
    name: 'Point Blank Zepetto',
    hasZoneId: false,
    idPlaceholder: 'User ID Zepetto PB',
    idLabel: 'ID Zepetto PB',
  },
  {
    key: 'codm',
    name: 'Call of Duty: Mobile (CODM)',
    hasZoneId: false,
    idPlaceholder: 'OpenID Akun CODM',
    idLabel: 'OpenID CODM',
  },
  {
    key: 'other',
    name: 'Game Lainnya',
    hasZoneId: true,
    zonePlaceholder: 'Server / Wilayah (opsional)',
    zoneLabel: 'Server / Wilayah',
    idPlaceholder: 'ID Akun / Karakter',
    idLabel: 'ID Akun Game',
  },
];

const BANK_OPTIONS = [
  'BCA', 'BRI', 'Mandiri', 'BNI', 'BSI', 'Bank Jago', 'SeaBank', 
  'CIMB Niaga', 'Bank Permata', 'Bank Danamon', 'BTN', 'Allo Bank', 'Lainnya'
];

const EWALLET_OPTIONS: CustomerEWalletProfile['walletType'][] = [
  'DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja', 'Lainnya'
];

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onResetCustomers,
  onSelectCustomerForTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'game' | 'pln' | 'ewallet' | 'bank'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [ewallets, setEwallets] = useState<CustomerEWalletProfile[]>([]);
  const [bankAccounts, setBankAccounts] = useState<CustomerBankAccount[]>([]);
  const [meterNumbers, setMeterNumbers] = useState<CustomerMeterProfile[]>([]);
  const [gameProfiles, setGameProfiles] = useState<CustomerGameProfile[]>([]);

  // Expanded Accordion Sections in Form
  const [showEwalletSection, setShowEwalletSection] = useState(true);
  const [showBankSection, setShowBankSection] = useState(true);
  const [showMeterSection, setShowMeterSection] = useState(true);
  const [showGameSection, setShowGameSection] = useState(true);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(`${label}: ${text}`);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Open Form for Adding New Customer
  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setEwallets([]);
    setBankAccounts([]);
    setMeterNumbers([]);
    setGameProfiles([]);
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Customer
  const openEditModal = (cust: CustomerRecord) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setAddress(cust.address || '');
    setNotes(cust.notes || '');
    setEwallets(cust.ewallets || []);
    setBankAccounts(cust.bankAccounts || []);
    setMeterNumbers(cust.meterNumbers || []);
    setGameProfiles(cust.gameProfiles || []);
    setIsFormOpen(true);
  };

  // Sub-items adders in form
  const addEwalletRow = () => {
    setEwallets([
      ...ewallets,
      {
        id: `ew-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        walletType: 'DANA',
        phoneNumber: phone || '',
        accountHolder: name || '',
      },
    ]);
  };

  const addBankRow = () => {
    setBankAccounts([
      ...bankAccounts,
      {
        id: `bk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        bankName: 'BCA',
        accountNumber: '',
        accountHolder: name || '',
      },
    ]);
  };

  const addMeterRow = () => {
    setMeterNumbers([
      ...meterNumbers,
      {
        id: `mt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        meterNumber: '',
        ownerName: name || '',
        tariffPower: 'R1/1300 VA',
        locationNote: 'Rumah',
      },
    ]);
  };

  const addGameRow = (presetKey: CustomerGameProfile['gameKey'] = 'mlbb') => {
    const gameConfig = SUPPORTED_GAMES.find((g) => g.key === presetKey) || SUPPORTED_GAMES[0];
    setGameProfiles([
      ...gameProfiles,
      {
        id: `gm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        gameKey: gameConfig.key,
        gameName: gameConfig.name,
        userId: '',
        zoneId: gameConfig.hasZoneId ? (gameConfig.servers ? gameConfig.servers[0] : '') : undefined,
        nickname: '',
      },
    ]);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Mohon isi nama pelanggan.');
      return;
    }

    if (editingCustomer) {
      onUpdateCustomer(editingCustomer.id, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        ewallets: ewallets.filter((e) => e.phoneNumber.trim()),
        bankAccounts: bankAccounts.filter((b) => b.accountNumber.trim()),
        meterNumbers: meterNumbers.filter((m) => m.meterNumber.trim()),
        gameProfiles: gameProfiles.filter((g) => g.userId.trim()),
        updatedAt: Date.now(),
      });
    } else {
      onAddCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        ewallets: ewallets.filter((e) => e.phoneNumber.trim()),
        bankAccounts: bankAccounts.filter((b) => b.accountNumber.trim()),
        meterNumbers: meterNumbers.filter((m) => m.meterNumber.trim()),
        gameProfiles: gameProfiles.filter((g) => g.userId.trim()),
      });
    }

    setIsFormOpen(false);
  };

  // Export Customers to JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(customers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database_pelanggan_rilcell_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Customers from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (confirm(`Ditemukan ${parsed.length} data pelanggan. Impor sekarang?`)) {
            parsed.forEach((c) => {
              if (c.name && !customers.some((existing) => existing.id === c.id)) {
                onAddCustomer({
                  name: c.name,
                  phone: c.phone || '',
                  address: c.address || '',
                  notes: c.notes || '',
                  ewallets: c.ewallets || [],
                  bankAccounts: c.bankAccounts || [],
                  meterNumbers: c.meterNumbers || [],
                  gameProfiles: c.gameProfiles || [],
                });
              }
            });
            alert('Data pelanggan berhasil diimpor!');
          }
        } else {
          alert('Format file JSON tidak sesuai.');
        }
      } catch (err) {
        console.error('Error importing customers:', err);
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      // Filter by type
      if (activeFilter === 'game' && (!cust.gameProfiles || cust.gameProfiles.length === 0)) return false;
      if (activeFilter === 'pln' && (!cust.meterNumbers || cust.meterNumbers.length === 0)) return false;
      if (activeFilter === 'ewallet' && (!cust.ewallets || cust.ewallets.length === 0)) return false;
      if (activeFilter === 'bank' && (!cust.bankAccounts || cust.bankAccounts.length === 0)) return false;

      // Filter by search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const matchName = cust.name.toLowerCase().includes(term);
      const matchPhone = cust.phone.toLowerCase().includes(term);
      const matchNotes = cust.notes?.toLowerCase().includes(term);

      const matchEwallet = cust.ewallets?.some(
        (ew) => ew.phoneNumber.includes(term) || ew.accountHolder?.toLowerCase().includes(term)
      );

      const matchBank = cust.bankAccounts?.some(
        (bk) => bk.accountNumber.includes(term) || bk.bankName.toLowerCase().includes(term) || bk.accountHolder?.toLowerCase().includes(term)
      );

      const matchMeter = cust.meterNumbers?.some(
        (mt) => mt.meterNumber.includes(term) || mt.ownerName?.toLowerCase().includes(term)
      );

      const matchGame = cust.gameProfiles?.some(
        (gm) => gm.userId.toLowerCase().includes(term) || 
                gm.zoneId?.toLowerCase().includes(term) || 
                gm.nickname?.toLowerCase().includes(term) ||
                gm.gameName.toLowerCase().includes(term)
      );

      return matchName || matchPhone || matchNotes || matchEwallet || matchBank || matchMeter || matchGame;
    });
  }, [customers, searchTerm, activeFilter]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Sticky Header: Pencarian + Aksi Tambah & Reload + Navbar Filter Kategori (Tidak terpengaruh scrolling) */}
      <div className="sticky top-[70px] z-30 -mt-1 pt-1.5 pb-2.5 bg-slate-100/95 backdrop-blur-md">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-md shadow-slate-900/5 space-y-3">
          {/* Top Row: Search Box + Tombol Tambah & Backup */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, no HP, No Meter PLN, Rekening, atau ID Game..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10.5 pr-9 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Tombol Backup / Export */}
            <button
              type="button"
              onClick={handleExportJSON}
              className="p-2.5 sm:px-3.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border border-slate-200/70 shrink-0 cursor-pointer h-11"
              title="Ekspor / Backup Database Pelanggan (JSON)"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Backup</span>
            </button>

            {/* Hidden File Input for Import */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 sm:px-3.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border border-slate-200/70 shrink-0 cursor-pointer h-11"
              title="Impor Database Pelanggan dari File JSON"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Impor</span>
            </button>

            {/* Tombol Tambah Pelanggan Baru */}
            <button
              type="button"
              id="btn-add-customer"
              onClick={openAddModal}
              className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-xs flex items-center gap-2 shrink-0 cursor-pointer h-11"
            >
              <Plus className="w-4.5 h-4.5 stroke-[3]" />
              <span>Tambah Pelanggan</span>
            </button>
          </div>

          {/* Bottom Row: Filter Tabs Pelanggan */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {[
              { id: 'all' as const, label: `Semua (${customers.length})`, icon: Users },
              { id: 'game' as const, label: 'Game ID', icon: Gamepad2 },
              { id: 'pln' as const, label: 'Token PLN', icon: Zap },
              { id: 'ewallet' as const, label: 'E-Wallet', icon: Wallet },
              { id: 'bank' as const, label: 'Rekening Bank', icon: Landmark },
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Copy Toast Alert */}
      {copiedText && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Tersalin ke clipboard: {copiedText}</span>
        </div>
      )}

      {/* Customers List / Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-black text-slate-900">
            {searchTerm ? 'Tidak ada pelanggan yang cocok' : 'Belum Ada Data Pelanggan'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm 
              ? `Coba kata kunci lain atau bersihkan pencarian "${searchTerm}".`
              : 'Simpan nomor HP, akun e-wallet, rekening bank, nomor meter PLN, dan ID Game pelanggan tetap Anda untuk input transaksi yang lebih cepat.'
            }
          </p>
          <div className="flex items-center justify-center gap-2">
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hapus Pencarian
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Tambah Pelanggan Baru</span>
                </button>
                <button
                  type="button"
                  onClick={onResetCustomers}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Contoh Bawaan</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredCustomers.map((cust) => {
            const initial = cust.name.charAt(0).toUpperCase();
            const waNumber = cust.phone.replace(/^0/, '62').replace(/\D/g, '');

            return (
              <div
                key={cust.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3.5"
              >
                {/* Header: Nama, HP, Aksi Edit/Delete */}
                <div>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 border border-emerald-200/80 text-emerald-800 font-black text-lg flex items-center justify-center shrink-0 shadow-2xs">
                        {initial}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">
                            {cust.name}
                          </h3>
                        </div>

                        {/* Nomor HP Utama */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {cust.phone || 'Tanpa no. HP'}
                          </span>

                          {cust.phone && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopy(cust.phone, `No. HP ${cust.name}`)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                title="Salin nomor HP"
                              >
                                <Copy className="w-3 h-3" />
                              </button>

                              <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition"
                                title="Kirim Pesan WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WA</span>
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(cust)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Edit Data Pelanggan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus pelanggan "${cust.name}" dari database?`)) {
                            onDeleteCustomer(cust.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus Pelanggan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Alamat atau Catatan jika ada */}
                  {(cust.address || cust.notes) && (
                    <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 space-y-0.5">
                      {cust.address && <p className="truncate">📍 {cust.address}</p>}
                      {cust.notes && <p className="italic text-slate-600 line-clamp-2">📝 {cust.notes}</p>}
                    </div>
                  )}

                  {/* Data Layanan Pelanggan (Chips & Details) */}
                  <div className="mt-3 space-y-2">
                    {/* 1. ID GAME & PENYESUAIAN GAMENYA */}
                    {cust.gameProfiles && cust.gameProfiles.length > 0 && (
                      <div className="bg-rose-50/50 border border-rose-100/80 rounded-xl p-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 mb-1.5">
                          <span className="flex items-center gap-1">
                            <Gamepad2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>ID Game Pelanggan ({cust.gameProfiles.length})</span>
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {cust.gameProfiles.map((gm) => {
                            // Penyesuaian format ID game
                            const displayId = gm.zoneId ? `${gm.userId} (${gm.zoneId})` : gm.userId;
                            return (
                              <div
                                key={gm.id}
                                className="flex items-center justify-between bg-white/90 border border-rose-200/60 rounded-lg px-2.5 py-1.5 text-xs"
                              >
                                <div className="truncate mr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900">{gm.gameName}</span>
                                    {gm.nickname && (
                                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.2 rounded">
                                        IGN: {gm.nickname}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono font-black text-rose-950 block">
                                    {displayId}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(displayId, `${gm.gameName} - ${cust.name}`)}
                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                                    title="Salin ID Game"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  {onSelectCustomerForTransaction && (
                                    <button
                                      type="button"
                                      onClick={() => onSelectCustomerForTransaction(cust, 'game_tv', gm.userId)}
                                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                                      title="Top-Up Game ini sekarang"
                                    >
                                      <span>Top Up</span>
                                      <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. NOMOR METER / ID PELANGGAN PLN */}
                    {cust.meterNumbers && cust.meterNumbers.length > 0 && (
                      <div className="bg-amber-50/50 border border-amber-100/80 rounded-xl p-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 mb-1.5">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-600" />
                            <span>Nomor Meter / IDPEL PLN ({cust.meterNumbers.length})</span>
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {cust.meterNumbers.map((mt) => (
                            <div
                              key={mt.id}
                              className="flex items-center justify-between bg-white/90 border border-amber-200/60 rounded-lg px-2.5 py-1.5 text-xs"
                            >
                              <div className="truncate mr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-amber-950 text-xs">
                                    {mt.meterNumber}
                                  </span>
                                  {mt.tariffPower && (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                                      {mt.tariffPower}
                                    </span>
                                  )}
                                </div>
                                {(mt.ownerName || mt.locationNote) && (
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    A/N: {mt.ownerName || '-'} {mt.locationNote ? `(${mt.locationNote})` : ''}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleCopy(mt.meterNumber, `IDPEL PLN ${cust.name}`)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                                  title="Salin Nomor Meter PLN"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                {onSelectCustomerForTransaction && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectCustomerForTransaction(cust, 'pln_tagihan', mt.meterNumber)}
                                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                                    title="Isi Token PLN ini sekarang"
                                  >
                                    <span>Isi PLN</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. NOMOR E-WALLET */}
                    {cust.ewallets && cust.ewallets.length > 0 && (
                      <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 mb-1.5">
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Nomor E-Wallet ({cust.ewallets.length})</span>
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {cust.ewallets.map((ew) => (
                            <div
                              key={ew.id}
                              className="flex items-center justify-between bg-white/90 border border-emerald-200/60 rounded-lg px-2.5 py-1.5 text-xs"
                            >
                              <div className="truncate mr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{ew.walletType}</span>
                                  <span className="font-mono font-black text-emerald-950 text-xs">
                                    {ew.phoneNumber}
                                  </span>
                                </div>
                                {ew.accountHolder && (
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    A/N: {ew.accountHolder}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleCopy(ew.phoneNumber, `${ew.walletType} ${cust.name}`)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                                  title="Salin Nomor E-Wallet"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                {onSelectCustomerForTransaction && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectCustomerForTransaction(cust, 'topup_ewallet', ew.phoneNumber)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                                    title="Top-Up E-Wallet ini sekarang"
                                  >
                                    <span>Top Up</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. NOMOR REKENING BANK */}
                    {cust.bankAccounts && cust.bankAccounts.length > 0 && (
                      <div className="bg-blue-50/50 border border-blue-100/80 rounded-xl p-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-blue-800 mb-1.5">
                          <span className="flex items-center gap-1">
                            <Landmark className="w-3.5 h-3.5 text-blue-600" />
                            <span>Rekening Bank ({cust.bankAccounts.length})</span>
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {cust.bankAccounts.map((bk) => (
                            <div
                              key={bk.id}
                              className="flex items-center justify-between bg-white/90 border border-blue-200/60 rounded-lg px-2.5 py-1.5 text-xs"
                            >
                              <div className="truncate mr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-blue-900 bg-blue-100/80 px-1.5 py-0.2 rounded text-[10px]">
                                    {bk.bankName}
                                  </span>
                                  <span className="font-mono font-black text-slate-900 text-xs">
                                    {bk.accountNumber}
                                  </span>
                                </div>
                                {bk.accountHolder && (
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    A/N: {bk.accountHolder}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleCopy(bk.accountNumber, `Rek ${bk.bankName} ${cust.name}`)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                                  title="Salin Nomor Rekening"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                {onSelectCustomerForTransaction && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectCustomerForTransaction(cust, 'transfer_tarik', bk.accountNumber)}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                                    title="Transfer ke rekening ini sekarang"
                                  >
                                    <span>Kirim</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Card: Fast Quick Transaction Pulsa / Data */}
                {onSelectCustomerForTransaction && cust.phone && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Transaksi Pulsa / Kuota:</span>
                    <button
                      type="button"
                      onClick={() => onSelectCustomerForTransaction(cust, 'pulsa_data', cust.phone)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <span>Isi Pulsa & Paket</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TAMBAH / EDIT PELANGGAN LENGKAP                   */}
      {/* ======================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Tetap Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Simpan no. HP, akun E-Wallet, Rekening Bank, No Meter PLN, dan ID Game.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 max-h-[80vh] overflow-y-auto space-y-4">
              {/* 1. INFORMASI UTAMA PELANGGAN */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                <span className="text-xs font-black text-slate-900 block">
                  Informasi Kontak Utama
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Pelanggan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nomor WhatsApp / HP Utama
                    </label>
                    <input
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Alamat / Lokasi (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Melati No. 12"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Catatan Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Langganan token & DM MLBB"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. SECTION ID GAME & PENYESUAIAN GAMENYA */}
              <div className="border border-rose-200/80 rounded-xl overflow-hidden bg-rose-50/20">
                <div 
                  onClick={() => setShowGameSection(!showGameSection)}
                  className="bg-rose-50/70 px-4 py-2.5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-black text-rose-900">
                      ID Game & Penyesuaian Gamenya ({gameProfiles.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addGameRow('mlbb');
                        setShowGameSection(true);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>Tambah Game</span>
                    </button>
                    {showGameSection ? <ChevronUp className="w-4 h-4 text-rose-700" /> : <ChevronDown className="w-4 h-4 text-rose-700" />}
                  </div>
                </div>

                {showGameSection && (
                  <div className="p-3.5 space-y-3">
                    {gameProfiles.length === 0 ? (
                      <div className="text-center py-3">
                        <p className="text-xs text-slate-500">Belum ada ID game yang disimpan untuk pelanggan ini.</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => addGameRow('mlbb')}
                            className="px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-800 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            + Mobile Legends
                          </button>
                          <button
                            type="button"
                            onClick={() => addGameRow('ff')}
                            className="px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-800 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            + Free Fire
                          </button>
                          <button
                            type="button"
                            onClick={() => addGameRow('genshin')}
                            className="px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-800 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            + Genshin
                          </button>
                        </div>
                      </div>
                    ) : (
                      gameProfiles.map((gm, index) => {
                        const selectedGameConfig = SUPPORTED_GAMES.find((g) => g.key === gm.gameKey) || SUPPORTED_GAMES[0];

                        return (
                          <div
                            key={gm.id}
                            className="bg-white border border-rose-200 rounded-xl p-3 space-y-2.5 shadow-2xs relative"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                                Game #{index + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => setGameProfiles(gameProfiles.filter((g) => g.id !== gm.id))}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                                title="Hapus Game ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {/* Pilih Game */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                  Pilih Game
                                </label>
                                <select
                                  value={gm.gameKey}
                                  onChange={(e) => {
                                    const newKey = e.target.value as CustomerGameProfile['gameKey'];
                                    const cfg = SUPPORTED_GAMES.find((g) => g.key === newKey) || SUPPORTED_GAMES[0];
                                    setGameProfiles(
                                      gameProfiles.map((item) =>
                                        item.id === gm.id
                                          ? {
                                              ...item,
                                              gameKey: newKey,
                                              gameName: cfg.name,
                                              zoneId: cfg.hasZoneId ? (cfg.servers ? cfg.servers[0] : '') : undefined,
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-none"
                                >
                                  {SUPPORTED_GAMES.map((g) => (
                                    <option key={g.key} value={g.key}>
                                      {g.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* In Game Name / Nickname */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                  Nickname Akun (IGN) (Opsional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Contoh: Lemon_King"
                                  value={gm.nickname || ''}
                                  onChange={(e) =>
                                    setGameProfiles(
                                      gameProfiles.map((item) =>
                                        item.id === gm.id ? { ...item, nickname: e.target.value } : item
                                      )
                                    )
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Kolom ID Akun & Server / Zone ID Khusus */}
                            <div className={`grid grid-cols-1 ${selectedGameConfig.hasZoneId ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-2.5`}>
                              <div className={selectedGameConfig.hasZoneId ? 'sm:col-span-2' : ''}>
                                <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                  {selectedGameConfig.idLabel} <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder={selectedGameConfig.idPlaceholder}
                                  value={gm.userId}
                                  onChange={(e) =>
                                    setGameProfiles(
                                      gameProfiles.map((item) =>
                                        item.id === gm.id ? { ...item, userId: e.target.value } : item
                                      )
                                    )
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                                />
                              </div>

                              {/* Zone ID / Server jika game membutuhkannya (seperti MLBB / Genshin) */}
                              {selectedGameConfig.hasZoneId && (
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                    {selectedGameConfig.zoneLabel || 'Zone / Server'}
                                  </label>
                                  {selectedGameConfig.servers ? (
                                    <select
                                      value={gm.zoneId || selectedGameConfig.servers[0]}
                                      onChange={(e) =>
                                        setGameProfiles(
                                          gameProfiles.map((item) =>
                                            item.id === gm.id ? { ...item, zoneId: e.target.value } : item
                                          )
                                        )
                                      }
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-none"
                                    >
                                      {selectedGameConfig.servers.map((srv) => (
                                        <option key={srv} value={srv}>
                                          {srv}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder={selectedGameConfig.zonePlaceholder || 'Zone ID'}
                                      value={gm.zoneId || ''}
                                      onChange={(e) =>
                                        setGameProfiles(
                                          gameProfiles.map((item) =>
                                            item.id === gm.id ? { ...item, zoneId: e.target.value } : item
                                          )
                                        )
                                      }
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 3. SECTION NOMOR METER / ID PELANGGAN PLN */}
              <div className="border border-amber-200/80 rounded-xl overflow-hidden bg-amber-50/20">
                <div 
                  onClick={() => setShowMeterSection(!showMeterSection)}
                  className="bg-amber-50/70 px-4 py-2.5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-amber-900">
                      Nomor Meter / ID Pelanggan PLN ({meterNumbers.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addMeterRow();
                        setShowMeterSection(true);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>Tambah Meter PLN</span>
                    </button>
                    {showMeterSection ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-amber-700" />}
                  </div>
                </div>

                {showMeterSection && (
                  <div className="p-3.5 space-y-3">
                    {meterNumbers.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">
                        Belum ada nomor meter PLN tersimpan untuk pelanggan ini.
                      </p>
                    ) : (
                      meterNumbers.map((mt, index) => (
                        <div
                          key={mt.id}
                          className="bg-white border border-amber-200 rounded-xl p-3 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Meteran PLN #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setMeterNumbers(meterNumbers.filter((m) => m.id !== mt.id))}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Nomor Meter / IDPEL (11-12 Digit) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: 142345678901"
                                value={mt.meterNumber}
                                onChange={(e) =>
                                  setMeterNumbers(
                                    meterNumbers.map((item) =>
                                      item.id === mt.id ? { ...item, meterNumber: e.target.value } : item
                                    )
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Nama Pemilik Meter / Pelanggan PLN
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: Budi Santoso"
                                value={mt.ownerName || ''}
                                onChange={(e) =>
                                  setMeterNumbers(
                                    meterNumbers.map((item) =>
                                      item.id === mt.id ? { ...item, ownerName: e.target.value } : item
                                    )
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Daya Listrik (Tarif / Daya)
                              </label>
                              <select
                                value={mt.tariffPower || 'R1/1300 VA'}
                                onChange={(e) =>
                                  setMeterNumbers(
                                    meterNumbers.map((item) =>
                                      item.id === mt.id ? { ...item, tariffPower: e.target.value } : item
                                    )
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                              >
                                <option value="R1/450 VA">R1 / 450 VA</option>
                                <option value="R1M/900 VA">R1M / 900 VA</option>
                                <option value="R1/1300 VA">R1 / 1300 VA</option>
                                <option value="R1/2200 VA">R1 / 2200 VA</option>
                                <option value="B1/2200 VA">B1 (Bisnis) / 2200 VA</option>
                                <option value="R2/3500 VA">R2 / 3500 VA</option>
                                <option value="Lainnya">Lainnya</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Lokasi / Keterangan (Rumah, Toko, Kos)
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: Rumah Utama / Toko"
                                value={mt.locationNote || ''}
                                onChange={(e) =>
                                  setMeterNumbers(
                                    meterNumbers.map((item) =>
                                      item.id === mt.id ? { ...item, locationNote: e.target.value } : item
                                    )
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 4. SECTION NOMOR E-WALLET */}
              <div className="border border-emerald-200/80 rounded-xl overflow-hidden bg-emerald-50/20">
                <div 
                  onClick={() => setShowEwalletSection(!showEwalletSection)}
                  className="bg-emerald-50/70 px-4 py-2.5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-emerald-900">
                      Nomor Akun E-Wallet ({ewallets.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addEwalletRow();
                        setShowEwalletSection(true);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>Tambah E-Wallet</span>
                    </button>
                    {showEwalletSection ? <ChevronUp className="w-4 h-4 text-emerald-700" /> : <ChevronDown className="w-4 h-4 text-emerald-700" />}
                  </div>
                </div>

                {showEwalletSection && (
                  <div className="p-3.5 space-y-3">
                    {ewallets.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">
                        Belum ada nomor e-wallet tersimpan untuk pelanggan ini.
                      </p>
                    ) : (
                      ewallets.map((ew, index) => (
                        <div
                          key={ew.id}
                          className="bg-white border border-emerald-200 rounded-xl p-3 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              E-Wallet #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEwallets(ewallets.filter((e) => e.id !== ew.id))}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Jenis E-Wallet
                              </label>
                              <select
                                value={ew.walletType}
                                onChange={(e) =>
                                  setEwallets(
                                    ewallets.map((item) =>
                                      item.id === ew.id
                                        ? { ...item, walletType: e.target.value as CustomerEWalletProfile['walletType'] }
                                        : item
                                    )
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                              >
                                {EWALLET_OPTIONS.map((w) => (
                                  <option key={w} value={w}>
                                    {w}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Nomor HP E-Wallet <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="tel"
                                placeholder="Contoh: 081234567890"
                                value={ew.phoneNumber}
                                onChange={(e) =>
                                  setEwallets(
                                    ewallets.map((item) =>
                                      item.id === ew.id ? { ...item, phoneNumber: e.target.value } : item
                                    )
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Atas Nama Akun (A/N)
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: Budi Santoso"
                                value={ew.accountHolder || ''}
                                onChange={(e) =>
                                  setEwallets(
                                    ewallets.map((item) =>
                                      item.id === ew.id ? { ...item, accountHolder: e.target.value } : item
                                    )
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 5. SECTION NOMOR REKENING BANK */}
              <div className="border border-blue-200/80 rounded-xl overflow-hidden bg-blue-50/20">
                <div 
                  onClick={() => setShowBankSection(!showBankSection)}
                  className="bg-blue-50/70 px-4 py-2.5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black text-blue-900">
                      Nomor Rekening Bank ({bankAccounts.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addBankRow();
                        setShowBankSection(true);
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>Tambah Rekening</span>
                    </button>
                    {showBankSection ? <ChevronUp className="w-4 h-4 text-blue-700" /> : <ChevronDown className="w-4 h-4 text-blue-700" />}
                  </div>
                </div>

                {showBankSection && (
                  <div className="p-3.5 space-y-3">
                    {bankAccounts.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">
                        Belum ada nomor rekening bank tersimpan untuk pelanggan ini.
                      </p>
                    ) : (
                      bankAccounts.map((bk, index) => (
                        <div
                          key={bk.id}
                          className="bg-white border border-blue-200 rounded-xl p-3 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                              Rekening #{index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setBankAccounts(bankAccounts.filter((b) => b.id !== bk.id))}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Bank Tujuan
                              </label>
                              <select
                                value={bk.bankName}
                                onChange={(e) =>
                                  setBankAccounts(
                                    bankAccounts.map((item) =>
                                      item.id === bk.id ? { ...item, bankName: e.target.value } : item
                                    )
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                              >
                                {BANK_OPTIONS.map((b) => (
                                  <option key={b} value={b}>
                                    {b}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Nomor Rekening <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: 1230984711"
                                value={bk.accountNumber}
                                onChange={(e) =>
                                  setBankAccounts(
                                    bankAccounts.map((item) =>
                                      item.id === bk.id ? { ...item, accountNumber: e.target.value } : item
                                    )
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Atas Nama Pemilik Rekening
                              </label>
                              <input
                                type="text"
                                placeholder="Contoh: Budi Santoso"
                                value={bk.accountHolder || ''}
                                onChange={(e) =>
                                  setBankAccounts(
                                    bankAccounts.map((item) =>
                                      item.id === bk.id ? { ...item, accountHolder: e.target.value } : item
                                    )
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Simpan Data Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
