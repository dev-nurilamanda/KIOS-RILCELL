import React, { useState } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, Tag, Receipt, MessageSquare, ArrowRight, RotateCcw, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { CartItem, StoreSettings } from '../types';
import { formatRupiah } from '../utils/formatters';

interface CartPanelProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onUpdateNotes: (productId: string, notes: string) => void;
  onClearCart: () => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  tableOrNote: string;
  setTableOrNote: (val: string) => void;
  discountType: 'percent' | 'nominal';
  setDiscountType: (type: 'percent' | 'nominal') => void;
  discountValue: number;
  setDiscountValue: (val: number) => void;
  enableTax: boolean;
  setEnableTax: (enabled: boolean) => void;
  settings: StoreSettings;
  onCheckout: () => void;
  savedDrafts: { id: string; name: string; items: CartItem[]; time: string }[];
  onSaveDraft: () => void;
  onLoadDraft: (draftId: string) => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onClearCart,
  customerName,
  setCustomerName,
  tableOrNote,
  setTableOrNote,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  enableTax,
  setEnableTax,
  settings,
  onCheckout,
  savedDrafts,
  onSaveDraft,
  onLoadDraft,
}) => {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false);
  const [showDraftsList, setShowDraftsList] = useState<boolean>(false);

  // Computations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100);
  } else {
    discountAmount = Math.min(subtotal, Math.max(0, discountValue));
  }

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = enableTax ? Math.round(taxableSubtotal * (settings.taxRatePercent / 100)) : 0;
  const total = taxableSubtotal + taxAmount;

  const handleOpenNote = (item: CartItem) => {
    setEditingNoteId(item.product.id);
    setNoteInput(item.notes || '');
  };

  const handleSaveNote = (productId: string) => {
    onUpdateNotes(productId, noteInput);
    setEditingNoteId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Pesanan Pelanggan</h2>
            <p className="text-[11px] text-slate-500">{cart.length} jenis item</p>
          </div>
        </div>

        {/* Drafts button & Clear button */}
        <div className="flex items-center gap-1">
          {savedDrafts.length > 0 && (
            <button
              onClick={() => setShowDraftsList(!showDraftsList)}
              className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 font-medium transition-colors"
              title="Lihat pesanan tersimpan"
            >
              Draft ({savedDrafts.length})
            </button>
          )}

          {cart.length > 0 && (
            <>
              <button
                onClick={onSaveDraft}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                title="Simpan sementara pesanan (Hold)"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>
              <button
                onClick={onClearCart}
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="Kosongkan keranjang"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Drafts Dropdown if open */}
      {showDraftsList && savedDrafts.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 text-xs space-y-1.5">
          <div className="flex justify-between items-center font-semibold text-amber-900 pb-1 border-b border-amber-200">
            <span>Daftar Pesanan Disimpan (Hold)</span>
            <button
              onClick={() => setShowDraftsList(false)}
              className="text-amber-700 hover:text-amber-900 font-bold"
            >
              ✕
            </button>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1">
            {savedDrafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200 hover:border-amber-400"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-slate-800 truncate">{draft.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {draft.items.length} item • {draft.time}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onLoadDraft(draft.id);
                    setShowDraftsList(false);
                  }}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium"
                >
                  Muat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Info Quick Inputs */}
      <div className="p-3 bg-slate-50/50 border-b border-slate-100 grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Pelanggan
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama (Opsional)"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Meja / Ket
          </label>
          <input
            type="text"
            value={tableOrNote}
            onChange={(e) => setTableOrNote(e.target.value)}
            placeholder="Meja 1 / Bawa Pulang"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Klik produk di samping untuk menambahkan ke pesanan kasir
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const isEditingNote = editingNoteId === item.product.id;
            const itemTotal = item.product.price * item.quantity;
            const isMaxStock = item.quantity >= item.product.stock;

            return (
              <div key={item.product.id} className="pt-2 first:pt-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {formatRupiah(item.product.price)} / {item.product.unit}
                    </p>
                  </div>

                  {/* Item Total */}
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    {formatRupiah(itemTotal)}
                  </span>
                </div>

                {/* Notes badge or trigger */}
                {item.notes && !isEditingNote && (
                  <div
                    onClick={() => handleOpenNote(item)}
                    className="cursor-pointer text-[11px] text-amber-800 bg-amber-50/90 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200/80 inline-flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="truncate max-w-[220px]">{item.notes}</span>
                  </div>
                )}

                {/* Note edit input */}
                {isEditingNote && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Catatan (misal: Jangan pedas)"
                      autoFocus
                      className="flex-1 text-xs px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNote(item.product.id)}
                      className="px-2 py-1 text-xs bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNoteId(null)}
                      className="px-1.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Batal
                    </button>
                  </div>
                )}

                {/* Quantity Controls & Action */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenNote(item)}
                    className="text-[11px] text-slate-400 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>{item.notes ? 'Ubah Catatan' : '+ Catatan'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="p-1 text-slate-600 hover:bg-slate-200 transition-colors"
                        title="Kurangi"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="w-8 text-center text-xs font-bold text-slate-900 tabular-nums">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        disabled={isMaxStock}
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className={`p-1 transition-colors ${
                          isMaxStock
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                        title={isMaxStock ? 'Stok maksimum tercapai' : 'Tambah'}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Breakdown & Checkout CTA */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 space-y-3">
        {/* Toggle Discount & Tax Options */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <button
            type="button"
            onClick={() => setShowDiscountInput(!showDiscountInput)}
            className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{discountValue > 0 ? `Diskon Aktif` : '+ Tambah Diskon'}</span>
          </button>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
            <input
              type="checkbox"
              checked={enableTax}
              onChange={(e) => setEnableTax(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span>PPN ({settings.taxRatePercent}%)</span>
          </label>
        </div>

        {/* Expandable Discount input */}
        {showDiscountInput && (
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`px-2 py-1 font-bold ${
                  discountType === 'percent'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('nominal')}
                className={`px-2 py-1 font-bold ${
                  discountType === 'nominal'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Rp
              </button>
            </div>
            <input
              type="number"
              min={0}
              max={discountType === 'percent' ? 100 : subtotal}
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              placeholder={discountType === 'percent' ? 'Contoh: 10%' : 'Contoh: 5000'}
              className="flex-1 px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {discountValue > 0 && (
              <button
                type="button"
                onClick={() => setDiscountValue(0)}
                className="text-slate-400 hover:text-rose-600 px-1"
                title="Hapus diskon"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Calculation Lines */}
        <div className="space-y-1 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="tabular-nums font-semibold text-slate-800">
              {formatRupiah(subtotal)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>
                Diskon {discountType === 'percent' ? `(${discountValue}%)` : ''}:
              </span>
              <span className="tabular-nums font-semibold">
                -{formatRupiah(discountAmount)}
              </span>
            </div>
          )}

          {enableTax && (
            <div className="flex justify-between text-slate-600">
              <span>PPN ({settings.taxRatePercent}%):</span>
              <span className="tabular-nums font-medium">{formatRupiah(taxAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-900">Total Pembayaran:</span>
            <span className="text-lg font-extrabold text-emerald-700 tabular-nums">
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        {/* Primary Checkout Button */}
        <button
          type="button"
          disabled={cart.length === 0}
          onClick={onCheckout}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all ${
            cart.length === 0
              ? 'bg-slate-300 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-600/20'
          }`}
        >
          <span>Bayar Sekarang</span>
          <span className="text-emerald-200">•</span>
          <span className="tabular-nums">{formatRupiah(total)}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
