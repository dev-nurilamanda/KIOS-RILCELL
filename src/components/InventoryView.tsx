import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, CheckCircle2, RotateCcw, Package, ArrowUpDown } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { formatRupiah } from '../utils/formatters';

interface InventoryViewProps {
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onQuickAdjustStock: (productId: string, delta: number) => void;
  onResetDefaultProducts: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
  onQuickAdjustStock,
  onResetDefaultProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Makanan' as Product['category'],
    price: '',
    costPrice: '',
    stock: '',
    unit: 'Porsi',
    description: '',
  });

  const categoriesList = ['Semua', 'Makanan', 'Minuman', 'Cemilan', 'Paket Hemat', 'Lainnya'];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      const matchLowStock = !filterLowStockOnly || item.stock <= 5;
      return matchCat && matchSearch && matchLowStock;
    });
  }, [products, selectedCategory, searchQuery, filterLowStockOnly]);

  const openAddModal = () => {
    const nextNumber = products.length + 1;
    const generatedSku = `PRD-${String(nextNumber).padStart(3, '0')}`;
    setEditingProduct(null);
    setFormData({
      sku: generatedSku,
      name: '',
      category: 'Makanan',
      price: '',
      costPrice: '',
      stock: '10',
      unit: 'Porsi',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      category: prod.category,
      price: prod.price.toString(),
      costPrice: (prod.costPrice || 0).toString(),
      stock: prod.stock.toString(),
      unit: prod.unit,
      description: prod.description || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) return;

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      sku: formData.sku.trim().toUpperCase(),
      name: formData.name.trim(),
      category: formData.category,
      price: Math.max(0, parseFloat(formData.price) || 0),
      costPrice: Math.max(0, parseFloat(formData.costPrice) || 0),
      stock: Math.max(0, parseInt(formData.stock, 10) || 0),
      unit: formData.unit.trim() || 'Pcs',
      description: formData.description.trim(),
    };

    onSaveProduct(productToSave);
    setIsModalOpen(false);
  };

  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const totalStockCount = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValuation = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Produk Terdaftar</p>
            <p className="text-lg font-bold text-slate-900">{products.length} SKU</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ArrowUpDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Unit Tersedia</p>
            <p className="text-lg font-bold text-slate-900">{totalStockCount} Unit</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Stok Kritis (≤ 5)</p>
            <p className="text-lg font-bold text-slate-900">{lowStockCount} Produk</p>
          </div>
        </div>
      </div>

      {/* Action Header: Search, Filter, & Add Product Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk atau SKU..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                filterLowStockOnly
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Stok Menipis</span>
            </button>

            <button
              onClick={onResetDefaultProducts}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1"
              title="Kembalikan daftar produk ke bawaan sistem"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Bawaan</span>
            </button>

            <button
              id="add-product-btn"
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Nama Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Harga Modal</th>
                <th className="px-4 py-3 text-right">Harga Jual</th>
                <th className="px-4 py-3 text-center">Stok & Quick Adjust</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isOutOfStock = prod.stock <= 0;
                  const isLowStock = prod.stock > 0 && prod.stock <= 5;
                  const profitMargin = prod.costPrice
                    ? Math.round(((prod.price - prod.costPrice) / prod.price) * 100)
                    : null;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-600">
                        {prod.sku}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{prod.name}</p>
                        {prod.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {prod.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {prod.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                        {prod.costPrice ? formatRupiah(prod.costPrice) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                        <div>{formatRupiah(prod.price)}</div>
                        {profitMargin !== null && (
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            Margin: {profitMargin}%
                          </span>
                        )}
                      </td>

                      {/* Stock & Quick Adjust Buttons */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-xs tabular-nums ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-800'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {prod.stock} {prod.unit}
                          </span>

                          {/* Quick Adjust buttons (+5, +1, -1) */}
                          <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                            <button
                              onClick={() => onQuickAdjustStock(prod.id, -1)}
                              disabled={prod.stock <= 0}
                              className="px-1.5 py-0.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                              title="Kurangi 1"
                            >
                              -
                            </button>
                            <button
                              onClick={() => onQuickAdjustStock(prod.id, 1)}
                              className="px-1.5 py-0.5 hover:bg-slate-200 text-slate-600"
                              title="Tambah 1"
                            >
                              +
                            </button>
                            <button
                              onClick={() => onQuickAdjustStock(prod.id, 10)}
                              className="px-1.5 py-0.5 hover:bg-slate-200 text-slate-600 font-semibold text-[10px]"
                              title="Tambah 10"
                            >
                              +10
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus produk "${prod.name}"?`)) {
                                onDeleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode SKU / Barcode *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Contoh: FNB-010"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 uppercase font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as Product['category'] })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Cemilan">Cemilan</option>
                    <option value="Paket Hemat">Paket Hemat</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Es Kopi Susu Creamy"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Contoh: 18000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Modal / Beli (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="Contoh: 9000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok Saat Ini *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="Contoh: 50"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan Barang *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Cup / Porsi / Botol / Pcs"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Catatan Singkat
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan bahan, rasa, dsb"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Tambahkan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
