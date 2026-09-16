import React, { useState, useMemo } from 'react';
import { Search, ShoppingBag, Plus, AlertTriangle, Coffee, Utensils, Cookie, Sparkles, Box, Barcode, Check } from 'lucide-react';
import { Product, ProductCategory, CartItem, StoreSettings } from '../types';
import { formatRupiah } from '../utils/formatters';
import { CartPanel } from './CartPanel';

interface PosViewProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
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
  setEnableTax: (val: boolean) => void;
  settings: StoreSettings;
  onCheckout: () => void;
  savedDrafts: { id: string; name: string; items: CartItem[]; time: string }[];
  onSaveDraft: () => void;
  onLoadDraft: (draftId: string) => void;
}

const CATEGORIES: { label: ProductCategory; icon: React.ReactNode }[] = [
  { label: 'Semua', icon: <Box className="w-3.5 h-3.5" /> },
  { label: 'Makanan', icon: <Utensils className="w-3.5 h-3.5" /> },
  { label: 'Minuman', icon: <Coffee className="w-3.5 h-3.5" /> },
  { label: 'Cemilan', icon: <Cookie className="w-3.5 h-3.5" /> },
  { label: 'Paket Hemat', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

export const PosView: React.FC<PosViewProps> = ({
  products,
  cart,
  onAddToCart,
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
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [barcodeFeedback, setBarcodeFeedback] = useState<string | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === 'Semua' || product.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        (product.description && product.description.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle Quick Barcode Scanner / Manual Enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) =>
        p.sku.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        p.name.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      if (matched.stock <= 0) {
        setBarcodeFeedback(`⚠️ Stok ${matched.name} sudah habis!`);
      } else {
        onAddToCart(matched);
        setBarcodeFeedback(`✓ ${matched.name} ditambahkan`);
      }
    } else {
      setBarcodeFeedback(`❌ Produk dengan kode "${barcodeInput}" tidak ditemukan`);
    }

    setBarcodeInput('');
    setTimeout(() => {
      setBarcodeFeedback(null);
    }, 2500);
  };

  const totalCartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / CENTER: Products Catalog Area (7 or 8 columns on large screens) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Top Bar: Search and Barcode Input */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="search-product-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama produk, SKU, atau keterangan..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Barcode / SKU Scan Input */}
            <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-60">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="barcode-input"
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan / SKU (Enter)"
                className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 text-xs font-bold"
                title="Scan / Tambahkan"
              >
                ↵
              </button>
            </form>
          </div>

          {/* Barcode scanner instant feedback */}
          {barcodeFeedback && (
            <div className="p-2.5 rounded-xl bg-slate-800 text-white text-xs font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span>{barcodeFeedback}</span>
              <button
                onClick={() => setBarcodeFeedback(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const count =
                cat.label === 'Semua'
                  ? products.length
                  : products.filter((p) => p.category === cat.label).length;

              const isSelected = selectedCategory === cat.label;

              return (
                <button
                  key={cat.label}
                  id={`cat-pill-${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedCategory(cat.label)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-700/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <p className="text-sm font-semibold text-slate-600">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">
                Coba kata kunci lain atau pilih kategori yang berbeda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const cartItem = cart.find((item) => item.product.id === product.id);
                const currentQuantity = cartItem ? cartItem.quantity : 0;
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= 5;
                const isLimitReached = currentQuantity >= product.stock;

                return (
                  <div
                    key={product.id}
                    id={`product-card-${product.id}`}
                    onClick={() => {
                      if (!isOutOfStock && !isLimitReached) {
                        onAddToCart(product);
                      }
                    }}
                    className={`group relative bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all select-none cursor-pointer ${
                      isOutOfStock
                        ? 'opacity-60 bg-slate-50/80 border-slate-200 cursor-not-allowed'
                        : isLimitReached
                        ? 'border-amber-300 ring-1 ring-amber-300 shadow-xs'
                        : 'border-slate-200/90 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Top color tag / category */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {product.sku}
                        </span>

                        {/* Stock badge */}
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Sisa {product.stock}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            Stok: {product.stock}
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h3>

                      {/* Description if present */}
                      {product.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price and Add Button */}
                    <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums">
                          {formatRupiah(product.price)}
                        </span>
                        <span className="text-[10px] text-slate-400 block -mt-0.5">
                          /{product.unit}
                        </span>
                      </div>

                      {/* Add Button or Current Quantity indicator */}
                      <div className="shrink-0">
                        {currentQuantity > 0 ? (
                          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {currentQuantity}
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                              isOutOfStock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-100 text-slate-700 group-hover:bg-emerald-600 group-hover:text-white'
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Cart Panel (Desktop) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20 h-[calc(100vh-6rem)]">
          <CartPanel
            cart={cart}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onUpdateNotes={onUpdateNotes}
            onClearCart={onClearCart}
            customerName={customerName}
            setCustomerName={setCustomerName}
            tableOrNote={tableOrNote}
            setTableOrNote={setTableOrNote}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            enableTax={enableTax}
            setEnableTax={setEnableTax}
            settings={settings}
            onCheckout={onCheckout}
            savedDrafts={savedDrafts}
            onSaveDraft={onSaveDraft}
            onLoadDraft={onLoadDraft}
          />
        </div>
      </div>

      {/* MOBILE FLOATING CART BAR */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-40">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-800 px-2 py-1 rounded-lg text-xs font-bold">
              {totalCartItemsCount} Item
            </div>
            <span className="text-xs font-semibold">Lihat Pesanan</span>
          </div>

          <div className="text-sm font-extrabold tabular-nums">
            {formatRupiah(totalCartPrice)}
          </div>
        </button>
      </div>

      {/* MOBILE CART MODAL SHEET */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in">
          <div className="bg-white rounded-t-3xl max-h-[85vh] h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 border-b flex justify-between items-center bg-slate-50">
              <span className="font-bold text-sm text-slate-800">Keranjang Kasir</span>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Tutup ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CartPanel
                cart={cart}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                onUpdateNotes={onUpdateNotes}
                onClearCart={onClearCart}
                customerName={customerName}
                setCustomerName={setCustomerName}
                tableOrNote={tableOrNote}
                setTableOrNote={setTableOrNote}
                discountType={discountType}
                setDiscountType={setDiscountType}
                discountValue={discountValue}
                setDiscountValue={setDiscountValue}
                enableTax={enableTax}
                setEnableTax={setEnableTax}
                settings={settings}
                onCheckout={() => {
                  setIsMobileCartOpen(false);
                  onCheckout();
                }}
                savedDrafts={savedDrafts}
                onSaveDraft={onSaveDraft}
                onLoadDraft={(id) => {
                  onLoadDraft(id);
                  setIsMobileCartOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
