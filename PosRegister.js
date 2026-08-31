import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Barcode, Plus, Minus, Trash2, ShoppingBag, Percent, CreditCard, User, RotateCcw, BookmarkCheck, FolderPlus, AlertCircle, CheckCircle2, Tag, ArrowLeft, ChevronRight, Camera, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatRupiah, playBeepSound } from './formatters.js';
export const PosRegister = ({ products, categories = [], cart, setCart, storeSettings, onOpenPayment, heldOrders, onHoldOrder, onRestoreHeldOrder, onDeleteHeldOrder, onOpenCameraScanner, }) => {
    const categoryOptions = ['Semua', ...categories.filter(Boolean)];
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [customerName, setCustomerName] = useState('Pelanggan Umum');
    const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);
    const [showDiscountInput, setShowDiscountInput] = useState(false);
    const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [scanMessage, setScanMessage] = useState(null);
    const [mobilePosTab, setMobilePosTab] = useState('catalog');
    useEffect(() => {
        if (selectedCategory !== 'Semua' && !categories.includes(selectedCategory)) {
            setSelectedCategory('Semua');
        }
    }, [categories, selectedCategory]);
    const searchInputRef = useRef(null);
    const barcodeInputRef = useRef(null);
    // Focus barcode input when modal opens
    useEffect(() => {
        if (showBarcodeScanner && barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, [showBarcodeScanner]);
    // A completed/cleared transaction must not leak customer or discount state into the next sale.
    useEffect(() => {
        if (cart.length === 0) {
            setCustomerName('Pelanggan Umum');
            setGlobalDiscountPercent(0);
            setShowDiscountInput(false);
            setMobilePosTab('cart');
        }
    }, [cart.length]);
    // Filter products by category and search
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
            const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.barcode && p.barcode.includes(searchQuery));
            return matchCategory && matchSearch;
        });
    }, [products, selectedCategory, searchQuery]);
    // Add to cart helper
    const handleAddToCart = (product) => {
        if (product.stock <= 0) {
            alert(`Stok untuk "${product.name}" telah habis!`);
            return;
        }
        const existingIndex = cart.findIndex((item) => item.product.id === product.id);
        if (existingIndex > -1) {
            const currentQty = cart[existingIndex].quantity;
            if (currentQty >= product.stock) {
                alert(`Jumlah melebihi stok yang tersedia (${product.stock} ${product.unit}).`);
                return;
            }
            const updatedCart = [...cart];
            updatedCart[existingIndex].quantity += 1;
            setCart(updatedCart);
        }
        else {
            setCart([...cart, { product, quantity: 1, customDiscount: 0 }]);
        }
        playBeepSound('beep');
    };
    // Update quantity in cart
    const handleUpdateQuantity = (productId, delta) => {
        const updated = cart
            .map((item) => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty > item.product.stock) {
                    alert(`Jumlah melebihi stok yang tersedia (${item.product.stock} ${item.product.unit}).`);
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        })
            .filter((item) => item.quantity > 0);
        setCart(updated);
        if (delta < 0) {
            playBeepSound('delete');
        }
        else {
            playBeepSound('beep');
        }
    };
    const handleUpdateItemDiscount = (productId, discount) => {
        setCart((prev) => prev.map((item) => item.product.id === productId
            ? {
                ...item,
                customDiscount: Math.min(item.product.sellingPrice, Math.max(0, Number.isFinite(discount) ? discount : 0)),
            }
            : item));
    };
    // Remove single item
    const handleRemoveItem = (productId) => {
        setCart(cart.filter((item) => item.product.id !== productId));
        playBeepSound('delete');
    };
    // Clear entire cart
    const handleClearCart = () => {
        if (cart.length === 0)
            return;
        if (confirm('Kosongkan semua barang di keranjang kasir?')) {
            setCart([]);
            setGlobalDiscountPercent(0);
            setCustomerName('Pelanggan Umum');
            playBeepSound('delete');
        }
    };
    // Handle Barcode Scan Simulation
    const handleBarcodeSubmit = (e) => {
        e.preventDefault();
        if (!barcodeInput.trim())
            return;
        const matchedProduct = products.find((p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase());
        if (matchedProduct) {
            handleAddToCart(matchedProduct);
            setScanMessage({
                text: `Berhasil menambahkan: ${matchedProduct.name}`,
                type: 'success',
            });
            setBarcodeInput('');
        }
        else {
            setScanMessage({
                text: `Barcode "${barcodeInput}" tidak ditemukan dalam sistem!`,
                type: 'error',
            });
        }
        setTimeout(() => {
            setScanMessage(null);
        }, 3000);
    };
    // Cart Calculations
    const subtotal = useMemo(() => {
        return cart.reduce((sum, item) => {
            const itemPrice = Math.max(0, item.product.sellingPrice - (item.customDiscount || 0));
            return sum + itemPrice * item.quantity;
        }, 0);
    }, [cart]);
    const discountAmount = useMemo(() => {
        if (globalDiscountPercent <= 0)
            return 0;
        return Math.round((subtotal * globalDiscountPercent) / 100);
    }, [subtotal, globalDiscountPercent]);
    const taxAmount = useMemo(() => {
        if (!storeSettings.enableTax || storeSettings.taxPercent <= 0)
            return 0;
        const taxableAmount = subtotal - discountAmount;
        return Math.round((taxableAmount * storeSettings.taxPercent) / 100);
    }, [subtotal, discountAmount, storeSettings.enableTax, storeSettings.taxPercent]);
    const grandTotal = useMemo(() => {
        return Math.max(0, subtotal - discountAmount + taxAmount);
    }, [subtotal, discountAmount, taxAmount]);
    const totalItemCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);
    // Proceed to payment
    const handleCheckoutClick = () => {
        if (cart.length === 0)
            return;
        onOpenPayment({
            subtotal,
            discount: discountAmount,
            tax: taxAmount,
            total: grandTotal,
            customerName: customerName.trim() || 'Pelanggan Umum',
        });
    };
    // Handle save/hold order
    const handleSaveOrder = () => {
        if (cart.length === 0)
            return;
        const name = customerName.trim() || 'Pesanan Disimpan';
        onHoldOrder(name, globalDiscountPercent);
        setCart([]);
        setGlobalDiscountPercent(0);
        setCustomerName('Pelanggan Umum');
    };
    return (_jsxs("div", { className: "flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] pb-14 lg:pb-0 overflow-hidden bg-slate-100", children: [_jsxs("div", { className: "flex lg:hidden bg-slate-900 text-white p-1.5 border-b border-slate-800 gap-1 shrink-0", children: [_jsxs("button", { onClick: () => setMobilePosTab('catalog'), className: `flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${mobilePosTab === 'catalog'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white bg-slate-800/60'}`, children: [_jsx(ShoppingBag, { className: "w-3.5 h-3.5" }), _jsxs("span", { children: ["Katalog Produk (", filteredProducts.length, ")"] })] }), _jsxs("button", { onClick: () => setMobilePosTab('cart'), className: `flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${mobilePosTab === 'cart'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white bg-slate-800/60'}`, children: [_jsx(ShoppingCart, { className: "w-3.5 h-3.5" }), _jsxs("span", { children: ["Keranjang (", totalItemCount, ")"] }), cart.length > 0 && (_jsx("span", { className: "ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-extrabold", children: formatRupiah(grandTotal) }))] })] }), _jsxs("div", { className: `flex-1 flex flex-col min-w-0 overflow-hidden border-r border-slate-200 bg-slate-50 ${mobilePosTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`, children: [_jsxs("div", { className: "p-2.5 sm:p-4 bg-white border-b border-slate-200 flex items-center gap-2 shrink-0 shadow-xs", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" }), _jsx("input", { ref: searchInputRef, id: "pos-search-input", type: "text", placeholder: "Cari produk (Nama, SKU, Barcode)...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full pl-10 pr-8 py-2 sm:py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" }), searchQuery && (_jsx("button", { onClick: () => setSearchQuery(''), className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 w-5 h-5 rounded-full flex items-center justify-center", children: "\u00D7" }))] }), onOpenCameraScanner && (_jsxs("button", { onClick: onOpenCameraScanner, className: "flex items-center space-x-1.5 px-3 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-xs shrink-0", title: "Buka Kamera HP untuk Scan Barcode", children: [_jsx(Camera, { className: "w-4 h-4 text-white" }), _jsx("span", { className: "hidden sm:inline", children: "Kamera" })] })), _jsxs("button", { id: "pos-barcode-scan-btn", onClick: () => setShowBarcodeScanner(true), className: "flex items-center space-x-1 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-xs shrink-0", title: "Scan Barcode Produk Manual/Simulasi", children: [_jsx(Barcode, { className: "w-4 h-4 text-emerald-400" }), _jsx("span", { className: "hidden md:inline", children: "Barcode" })] }), heldOrders.length > 0 && (_jsxs("button", { id: "pos-held-orders-btn", onClick: () => setShowHeldOrdersModal(true), className: "flex items-center space-x-1 px-2.5 py-2 sm:py-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors shrink-0 animate-pulse", title: "Pesanan Tertahan", children: [_jsx(BookmarkCheck, { className: "w-3.5 h-3.5 text-amber-600" }), _jsx("span", { children: heldOrders.length })] }))] }), _jsx("div", { className: "px-3 sm:px-4 py-2.5 bg-white border-b border-slate-200 overflow-x-auto flex items-center space-x-2 shrink-0 scrollbar-none", children: categoryOptions.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            const count = cat === 'Semua'
                                ? products.length
                                : products.filter((p) => p.category === cat).length;
                            return (_jsxs("button", { onClick: () => setSelectedCategory(cat), className: `px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 ${isSelected
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'}`, children: [_jsx("span", { children: cat }), _jsx("span", { className: `text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'}`, children: count })] }, cat));
                        }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-3 sm:p-4", children: filteredProducts.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-64 text-center p-6 bg-white rounded-2xl border border-dashed border-slate-300", children: [_jsx(ShoppingBag, { className: "w-12 h-12 text-slate-300 mb-3" }), _jsx("h3", { className: "text-base font-bold text-slate-700", children: "Produk Tidak Ditemukan" }), _jsxs("p", { className: "text-xs text-slate-500 max-w-sm mt-1", children: ["Tidak ada produk dengan kata kunci \"", searchQuery, "\" atau di kategori \"", selectedCategory, "\"."] }), _jsx("button", { onClick: () => {
                                        setSearchQuery('');
                                        setSelectedCategory('Semua');
                                    }, className: "mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-colors", children: "Reset Pencarian & Filter" })] })) : (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5", children: filteredProducts.map((product) => {
                                const inCartItem = cart.find((i) => i.product.id === product.id);
                                const isOutOfStock = product.stock <= 0;
                                const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
                                return (_jsxs(motion.div, { whileTap: { scale: isOutOfStock ? 1 : 0.97 }, id: `pos-product-${product.id}`, onClick: () => !isOutOfStock && handleAddToCart(product), className: `group relative flex flex-col justify-between bg-white rounded-2xl p-2.5 sm:p-3 border transition-all cursor-pointer select-none ${isOutOfStock
                                        ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                                        : inCartItem
                                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/5'
                                            : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'}`, children: [inCartItem && (_jsx("div", { className: "absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md z-10 animate-scale", children: inCartItem.quantity })), isOutOfStock ? (_jsx("div", { className: "absolute top-2 left-2 z-10 px-2 py-0.5 bg-rose-500/90 text-white rounded-md text-[10px] font-bold tracking-tight uppercase shadow-xs", children: "Habis" })) : isLowStock ? (_jsxs("div", { className: "absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-amber-500/90 text-white rounded-md text-[9px] font-semibold", children: ["Sisa ", product.stock] })) : null, _jsx("div", { className: "w-full aspect-square rounded-xl bg-slate-100 overflow-hidden mb-2 relative flex items-center justify-center", children: product.image ? (_jsx("img", { src: product.image, alt: product.name, referrerPolicy: "no-referrer", className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" })) : (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center p-2 text-center", style: { backgroundColor: `${product.colorTag || '#059669'}15` }, children: [_jsx(Tag, { className: "w-6 h-6 text-slate-400 mb-1" }), _jsx("span", { className: "text-[10px] font-medium text-slate-600 line-clamp-1", children: product.category })] })) }), _jsxs("div", { className: "flex-1 flex flex-col justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-[10px] text-slate-600 mb-0.5", children: [_jsx("span", { className: "font-mono", children: product.sku }), _jsxs("span", { className: "text-slate-600", children: ["Stok: ", product.stock, " ", product.unit] })] }), _jsx("h4", { className: "font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors", children: product.name })] }), _jsxs("div", { className: "mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between", children: [_jsx("span", { className: "font-bold text-xs sm:text-sm text-emerald-600 font-mono-receipt", children: formatRupiah(product.sellingPrice) }), _jsx("div", { className: `w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isOutOfStock
                                                                ? 'bg-slate-200 text-slate-400'
                                                                : inCartItem
                                                                    ? 'bg-emerald-600 text-white'
                                                                    : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'}`, children: _jsx(Plus, { className: "w-3.5 h-3.5" }) })] })] })] }, product.id));
                            }) })) }), cart.length > 0 && mobilePosTab === 'catalog' && (_jsxs("div", { className: "lg:hidden p-2.5 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between shadow-2xl shrink-0", children: [_jsxs("div", { className: "flex items-center space-x-2.5", children: [_jsx("div", { className: "w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-md", children: totalItemCount }), _jsxs("div", { children: [_jsxs("div", { className: "text-[11px] text-slate-400 font-medium", children: ["Total (", cart.length, " item):"] }), _jsx("div", { className: "text-sm font-extrabold text-white font-mono-receipt", children: formatRupiah(grandTotal) })] })] }), _jsxs("button", { onClick: () => setMobilePosTab('cart'), className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-700/30 active:scale-95 transition-all", children: [_jsx("span", { children: "Lihat & Bayar" }), _jsx(ChevronRight, { className: "w-4 h-4" })] })] }))] }), _jsxs("div", { className: `w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-white border-t lg:border-t-0 border-slate-200 shrink-0 shadow-lg z-20 ${mobilePosTab === 'cart' ? 'flex flex-1' : 'hidden lg:flex'}`, children: [_jsxs("div", { className: "p-3 sm:p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => setMobilePosTab('catalog'), className: "lg:hidden p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg mr-1", title: "Kembali ke Katalog", children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }), _jsx("div", { className: "p-1.5 bg-emerald-600 rounded-lg", children: _jsx(ShoppingBag, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { children: [_jsx("h2", { className: "font-bold text-sm sm:text-base leading-tight", children: "Keranjang Kasir" }), _jsxs("span", { className: "text-xs text-slate-400", children: [totalItemCount, " barang (", cart.length, " jenis)"] })] })] }), _jsx("div", { className: "flex items-center space-x-1.5", children: cart.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("button", { id: "hold-cart-btn", onClick: handleSaveOrder, className: "px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center space-x-1 transition-colors", title: "Simpan sementara pesanan ini", children: [_jsx(FolderPlus, { className: "w-3.5 h-3.5 text-amber-400" }), _jsx("span", { className: "hidden sm:inline", children: "Hold" })] }), _jsx("button", { id: "clear-cart-btn", onClick: handleClearCart, className: "p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors", title: "Kosongkan Keranjang", children: _jsx(RotateCcw, { className: "w-4 h-4" }) })] })) })] }), _jsxs("div", { className: "px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 text-xs", children: [_jsx(User, { className: "w-3.5 h-3.5 text-slate-500 shrink-0" }), _jsx("span", { className: "text-slate-500 font-medium shrink-0", children: "Pelanggan:" }), _jsx("input", { id: "pos-customer-input", type: "text", value: customerName, onChange: (e) => setCustomerName(e.target.value), placeholder: "Nama Pelanggan / Meja...", className: "flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium" })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100", children: cart.length === 0 ? (_jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center p-6 text-slate-400", children: [_jsx(ShoppingBag, { className: "w-14 h-14 text-slate-300 stroke-1 mb-3 animate-bounce" }), _jsx("h4", { className: "font-bold text-slate-700 text-sm", children: "Keranjang Masih Kosong" }), _jsx("p", { className: "text-xs text-slate-400 max-w-xs mt-1", children: "Pilih produk dari daftar di sebelah kiri atau gunakan scan barcode untuk menambahkan item." })] })) : (_jsx(AnimatePresence, { initial: false, children: cart.map((item) => {
                                const itemSubtotal = Math.max(0, item.product.sellingPrice - (item.customDiscount || 0)) * item.quantity;
                                return (_jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, className: "pt-2 first:pt-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "text-xs sm:text-sm font-bold text-slate-800 line-clamp-1", children: item.product.name }), _jsxs("div", { className: "flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5", children: [_jsx("span", { className: "font-mono-receipt text-emerald-600 font-semibold", children: formatRupiah(item.product.sellingPrice) }), _jsxs("span", { children: ["/ ", item.product.unit] }), item.customDiscount > 0 && (_jsxs("span", { className: "text-rose-500 font-semibold", children: ["(Disc: -", formatRupiah(item.customDiscount), ")"] }))] })] }), _jsx("span", { className: "text-xs sm:text-sm font-bold font-mono-receipt text-slate-900 shrink-0", children: formatRupiah(itemSubtotal) })] }), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsxs("div", { className: "flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200", children: [_jsx("button", { onClick: () => handleUpdateQuantity(item.product.id, -1), className: "w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold shadow-xs transition-colors", children: _jsx(Minus, { className: "w-3 h-3" }) }), _jsx("span", { className: "w-8 text-center font-bold text-xs sm:text-sm text-slate-800 font-mono-receipt", children: item.quantity }), _jsx("button", { onClick: () => handleUpdateQuantity(item.product.id, 1), className: "w-7 h-7 bg-white hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold shadow-xs transition-colors", children: _jsx(Plus, { className: "w-3 h-3" }) })] }), _jsxs("div", { className: "flex items-center gap-1 ml-auto mr-1", title: "Diskon nominal per item", children: [_jsx("span", { className: "text-[10px] text-slate-400", children: "Disc/item" }), _jsx("input", { type: "number", min: "0", max: item.product.sellingPrice, step: "500", value: item.customDiscount || '', onChange: (e) => handleUpdateItemDiscount(item.product.id, Number(e.target.value)), placeholder: "0", className: "w-20 px-1.5 py-1 text-[10px] font-mono-receipt bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" })] }), _jsx("button", { onClick: () => handleRemoveItem(item.product.id), className: "p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors", title: "Hapus item", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, item.product.id));
                            }) })) }), _jsxs("div", { className: "p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-2.5", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-slate-600", children: [_jsx("span", { children: "Subtotal" }), _jsx("span", { className: "font-mono-receipt font-semibold text-slate-800", children: formatRupiah(subtotal) })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("button", { onClick: () => setShowDiscountInput(!showDiscountInput), className: "flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-medium hover:underline", children: [_jsx(Percent, { className: "w-3 h-3" }), _jsxs("span", { children: ["Diskon Transaksi ", globalDiscountPercent > 0 ? `(${globalDiscountPercent}%)` : ''] })] }), _jsx("span", { className: "font-mono-receipt font-semibold text-rose-600", children: discountAmount > 0 ? `-${formatRupiah(discountAmount)}` : 'Rp 0' })] }), showDiscountInput && (_jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, className: "flex items-center space-x-2 pt-1", children: [0, 5, 10, 15, 20].map((pct) => (_jsx("button", { onClick: () => setGlobalDiscountPercent(pct), className: `px-2 py-1 rounded-lg text-xs font-semibold border ${globalDiscountPercent === pct
                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`, children: pct === 0 ? '0%' : `${pct}%` }, pct))) }))] }), storeSettings.enableTax && (_jsxs("div", { className: "flex items-center justify-between text-xs text-slate-600", children: [_jsxs("span", { children: ["PPN / Pajak (", storeSettings.taxPercent, "%)"] }), _jsxs("span", { className: "font-mono-receipt font-semibold text-slate-800", children: ["+", formatRupiah(taxAmount)] })] })), _jsxs("div", { className: "pt-2 border-t border-slate-200 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Total Tagihan" }), _jsx("div", { className: "text-xl sm:text-2xl font-extrabold text-slate-900 font-mono-receipt", children: formatRupiah(grandTotal) })] }), _jsxs("button", { id: "pos-pay-button", disabled: cart.length === 0, onClick: handleCheckoutClick, className: `px-5 sm:px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center space-x-2 shadow-lg transition-all ${cart.length === 0
                                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/25 active:scale-95'}`, children: [_jsx(CreditCard, { className: "w-5 h-5" }), _jsx("span", { children: "Bayar (F9)" })] })] })] })] }), showBarcodeScanner && (_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-200", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "p-2 bg-slate-900 text-emerald-400 rounded-xl", children: _jsx(Barcode, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-base text-slate-900", children: "Scanner Barcode Kasir" }), _jsx("p", { className: "text-xs text-slate-500", children: "Scan dengan barcode reader atau ketik SKU" })] })] }), _jsx("button", { onClick: () => setShowBarcodeScanner(false), className: "text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center", children: "\u2715" })] }), _jsxs("form", { onSubmit: handleBarcodeSubmit, className: "mt-4 space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "Masukkan Nomor Barcode / SKU" }), _jsx("div", { className: "relative", children: _jsx("input", { ref: barcodeInputRef, type: "text", placeholder: "Contoh: 8998866200221 atau MKN-001", value: barcodeInput, onChange: (e) => setBarcodeInput(e.target.value), className: "w-full px-3.5 py-3 border-2 border-emerald-500 rounded-xl text-base font-mono-receipt focus:outline-none focus:ring-2 focus:ring-emerald-500", autoFocus: true }) })] }), scanMessage && (_jsxs("div", { className: `p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${scanMessage.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-800 border border-rose-200'}`, children: [scanMessage.type === 'success' ? (_jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-600 shrink-0" })) : (_jsx(AlertCircle, { className: "w-4 h-4 text-rose-600 shrink-0" })), _jsx("span", { children: scanMessage.text })] })), _jsxs("div", { className: "pt-2", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Contoh Barcode Cepat:" }), _jsx("div", { className: "grid grid-cols-2 gap-1.5 mt-1.5", children: products.slice(0, 4).map((p) => (_jsxs("button", { type: "button", onClick: () => {
                                                    setBarcodeInput(p.barcode || p.sku);
                                                }, className: "p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-xs transition-colors", children: [_jsx("div", { className: "font-bold text-slate-800 truncate", children: p.name }), _jsx("div", { className: "text-[10px] font-mono text-slate-500", children: p.barcode || p.sku })] }, p.id))) })] }), _jsxs("div", { className: "flex space-x-2 pt-3", children: [_jsx("button", { type: "button", onClick: () => setShowBarcodeScanner(false), className: "flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors", children: "Tutup" }), _jsx("button", { type: "submit", className: "flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-700/20", children: "Scan / Tambahkan" })] })] })] }) })), showHeldOrdersModal && (_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-200", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(BookmarkCheck, { className: "w-5 h-5 text-amber-600" }), _jsx("h3", { className: "font-bold text-base text-slate-900", children: "Pesanan Tersimpan (Hold)" })] }), _jsx("button", { onClick: () => setShowHeldOrdersModal(false), className: "text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center", children: "\u2715" })] }), _jsx("div", { className: "flex-1 overflow-y-auto py-3 space-y-2.5", children: heldOrders.map((order) => {
                                const heldSubtotal = order.items.reduce((sum, i) => sum + Math.max(0, i.product.sellingPrice - (i.customDiscount || 0)) * i.quantity, 0);
                                const heldDiscount = Math.round((heldSubtotal * Math.max(0, Math.min(100, order.globalDiscountPercent || 0))) / 100);
                                const heldTaxable = heldSubtotal - heldDiscount;
                                const heldTax = storeSettings.enableTax
                                    ? Math.round((heldTaxable * storeSettings.taxPercent) / 100)
                                    : 0;
                                const totalAmount = heldTaxable + heldTax;
                                return (_jsxs("div", { className: "p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-all flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "font-bold text-sm text-slate-800", children: order.name }), _jsx("span", { className: "text-[10px] text-slate-400", children: order.time })] }), _jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: [order.items.length, " item \u2022 Total: ", formatRupiah(totalAmount)] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => {
                                                        const restored = onRestoreHeldOrder(order.id);
                                                        if (restored) {
                                                            setCustomerName(restored.customerName || restored.name || 'Pelanggan Umum');
                                                            setGlobalDiscountPercent(restored.globalDiscountPercent || 0);
                                                            setShowHeldOrdersModal(false);
                                                            setMobilePosTab('cart');
                                                        }
                                                    }, className: "px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors", children: "Buka Kembali" }), _jsx("button", { onClick: () => onDeleteHeldOrder(order.id), className: "p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors", title: "Hapus", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, order.id));
                            }) }), _jsx("div", { className: "pt-3 border-t border-slate-200 text-right", children: _jsx("button", { onClick: () => setShowHeldOrdersModal(false), className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold", children: "Tutup" }) })] }) }))] }));
};
