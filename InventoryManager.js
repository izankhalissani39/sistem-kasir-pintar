import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit3, Trash2, Package, AlertTriangle, DollarSign, X, RefreshCw, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { formatRupiah, generateRandomBarcode } from '../utils/formatters.js';
export const InventoryManager = ({ products, categories = [], onCategoriesChange, onAddProduct, onUpdateProduct, onDeleteProduct, onQuickAdjustStock, }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const categoryOptions = ['Semua', ...categories.filter(Boolean)];
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [stockFilter, setStockFilter] = useState('all');
    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingProduct, setEditingProduct] = useState(null);
    // Quick stock adjust modal
    const [adjustingProduct, setAdjustingProduct] = useState(null);
    const [adjustAmount, setAdjustAmount] = useState(0);
    const [adjustType, setAdjustType] = useState('add');
    // Form inputs
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        category: 'toping',
        costPrice: '',
        sellingPrice: '',
        stock: '',
        minStockAlert: '10',
        unit: 'pcs',
        image: '',
    });
    // Calculate inventory statistics
    const stats = useMemo(() => {
        const totalProducts = products.length;
        const totalStockCount = products.reduce((sum, p) => sum + p.stock, 0);
        const totalInventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
        const totalPotentialSales = products.reduce((sum, p) => sum + p.sellingPrice * p.stock, 0);
        const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
        const outOfStockCount = products.filter((p) => p.stock <= 0).length;
        return {
            totalProducts,
            totalStockCount,
            totalInventoryValue,
            totalPotentialSales,
            lowStockCount,
            outOfStockCount,
        };
    }, [products]);
    // Filtered products list
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
            const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.barcode && p.barcode.includes(searchQuery));
            let matchStock = true;
            if (stockFilter === 'low')
                matchStock = p.stock > 0 && p.stock <= p.minStockAlert;
            if (stockFilter === 'out')
                matchStock = p.stock <= 0;
            return matchCategory && matchSearch && matchStock;
        });
    }, [products, selectedCategory, searchQuery, stockFilter]);
    const handleOpenAddModal = () => {
        const maxSkuNum = products.reduce((max, product) => {
            const match = product.sku.match(/^PRD-(\d+)$/i);
            return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
        const nextSkuNum = String(maxSkuNum + 1).padStart(3, '0');
        setEditingProduct(null);
        setFormData({
            name: '',
            sku: `PRD-${nextSkuNum}`,
            barcode: generateRandomBarcode(),
            category: categories[0] || 'Minuman',
            costPrice: '',
            sellingPrice: '',
            stock: '20',
            minStockAlert: '5',
            unit: 'pcs',
            image: '',
        });
        setIsFormOpen(true);
    };
    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || '',
            category: product.category,
            costPrice: product.costPrice.toString(),
            sellingPrice: product.sellingPrice.toString(),
            stock: product.stock.toString(),
            minStockAlert: product.minStockAlert.toString(),
            unit: product.unit,
            image: product.image || '',
        });
        setIsFormOpen(true);
    };
    const handleProductImageFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('File harus berupa gambar.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const maxSize = 1000;
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setFormData((prev) => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.82) }));
            };
            img.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };
    const handleAddCategory = () => {
        const name = newCategoryName.trim();
        if (!name) return;
        if (categories.some((cat) => cat.toLowerCase() === name.toLowerCase())) {
            alert(`Kategori \"${name}\" sudah ada.`);
            return;
        }
        onCategoriesChange?.([...categories, name]);
        setNewCategoryName('');
    };
    const handleDeleteCategory = (category) => {
        const usedCount = products.filter((product) => product.category === category).length;
        if (usedCount > 0) {
            alert(`Kategori \"${category}\" tidak dapat dihapus karena masih dipakai ${usedCount} produk. Pindahkan produk terlebih dahulu.`);
            return;
        }
        if (categories.length <= 1) {
            alert('Minimal harus ada 1 kategori.');
            return;
        }
        onCategoriesChange?.(categories.filter((cat) => cat !== category));
        if (selectedCategory === category) setSelectedCategory('Semua');
    };
    const handleSubmitForm = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Nama produk wajib diisi!');
            return;
        }
        const normalizedSku = formData.sku.trim().toLowerCase();
        const normalizedBarcode = formData.barcode.trim().toLowerCase();
        const duplicateSku = products.find((product) => product.id !== editingProduct?.id && product.sku.trim().toLowerCase() === normalizedSku);
        if (normalizedSku && duplicateSku) {
            alert(`SKU "${formData.sku.trim()}" sudah digunakan oleh ${duplicateSku.name}.`);
            return;
        }
        const duplicateBarcode = normalizedBarcode
            ? products.find((product) => product.id !== editingProduct?.id &&
                (product.barcode || '').trim().toLowerCase() === normalizedBarcode)
            : undefined;
        if (duplicateBarcode) {
            alert(`Barcode "${formData.barcode.trim()}" sudah digunakan oleh ${duplicateBarcode.name}.`);
            return;
        }
        const costPrice = parseFloat(formData.costPrice) || 0;
        const sellingPrice = parseFloat(formData.sellingPrice) || 0;
        const stock = parseInt(formData.stock) || 0;
        const minStockAlert = parseInt(formData.minStockAlert) || 5;
        if (sellingPrice < costPrice) {
            if (!confirm('Peringatan: Harga jual lebih rendah dari harga modal. Lanjutkan?')) {
                return;
            }
        }
        if (editingProduct) {
            // Update
            const updated = {
                ...editingProduct,
                name: formData.name.trim(),
                sku: formData.sku.trim(),
                barcode: formData.barcode.trim() || undefined,
                category: formData.category,
                costPrice,
                sellingPrice,
                stock,
                minStockAlert,
                unit: formData.unit.trim() || 'pcs',
                image: formData.image.trim() || undefined,
            };
            onUpdateProduct(updated);
        }
        else {
            // Create
            const newProduct = {
                id: `prd-${Date.now()}`,
                name: formData.name.trim(),
                sku: formData.sku.trim() || `SKU-${Date.now()}`,
                barcode: formData.barcode.trim() || generateRandomBarcode(),
                category: formData.category,
                costPrice,
                sellingPrice,
                stock,
                minStockAlert,
                unit: formData.unit.trim() || 'pcs',
                image: formData.image.trim() || undefined,
            };
            onAddProduct(newProduct);
        }
        setIsFormOpen(false);
    };
    const handleStockAdjustSubmit = (e) => {
        e.preventDefault();
        if (!adjustingProduct)
            return;
        let newStock = adjustingProduct.stock;
        if (adjustType === 'add') {
            newStock += adjustAmount;
        }
        else {
            newStock = adjustAmount;
        }
        newStock = Math.max(0, newStock);
        onQuickAdjustStock(adjustingProduct.id, newStock);
        setAdjustingProduct(null);
    };
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-4 sm:p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4", children: [_jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3", children: [_jsx("div", { className: "p-3 bg-emerald-50 text-emerald-600 rounded-xl", children: _jsx(Package, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-slate-500 font-medium", children: "Total Jenis Produk" }), _jsxs("div", { className: "text-xl font-bold text-slate-900 mt-0.5", children: [stats.totalProducts, " Item"] }), _jsxs("div", { className: "text-[11px] text-slate-400", children: [stats.totalStockCount, " total unit stok"] })] })] }), _jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3", children: [_jsx("div", { className: "p-3 bg-blue-50 text-blue-600 rounded-xl", children: _jsx(DollarSign, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-slate-500 font-medium", children: "Nilai Modal Stok (Aset)" }), _jsx("div", { className: "text-lg font-bold text-slate-900 mt-0.5 font-mono-receipt", children: formatRupiah(stats.totalInventoryValue) }), _jsxs("div", { className: "text-[11px] text-emerald-600 font-medium", children: ["Potensi Jual: ", formatRupiah(stats.totalPotentialSales)] })] })] }), _jsxs("div", { onClick: () => setStockFilter(stockFilter === 'low' ? 'all' : 'low'), className: `p-4 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${stockFilter === 'low' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400' : 'bg-white border-slate-200 shadow-xs hover:border-amber-300'}`, children: [_jsx("div", { className: "p-3 bg-amber-50 text-amber-600 rounded-xl", children: _jsx(AlertTriangle, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-slate-500 font-medium", children: "Stok Menipis" }), _jsxs("div", { className: "text-xl font-bold text-amber-600 mt-0.5", children: [stats.lowStockCount, " Produk"] }), _jsx("div", { className: "text-[11px] text-amber-700", children: "Perlu reorder segera" })] })] }), _jsxs("div", { onClick: () => setStockFilter(stockFilter === 'out' ? 'all' : 'out'), className: `p-4 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${stockFilter === 'out' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400' : 'bg-white border-slate-200 shadow-xs hover:border-rose-300'}`, children: [_jsx("div", { className: "p-3 bg-rose-50 text-rose-600 rounded-xl", children: _jsx(X, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-xs text-slate-500 font-medium", children: "Stok Habis (Kosong)" }), _jsxs("div", { className: "text-xl font-bold text-rose-600 mt-0.5", children: [stats.outOfStockCount, " Produk"] }), _jsx("div", { className: "text-[11px] text-rose-700", children: "Tidak bisa dijual" })] })] })] }), _jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1", children: [_jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [_jsx(Search, { className: "w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" }), _jsx("input", { type: "text", placeholder: "Cari nama produk, SKU, barcode...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsx("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500", children: categoryOptions.map((cat) => (_jsx("option", { value: cat, children: cat }, cat))) }), _jsxs("select", { value: stockFilter, onChange: (e) => setStockFilter(e.target.value), className: "px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500", children: [_jsx("option", { value: "all", children: "Semua Status Stok" }), _jsx("option", { value: "low", children: "Hanya Stok Menipis" }), _jsx("option", { value: "out", children: "Hanya Stok Habis" })] })] }), _jsxs("div", { className: "w-full md:w-auto flex gap-2 shrink-0", children: [_jsx("button", { type: "button", onClick: () => setIsCategoryManagerOpen(true), className: "flex-1 md:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all active:scale-95", children: [_jsx(Tag, { className: "w-4 h-4 text-emerald-400" }), _jsx("span", { children: "Kategori" })] }), _jsx("button", { id: "add-product-btn", onClick: handleOpenAddModal, className: "flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-md shadow-emerald-700/20 transition-all active:scale-95", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Tambah Produk Baru" })] })] })] }), _jsx("div", { className: "bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-xs sm:text-sm", children: [_jsx("thead", { className: "bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider", children: _jsxs("tr", { children: [_jsx("th", { className: "py-3.5 px-4", children: "Produk" }), _jsx("th", { className: "py-3.5 px-4", children: "Kategori" }), _jsx("th", { className: "py-3.5 px-4 text-right", children: "Harga Modal" }), _jsx("th", { className: "py-3.5 px-4 text-right", children: "Harga Jual" }), _jsx("th", { className: "py-3.5 px-4 text-center", children: "Margin" }), _jsx("th", { className: "py-3.5 px-4 text-center", children: "Stok" }), _jsx("th", { className: "py-3.5 px-4 text-center", children: "Aksi" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: filteredProducts.length === 0 ? (_jsx("tr", { children: _jsxs("td", { colSpan: 7, className: "py-12 text-center text-slate-400", children: [_jsx(Package, { className: "w-10 h-10 mx-auto text-slate-300 mb-2" }), _jsx("p", { className: "font-semibold text-slate-700", children: "Tidak ada data produk yang cocok" }), _jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "Coba ubah filter atau kata kunci pencarian" })] }) })) : (filteredProducts.map((p) => {
                                    const marginPercent = p.sellingPrice > 0
                                        ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
                                        : 0;
                                    const isOutOfStock = p.stock <= 0;
                                    const isLowStock = p.stock > 0 && p.stock <= p.minStockAlert;
                                    return (_jsxs("tr", { className: "hover:bg-slate-50/80 transition-colors", children: [_jsx("td", { className: "py-3 px-4", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200", children: p.image ? (_jsx("img", { src: p.image, alt: p.name, referrerPolicy: "no-referrer", className: "w-full h-full object-cover" })) : (_jsx(Tag, { className: "w-5 h-5 text-slate-400" })) }), _jsxs("div", { children: [_jsx("div", { className: "font-bold text-slate-800", children: p.name }), _jsxs("div", { className: "text-[11px] text-slate-500 font-mono flex items-center space-x-2", children: [_jsxs("span", { children: ["SKU: ", p.sku] }), p.barcode && _jsxs("span", { children: ["\u2022 Barcode: ", p.barcode] })] })] })] }) }), _jsx("td", { className: "py-3 px-4", children: _jsx("span", { className: "px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700", children: p.category }) }), _jsx("td", { className: "py-3 px-4 text-right font-mono-receipt text-slate-600", children: formatRupiah(p.costPrice) }), _jsx("td", { className: "py-3 px-4 text-right font-mono-receipt font-bold text-emerald-600", children: formatRupiah(p.sellingPrice) }), _jsx("td", { className: "py-3 px-4 text-center", children: _jsxs("span", { className: `px-2 py-0.5 rounded-full text-[11px] font-bold ${marginPercent >= 25
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : marginPercent > 10
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'bg-amber-50 text-amber-700'}`, children: ["+", marginPercent, "%"] }) }), _jsx("td", { className: "py-3 px-4 text-center", children: _jsx("div", { className: "inline-flex items-center space-x-1.5", children: _jsxs("button", { onClick: () => {
                                                            setAdjustingProduct(p);
                                                            setAdjustAmount(10);
                                                            setAdjustType('add');
                                                        }, className: `px-2.5 py-1 rounded-lg text-xs font-bold font-mono-receipt transition-colors ${isOutOfStock
                                                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                            : isLowStock
                                                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`, title: "Klik untuk ubah stok cepat", children: [p.stock, " ", p.unit] }) }) }), _jsx("td", { className: "py-3 px-4 text-center", children: _jsxs("div", { className: "flex items-center justify-center space-x-1.5", children: [_jsx("button", { onClick: () => handleOpenEditModal(p), className: "p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors", title: "Edit Produk", children: _jsx(Edit3, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => {
                                                                if (confirm(`Yakin ingin menghapus produk "${p.name}"?`)) {
                                                                    onDeleteProduct(p.id);
                                                                }
                                                            }, className: "p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors", title: "Hapus Produk", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, p.id));
                                })) })] }) }) }), isFormOpen && (_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto", children: [_jsxs("div", { className: "p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Package, { className: "w-5 h-5 text-emerald-400" }), _jsx("h3", { className: "font-bold text-base", children: editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru' })] }), _jsx("button", { onClick: () => setIsFormOpen(false), className: "text-slate-400 hover:text-white p-1 rounded-lg", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("form", { onSubmit: handleSubmitForm, className: "p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: ["Nama Produk ", _jsx("span", { className: "text-rose-500", children: "*" })] }), _jsx("input", { type: "text", required: true, placeholder: "Contoh: Kopi Susu Aren Botol 250ml", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Kode SKU" }), _jsx("input", { type: "text", value: formData.sku, onChange: (e) => setFormData({ ...formData, sku: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Barcode (EAN)" }), _jsx("div", { className: "relative", children: _jsx("input", { type: "text", value: formData.barcode, onChange: (e) => setFormData({ ...formData, barcode: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Kategori" }), _jsx("select", { value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500", children: categories.map((cat) => (_jsx("option", { value: cat, children: cat }, cat))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Satuan" }), _jsx("input", { type: "text", placeholder: "pcs / pack / kg / botol", value: formData.unit, onChange: (e) => setFormData({ ...formData, unit: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Harga Modal / Beli (Rp)" }), _jsx("input", { type: "number", min: "0", placeholder: "0", value: formData.costPrice, onChange: (e) => setFormData({ ...formData, costPrice: e.target.value }), className: "w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold font-mono-receipt focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-xs font-bold text-emerald-800 mb-1", children: ["Harga Jual Kasir (Rp) ", _jsx("span", { className: "text-rose-500", children: "*" })] }), _jsx("input", { type: "number", min: "0", required: true, placeholder: "0", value: formData.sellingPrice, onChange: (e) => setFormData({ ...formData, sellingPrice: e.target.value }), className: "w-full px-3 py-2 bg-white border border-emerald-400 rounded-xl text-sm font-bold font-mono-receipt text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Stok Saat Ini" }), _jsx("input", { type: "number", min: "0", value: formData.stock, onChange: (e) => setFormData({ ...formData, stock: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono-receipt focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Batas Peringatan Stok Menipis" }), _jsx("input", { type: "number", min: "1", value: formData.minStockAlert, onChange: (e) => setFormData({ ...formData, minStockAlert: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono-receipt focus:outline-none focus:ring-2 focus:ring-emerald-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Foto Produk" }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("label", { className: "px-3 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold text-center cursor-pointer hover:bg-emerald-100 transition-colors", children: ["📷 Ambil Foto", _jsx("input", { type: "file", accept: "image/*", capture: "environment", onChange: handleProductImageFile, className: "hidden" })] }), _jsxs("label", { className: "px-3 py-2.5 bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold text-center cursor-pointer hover:bg-slate-100 transition-colors", children: ["🖼️ Pilih dari Galeri", _jsx("input", { type: "file", accept: "image/*", onChange: handleProductImageFile, className: "hidden" })] })] }), formData.image && (_jsxs("div", { className: "mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200", children: [_jsx("img", { src: formData.image, alt: "Preview produk", className: "w-14 h-14 rounded-lg object-cover" }), _jsx("span", { className: "text-[11px] text-emerald-700 font-semibold", children: "Foto siap disimpan" }), _jsx("button", { type: "button", onClick: () => setFormData({ ...formData, image: '' }), className: "ml-auto text-xs text-rose-600 font-bold", children: "Hapus" })] }))] }), _jsxs("div", { className: "pt-3 border-t border-slate-200 flex space-x-2", children: [_jsx("button", { type: "button", onClick: () => setIsFormOpen(false), className: "flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold", children: "Batal" }), _jsx("button", { type: "submit", className: "flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20", children: editingProduct ? 'Simpan Perubahan' : 'Tambah Produk' })] })] })] }) })), isCategoryManagerOpen && (_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-200", children: [_jsx("h3", { className: "font-bold text-base text-slate-900", children: "Kelola Kategori Produk" }), _jsx("button", { type: "button", onClick: () => setIsCategoryManagerOpen(false), className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "pt-4 space-y-3", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: newCategoryName, onChange: (e) => setNewCategoryName(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }, placeholder: "Nama kategori baru", className: "flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" }), _jsx("button", { type: "button", onClick: handleAddCategory, className: "px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold", children: "Tambah" })] }), _jsx("div", { className: "space-y-2 max-h-56 overflow-y-auto", children: categories.map((category) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-bold text-slate-800", children: category }), _jsxs("div", { className: "text-[10px] text-slate-500", children: [products.filter((product) => product.category === category).length, " produk"] })] }), _jsx("button", { type: "button", onClick: () => handleDeleteCategory(category), className: "px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-bold", children: "Hapus" })] }, category))) })] })] }) })), adjustingProduct && (_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-200", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RefreshCw, { className: "w-5 h-5 text-emerald-600" }), _jsx("h3", { className: "font-bold text-base text-slate-900", children: "Sesuaikan Stok Produk" })] }), _jsx("button", { onClick: () => setAdjustingProduct(null), className: "text-slate-400 hover:text-slate-600 text-lg font-bold", children: "\u2715" })] }), _jsxs("form", { onSubmit: handleStockAdjustSubmit, className: "mt-4 space-y-4", children: [_jsxs("div", { className: "bg-slate-50 p-3 rounded-xl border border-slate-200", children: [_jsx("div", { className: "font-bold text-sm text-slate-900", children: adjustingProduct.name }), _jsxs("div", { className: "text-xs text-slate-500 mt-0.5", children: ["Stok saat ini:", ' ', _jsxs("span", { className: "font-bold text-slate-800 font-mono-receipt", children: [adjustingProduct.stock, " ", adjustingProduct.unit] })] })] }), _jsxs("div", { className: "flex rounded-xl bg-slate-100 p-1", children: [_jsx("button", { type: "button", onClick: () => setAdjustType('add'), className: `flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${adjustType === 'add'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'}`, children: "+ Tambah Stok (Restock)" }), _jsx("button", { type: "button", onClick: () => setAdjustType('set'), className: `flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${adjustType === 'set'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'}`, children: "Ubah Total Langsung" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: adjustType === 'add' ? 'Jumlah Tambahan Stok' : 'Jumlah Stok Baru' }), _jsx("input", { type: "number", required: true, min: adjustType === 'add' ? 1 : 0, value: adjustAmount, onChange: (e) => setAdjustAmount(parseInt(e.target.value) || 0), className: "w-full px-3 py-2.5 border-2 border-emerald-500 rounded-xl text-lg font-bold font-mono-receipt text-center", autoFocus: true })] }), _jsxs("div", { className: "flex space-x-2 pt-2", children: [_jsx("button", { type: "button", onClick: () => setAdjustingProduct(null), className: "flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold", children: "Batal" }), _jsx("button", { type: "submit", className: "flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md", children: "Simpan Stok" })] })] })] }) }))] }));
};