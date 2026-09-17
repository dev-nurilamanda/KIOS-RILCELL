import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  X, 
  Phone, 
  Zap, 
  Gamepad2, 
  Wallet, 
  Landmark, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { CustomerRecord, ServiceCategory } from '../types';

interface CustomerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerRecord[];
  currentCategory: ServiceCategory;
  onSelectCustomer: (customer: CustomerRecord, selectedTargetNumber: string) => void;
  onOpenCustomerManager?: () => void;
}

export const CustomerPickerModal: React.FC<CustomerPickerModalProps> = ({
  isOpen,
  onClose,
  customers,
  currentCategory,
  onSelectCustomer,
  onOpenCustomerManager,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const term = search.toLowerCase();
    return customers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(term);
      const matchPhone = c.phone.toLowerCase().includes(term);
      const matchEwallet = c.ewallets?.some((e) => e.phoneNumber.includes(term) || e.accountHolder?.toLowerCase().includes(term));
      const matchBank = c.bankAccounts?.some((b) => b.accountNumber.includes(term) || b.bankName.toLowerCase().includes(term));
      const matchMeter = c.meterNumbers?.some((m) => m.meterNumber.includes(term) || m.ownerName?.toLowerCase().includes(term));
      const matchGame = c.gameProfiles?.some((g) => g.userId.toLowerCase().includes(term) || g.nickname?.toLowerCase().includes(term) || g.gameName.toLowerCase().includes(term));
      return matchName || matchPhone || matchEwallet || matchBank || matchMeter || matchGame;
    });
  }, [customers, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Pilih Dari Database Pelanggan</h3>
              <p className="text-[11px] text-slate-400">
                Pilih pelanggan untuk mengisi nomor tujuan & nama secara otomatis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Ketik nama, no. HP, ID Game, nomor meter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {onOpenCustomerManager && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCustomerManager();
              }}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Kelola Pelanggan</span>
            </button>
          )}
        </div>

        {/* List of Customers */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Pelanggan tidak ditemukan</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tidak ada data yang cocok dengan pencarian "{search}".
              </p>
            </div>
          ) : (
            filtered.map((cust) => {
              // Determine primary value based on current category
              let defaultTarget = cust.phone;
              if (currentCategory === 'pln_tagihan' && cust.meterNumbers?.[0]) {
                defaultTarget = cust.meterNumbers[0].meterNumber;
              } else if (currentCategory === 'game_tv' && cust.gameProfiles?.[0]) {
                defaultTarget = cust.gameProfiles[0].zoneId 
                  ? `${cust.gameProfiles[0].userId} (${cust.gameProfiles[0].zoneId})`
                  : cust.gameProfiles[0].userId;
              } else if (currentCategory === 'topup_ewallet' && cust.ewallets?.[0]) {
                defaultTarget = cust.ewallets[0].phoneNumber;
              } else if (currentCategory === 'transfer_tarik' && cust.bankAccounts?.[0]) {
                defaultTarget = cust.bankAccounts[0].accountNumber;
              }

              return (
                <div
                  key={cust.id}
                  className="bg-white border border-slate-200/90 rounded-xl p-3 hover:border-emerald-400 hover:bg-emerald-50/20 transition-all space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{cust.name}</h4>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {cust.phone || 'Tanpa no. HP'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectCustomer(cust, defaultTarget);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>Pilih</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Badges / Options for target numbers */}
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 text-[11px]">
                    {/* Phone button */}
                    {cust.phone && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCustomer(cust, cust.phone);
                          onClose();
                        }}
                        className={`px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1 cursor-pointer ${
                          currentCategory === 'pulsa_data'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Pilih nomor HP utama"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>HP: {cust.phone}</span>
                      </button>
                    )}

                    {/* Game IDs */}
                    {cust.gameProfiles?.map((gm) => {
                      const displayTarget = gm.zoneId ? `${gm.userId} (${gm.zoneId})` : gm.userId;
                      return (
                        <button
                          key={gm.id}
                          type="button"
                          onClick={() => {
                            onSelectCustomer(cust, displayTarget);
                            onClose();
                          }}
                          className={`px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1 cursor-pointer ${
                            currentCategory === 'game_tv'
                              ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                          title={`Pilih ID Game ${gm.gameName}`}
                        >
                          <Gamepad2 className="w-3 h-3 text-rose-600" />
                          <span>{gm.gameName}: {displayTarget}</span>
                        </button>
                      );
                    })}

                    {/* Meter PLN */}
                    {cust.meterNumbers?.map((mt) => (
                      <button
                        key={mt.id}
                        type="button"
                        onClick={() => {
                          onSelectCustomer(cust, mt.meterNumber);
                          onClose();
                        }}
                        className={`px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1 cursor-pointer ${
                          currentCategory === 'pln_tagihan'
                            ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Pilih nomor meter PLN"
                      >
                        <Zap className="w-3 h-3 text-amber-600" />
                        <span>PLN: {mt.meterNumber}</span>
                      </button>
                    ))}

                    {/* E-Wallets */}
                    {cust.ewallets?.map((ew) => (
                      <button
                        key={ew.id}
                        type="button"
                        onClick={() => {
                          onSelectCustomer(cust, ew.phoneNumber);
                          onClose();
                        }}
                        className={`px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1 cursor-pointer ${
                          currentCategory === 'topup_ewallet'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={`Pilih E-Wallet ${ew.walletType}`}
                      >
                        <Wallet className="w-3 h-3 text-emerald-600" />
                        <span>{ew.walletType}: {ew.phoneNumber}</span>
                      </button>
                    ))}

                    {/* Bank Accounts */}
                    {cust.bankAccounts?.map((bk) => (
                      <button
                        key={bk.id}
                        type="button"
                        onClick={() => {
                          onSelectCustomer(cust, bk.accountNumber);
                          onClose();
                        }}
                        className={`px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1 cursor-pointer ${
                          currentCategory === 'transfer_tarik'
                            ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={`Pilih Rekening ${bk.bankName}`}
                      >
                        <Landmark className="w-3 h-3 text-blue-600" />
                        <span>{bk.bankName}: {bk.accountNumber}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
