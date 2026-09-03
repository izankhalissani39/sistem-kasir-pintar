import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS, INITIAL_TRANSACTIONS, PRODUCT_CATALOG_VERSION, INITIAL_CATEGORIES } from './initialData.js';
import { Navbar } from './Navbar.js';
import { PosRegister } from './PosRegister.js';
import { PaymentModal } from './PaymentModal.js';
import { ReceiptModal } from './ReceiptModal.js';
import { InventoryManager } from './InventoryManager.js';
import { TransactionHistory } from './TransactionHistory.js';
import { SalesReport } from './SalesReport.js';
import { ShiftModal } from './ShiftModal.js';
import { StoreSettingsModal } from './StoreSettingsModal.js';
import { CameraBarcodeScanner } from './CameraBarcodeScanner.js';
import { MobileInstallGuideModal } from './MobileInstallGuideModal.js';
import { BottomMobileNav } from './BottomMobileNav.js';
import { ToastContainer } from './Toast.js';
import { AuthGate } from './AuthGate.js';
import { supabase, SUPABASE_CONFIGURED } from './supabaseClient.js';
import { ensureStore, loadDatabase, seedDatabase, upsertProduct, deleteProduct, syncCategories, saveSettings, saveShift, syncHeldOrders, commitSale, upsertTransaction, refundSale } from './database.js';
export default function App() {
    const [authSession, setAuthSession] = useState(null);
    const [dbStoreId, setDbStoreId] = useState(null);
    const [dbHydrated, setDbHydrated] = useState(!SUPABASE_CONFIGURED);
    const [dbLoading, setDbLoading] = useState(SUPABASE_CONFIGURED);
    const [forceLocalMode, setForceLocalMode] = useState(false);
    // --- Toast Messages ---
    const [toasts, setToasts] = useState([]);
    const showToast = (message, type = 'info') => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    };
    const dismissToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };
    useEffect(() => {
        if (!SUPABASE_CONFIGURED || forceLocalMode) {
            setDbLoading(false);
            setDbHydrated(true);
            return;
        }
        let mounted = true;
        supabase.auth.getSession().then(({ data }) => {
            if (mounted) setAuthSession(data.session);
        });
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) setAuthSession(session);
        });
        return () => { mounted = false; listener.subscription.unsubscribe(); };
    }, [forceLocalMode]);

    // --- Persistent States from LocalStorage ---
    const [products, setProducts] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_products');
            const parsed = saved ? JSON.parse(saved) : null;
            if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_PRODUCTS;
            const byId = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
            const merged = parsed.map((savedProduct) => {
                const catalogProduct = byId.get(savedProduct.id);
                if (!catalogProduct) return savedProduct;
                return {
                    ...catalogProduct,
                    stock: Number.isFinite(savedProduct.stock) ? savedProduct.stock : catalogProduct.stock,
                    costPrice: Number.isFinite(savedProduct.costPrice) ? savedProduct.costPrice : catalogProduct.costPrice,
                    sellingPrice: Number.isFinite(savedProduct.sellingPrice) ? savedProduct.sellingPrice : catalogProduct.sellingPrice,
                    minStockAlert: Number.isFinite(savedProduct.minStockAlert) ? savedProduct.minStockAlert : catalogProduct.minStockAlert,
                };
            });
            const existing = new Set(merged.map((p) => p.id));
            for (const product of INITIAL_PRODUCTS) if (!existing.has(product.id)) merged.push(product);
            return merged;
        }
        catch {
            return INITIAL_PRODUCTS;
        }
    });
    const [categories, setCategories] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_categories');
            const parsed = saved ? JSON.parse(saved) : null;
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CATEGORIES;
        }
        catch {
            return INITIAL_CATEGORIES;
        }
    });
    const [transactions, setTransactions] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_transactions');
            return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
        }
        catch {
            return INITIAL_TRANSACTIONS;
        }
    });
    const [storeSettings, setStoreSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_store_settings');
            return saved ? JSON.parse(saved) : INITIAL_STORE_SETTINGS;
        }
        catch {
            return INITIAL_STORE_SETTINGS;
        }
    });
    const [currentShift, setCurrentShift] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_current_shift');
            if (saved)
                return JSON.parse(saved);
            // Auto initialize an open default shift
            const initShift = {
                id: `shift-${Date.now()}`,
                cashierName: storeSettings.defaultCashierName,
                startTime: new Date().toISOString(),
                startingCash: 200000,
                cashSales: 0,
                nonCashSales: 0,
                totalSales: 0,
                transactionCount: 0,
                status: 'open',
            };
            return initShift;
        }
        catch {
            return null;
        }
    });
    const [heldOrders, setHeldOrders] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_held_orders');
            return saved ? JSON.parse(saved) : [];
        }
        catch {
            return [];
        }
    });
    // --- Runtime Session States ---
    const [activeTab, setActiveTab] = useState('pos');
    const [cart, setCart] = useState([]);
    // Modals
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [activeCartSummary, setActiveCartSummary] = useState({
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        customerName: 'Pelanggan Umum',
    });
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [lastTransaction, setLastTransaction] = useState(null);
    const paymentCommitRef = useRef(null);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
    const [isMobileGuideOpen, setIsMobileGuideOpen] = useState(false);
    useEffect(() => {
        if (!SUPABASE_CONFIGURED || forceLocalMode || !authSession?.user) return;
        let cancelled = false;
        (async () => {
            try {
                setDbLoading(true);
                const storeId = await ensureStore(INITIAL_STORE_SETTINGS.storeName);
                if (cancelled) return;
                setDbStoreId(storeId);
                let remote = await loadDatabase(storeId);
                if (!remote.products.length) {
                    await seedDatabase(storeId, { products: INITIAL_PRODUCTS, categories: INITIAL_CATEGORIES, settings: INITIAL_STORE_SETTINGS, transactions: INITIAL_TRANSACTIONS });
                    remote = await loadDatabase(storeId);
                }
                if (cancelled) return;
                if (remote.products.length) setProducts(remote.products);
                if (remote.categories.length) setCategories(remote.categories);
                if (remote.settings) setStoreSettings(remote.settings);
                if (remote.transactions.length) setTransactions(remote.transactions);
                if (remote.currentShift) setCurrentShift(remote.currentShift);
                setHeldOrders(remote.heldOrders);
                setDbHydrated(true);
            } catch (error) {
                console.error('Supabase hydration failed', error);
                setDbHydrated(false);
                showToast(`Database belum dapat diakses: ${error.message || 'periksa konfigurasi Supabase'}`, 'error');
            } finally {
                if (!cancelled) setDbLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [authSession, forceLocalMode]);

    useEffect(() => {
        if (!SUPABASE_CONFIGURED || forceLocalMode || !dbStoreId || !dbHydrated) return;
        const refresh = async () => {
            try {
                const remote = await loadDatabase(dbStoreId);
                if (remote.products.length) setProducts(remote.products);
                if (remote.categories.length) setCategories(remote.categories);
                if (remote.settings) setStoreSettings(remote.settings);
                setTransactions(remote.transactions);
                if (remote.currentShift) setCurrentShift(remote.currentShift);
                setHeldOrders(remote.heldOrders);
            } catch (e) { console.warn('Database refresh failed', e); }
        };
        const id = setInterval(refresh, 10000);
        return () => clearInterval(id);
    }, [dbStoreId, dbHydrated, forceLocalMode]);

    // --- Persist data to LocalStorage whenever modified ---
    useEffect(() => {
        localStorage.setItem('pos_products', JSON.stringify(products));
        localStorage.setItem('pos_catalog_version', PRODUCT_CATALOG_VERSION);
    }, [products]);
    useEffect(() => {
        localStorage.setItem('pos_categories', JSON.stringify(categories));
    }, [categories]);
    useEffect(() => {
        localStorage.setItem('pos_transactions', JSON.stringify(transactions));
    }, [transactions]);
    useEffect(() => {
        localStorage.setItem('pos_store_settings', JSON.stringify(storeSettings));
    }, [storeSettings]);
    useEffect(() => {
        if (currentShift) {
            localStorage.setItem('pos_current_shift', JSON.stringify(currentShift));
        }
        else {
            localStorage.removeItem('pos_current_shift');
        }
    }, [currentShift]);
    useEffect(() => {
        localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders));
    }, [heldOrders]);
    useEffect(() => {
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId && currentShift) {
            saveShift(dbStoreId, currentShift).catch((e) => console.warn('Shift sync failed', e));
        }
    }, [currentShift, dbStoreId, dbHydrated, forceLocalMode]);

    // Keep product snapshots in the active cart synchronized with the latest inventory data.
    useEffect(() => {
        setCart((prevCart) => prevCart
            .map((item) => {
            const latestProduct = products.find((product) => product.id === item.product.id);
            if (!latestProduct)
                return null;
            return { ...item, product: latestProduct };
        })
            .filter((item) => item !== null));
    }, [products]);
    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // F9 -> Checkout in POS mode
            if (e.key === 'F9') {
                e.preventDefault();
                if (activeTab === 'pos' && cart.length > 0 && !isPaymentOpen) {
                    // Reuse the POS checkout button so F9 always uses the exact same
                    // customer, item-discount, global-discount, and tax calculations.
                    document.getElementById('pos-pay-button')?.click();
                }
            }
            // F2 -> POS Tab
            if (e.key === 'F2') {
                e.preventDefault();
                setActiveTab('pos');
            }
            // F3 -> Inventory Tab
            if (e.key === 'F3') {
                e.preventDefault();
                setActiveTab('inventory');
            }
            // F4 -> Transaction History Tab
            if (e.key === 'F4') {
                e.preventDefault();
                setActiveTab('transactions');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, cart, isPaymentOpen]);
    // --- Checkout Handlers ---
    const handleOpenPayment = (cartSummary) => {
        if (!currentShift || currentShift.status !== 'open') {
            showToast('Buka shift kasir terlebih dahulu sebelum melakukan pembayaran.', 'warning');
            setIsShiftModalOpen(true);
            return;
        }
        for (const item of cart) {
            const latestProduct = products.find((product) => product.id === item.product.id);
            if (!latestProduct) {
                showToast(`Produk "${item.product.name}" sudah tidak tersedia di inventori.`, 'error');
                return;
            }
            if (item.quantity > latestProduct.stock) {
                showToast(`Stok "${latestProduct.name}" berubah. Tersedia ${latestProduct.stock} ${latestProduct.unit}, keranjang meminta ${item.quantity}.`, 'error');
                return;
            }
        }
        setActiveCartSummary(cartSummary);
        setIsPaymentOpen(true);
    };
    const handlePaymentSuccess = async (newTransaction) => {
        // Idempotency guard: the same payment can only be committed once.
        if (!newTransaction?.id || paymentCommitRef.current === newTransaction.id) {
            showToast('Pembayaran sudah diproses atau transaksi tidak valid.', 'warning');
            return false;
        }
        paymentCommitRef.current = newTransaction.id;
        if (!currentShift || currentShift.status !== 'open') {
            showToast('Pembayaran dibatalkan karena shift kasir tidak aktif.', 'error');
            setIsPaymentOpen(false);
            setIsShiftModalOpen(true);
            paymentCommitRef.current = null;
            return false;
        }
        // Revalidate against the latest inventory immediately before committing the transaction.
        for (const itemSold of newTransaction.items) {
            const latestProduct = products.find((product) => product.id === itemSold.productId);
            if (!latestProduct || itemSold.quantity > latestProduct.stock) {
                showToast(latestProduct
                    ? `Pembayaran dibatalkan: stok ${latestProduct.name} tinggal ${latestProduct.stock} ${latestProduct.unit}.`
                    : `Pembayaran dibatalkan: produk ${itemSold.productName} tidak lagi tersedia.`, 'error');
                paymentCommitRef.current = null;
                return false;
            }
        }
        // In database mode, commit stock deduction + transaction atomically on the server first.
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) {
            try {
                const committed = await commitSale(dbStoreId, newTransaction);
                newTransaction = committed || newTransaction;
            } catch (error) {
                console.error(error);
                showToast(`Pembayaran gagal disimpan ke database: ${error.message || 'error'}`, 'error');
                paymentCommitRef.current = null;
                return false;
            }
        }
      // 1. Update local inventory only in local/offline mode.
      // In Supabase mode, commitSale() already updates stock on the server.
      if (!(SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId)) {
          setProducts((prevProducts) =>
              prevProducts.map((prod) => {
                  const itemSold = newTransaction.items.find(
                     (i) => i.productId === prod.id
                  );

                   return itemSold
                       ? { ...prod, stock: prod.stock - itemSold.quantity }
                       : prod;
              })
           );
        }
        
        // 2. Add to transaction log
        setTransactions((prev) => [newTransaction, ...prev]);
        // 3. Update current shift record
        if (currentShift && currentShift.status === 'open') {
            const isCash = newTransaction.paymentMethod === 'cash';
            setCurrentShift((prev) => {
                if (!prev)
                    return null;
                return {
                    ...prev,
                    cashSales: isCash ? prev.cashSales + newTransaction.totalAmount : prev.cashSales,
                    nonCashSales: !isCash ? prev.nonCashSales + newTransaction.totalAmount : prev.nonCashSales,
                    totalSales: prev.totalSales + newTransaction.totalAmount,
                    transactionCount: prev.transactionCount + 1,
                };
            });
        }
        // 4. Close payment modal & open receipt view
        setIsPaymentOpen(false);
        setActiveTab('pos');
        setLastTransaction(newTransaction);
        setIsReceiptOpen(true);
        setCart([]);
        return true;
    };
    const handleNewTransaction = () => {
        setIsReceiptOpen(false);
        setLastTransaction(null);
        setCart([]);
    };
    // --- Hold & Restore Orders ---
    const handleHoldOrder = (customerName, globalDiscountPercent) => {
        if (cart.length === 0)
            return;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const normalizedCustomerName = customerName.trim() || 'Pelanggan Umum';
        const newHold = {
            id: `hold-${Date.now()}`,
            name: normalizedCustomerName,
            customerName: normalizedCustomerName,
            time: timeStr,
            items: cart.map((item) => ({ ...item, product: { ...item.product } })),
            globalDiscountPercent,
        };
        setHeldOrders((prev) => [newHold, ...prev]);
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) syncHeldOrders(dbStoreId, [newHold, ...heldOrders]).catch((e) => showToast(`Gagal menyimpan pesanan hold: ${e.message}`, 'error'));
    };
    const handleRestoreHeldOrder = (orderId) => {
        const target = heldOrders.find((o) => o.id === orderId);
        if (!target)
            return null;
        const refreshedItems = [];
        let adjusted = false;
        for (const item of target.items) {
            const latestProduct = products.find((product) => product.id === item.product.id);
            if (!latestProduct || latestProduct.stock <= 0) {
                adjusted = true;
                continue;
            }
            const safeQuantity = Math.min(item.quantity, latestProduct.stock);
            if (safeQuantity !== item.quantity)
                adjusted = true;
            refreshedItems.push({ ...item, product: latestProduct, quantity: safeQuantity });
        }
        setCart(refreshedItems);
        const nextHeld = heldOrders.filter((o) => o.id !== orderId);
        setHeldOrders(nextHeld);
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) syncHeldOrders(dbStoreId, nextHeld).catch((e) => showToast(`Gagal memperbarui pesanan hold: ${e.message}`, 'error'));
        if (adjusted) {
            showToast('Pesanan Hold disesuaikan dengan stok inventori terbaru.', 'warning');
        }
        return { ...target, items: refreshedItems };
    };
    const handleDeleteHeldOrder = (orderId) => {
        const nextHeld = heldOrders.filter((o) => o.id !== orderId);
        setHeldOrders(nextHeld);
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) syncHeldOrders(dbStoreId, nextHeld).catch((e) => showToast(`Gagal memperbarui pesanan hold: ${e.message}`, 'error'));
    };
    // --- Inventory Handlers ---
    const handleAddProduct = async (newProduct) => {
        setProducts((prev) => [newProduct, ...prev]);
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) { try { await upsertProduct(dbStoreId, newProduct); } catch (e) { showToast(`Gagal menyimpan produk: ${e.message}`, 'error'); } }
    };
    const handleUpdateProduct = async (updatedProduct) => {
        setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) { try { await upsertProduct(dbStoreId, updatedProduct); } catch (e) { showToast(`Gagal memperbarui produk: ${e.message}`, 'error'); } }
    };
    const handleDeleteProduct = async (productId) => {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) { try { await deleteProduct(dbStoreId, productId); } catch (e) { showToast(`Gagal menghapus produk: ${e.message}`, 'error'); } }
    };
    const handleQuickAdjustStock = async (productId, newStock) => {
        const product = products.find((p) => p.id === productId);
        const updated = product ? { ...product, stock: newStock } : null;
        setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)));
        if (updated && SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) { try { await upsertProduct(dbStoreId, updated); } catch (e) { showToast(`Gagal memperbarui stok: ${e.message}`, 'error'); } }
    };
    const handleCategoriesChange = async (nextCategories) => {
        setCategories(nextCategories);
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) { try { await syncCategories(dbStoreId, nextCategories); } catch (e) { showToast(`Gagal menyimpan kategori: ${e.message}`, 'error'); } }
    };
    // --- Transaction Actions ---
    const handleReprintReceipt = (tx) => {
        setLastTransaction(tx);
        setIsReceiptOpen(true);
    };
    const handleRefundTransaction = (transactionId, reason) => {
        const targetTx = transactions.find((t) => t.id === transactionId);
        if (!targetTx || targetTx.status === 'refunded')
            return;
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) {
            refundSale(dbStoreId, transactionId, reason).then((remoteTx) => {
                setTransactions((prev) => prev.map((t) => t.id === transactionId ? remoteTx : t));
                loadDatabase(dbStoreId).then((remote) => { if (remote.products.length) setProducts(remote.products); }).catch(() => {});
            }).catch((e) => showToast(`Refund gagal disimpan ke database: ${e.message}`, 'error'));
            return;
        }
        // 1. Return stock quantities back to products
        setProducts((prevProducts) => prevProducts.map((prod) => {
            const itemReturned = targetTx.items.find((i) => i.productId === prod.id);
            if (itemReturned) {
                return { ...prod, stock: prod.stock + itemReturned.quantity };
            }
            return prod;
        }));
        // 2. If the refunded sale belongs to the currently open shift, reverse its shift totals.
        if (currentShift?.status === 'open' && new Date(targetTx.date).getTime() >= new Date(currentShift.startTime).getTime()) {
            const isCash = targetTx.paymentMethod === 'cash';
            setCurrentShift((prev) => {
                if (!prev || prev.status !== 'open')
                    return prev;
                return {
                    ...prev,
                    cashSales: isCash ? Math.max(0, prev.cashSales - targetTx.totalAmount) : prev.cashSales,
                    nonCashSales: !isCash ? Math.max(0, prev.nonCashSales - targetTx.totalAmount) : prev.nonCashSales,
                    totalSales: Math.max(0, prev.totalSales - targetTx.totalAmount),
                    transactionCount: Math.max(0, prev.transactionCount - 1),
                };
            });
        }
        // 3. Mark transaction as refunded
        const refunded = { ...targetTx, status: 'refunded', refundReason: reason };
        setTransactions((prev) => prev.map((t) => t.id === transactionId ? refunded : t));
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) upsertTransaction(dbStoreId, refunded).catch((e) => showToast(`Gagal menyimpan refund: ${e.message}`, 'error'));
    };
    // --- Shift Session Handlers ---
    const handleStartShift = (startingCash, cashierName) => {
        const newShift = {
            id: `shift-${Date.now()}`,
            cashierName,
            startTime: new Date().toISOString(),
            startingCash,
            cashSales: 0,
            nonCashSales: 0,
            totalSales: 0,
            transactionCount: 0,
            status: 'open',
        };
        setCurrentShift(newShift);
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) saveShift(dbStoreId, newShift).catch((e) => showToast(`Gagal menyimpan shift: ${e.message}`, 'error'));
    };
    const handleCloseShift = (actualCash, notes) => {
        if (!currentShift)
            return;
        const closedShift = {
            ...currentShift,
            endTime: new Date().toISOString(),
            actualCashEnding: actualCash,
            cashDifference: actualCash - (currentShift.startingCash + currentShift.cashSales),
            status: 'closed',
            notes,
        };
        setCurrentShift(closedShift);
        if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) saveShift(dbStoreId, closedShift).catch((e) => showToast(`Gagal menyimpan shift: ${e.message}`, 'error'));
        showToast(`Shift untuk ${currentShift.cashierName} berhasil ditutup.`, 'success');
    };
    // --- Barcode Camera Scan Handler ---
    const handleScanCameraSuccess = (product) => {
        if (product.stock <= 0) {
            showToast(`Stok untuk "${product.name}" telah habis!`, 'error');
            return;
        }
        const existingIndex = cart.findIndex((item) => item.product.id === product.id);
        if (existingIndex > -1) {
            const currentQty = cart[existingIndex].quantity;
            if (currentQty >= product.stock) {
                showToast(`Jumlah melebihi stok yang tersedia (${product.stock} ${product.unit}).`, 'warning');
                return;
            }
            const updatedCart = [...cart];
            updatedCart[existingIndex].quantity += 1;
            setCart(updatedCart);
            showToast(`+1 ${product.name} ditambahkan ke keranjang`, 'success');
        }
        else {
            setCart([...cart, { product, quantity: 1, customDiscount: 0 }]);
            showToast(`${product.name} ditambahkan ke keranjang`, 'success');
        }
        // Switch to POS tab if not currently active
        if (activeTab !== 'pos') {
            setActiveTab('pos');
        }
    };
    // --- Settings & Data Handlers ---
    const handleResetToDemo = () => {
        setProducts(INITIAL_PRODUCTS);
        setCategories(INITIAL_CATEGORIES);
        setTransactions(INITIAL_TRANSACTIONS);
        setStoreSettings(INITIAL_STORE_SETTINGS);
        setHeldOrders([]);
        setCart([]);
        setCurrentShift({
            id: `shift-${Date.now()}`,
            cashierName: INITIAL_STORE_SETTINGS.defaultCashierName,
            startTime: new Date().toISOString(),
            startingCash: 200000,
            cashSales: 0,
            nonCashSales: 0,
            totalSales: 0,
            transactionCount: 0,
            status: 'open',
        });
    };
    const handleImportData = (importedData) => {
        setProducts(importedData.products);
        setCategories(Array.isArray(importedData.categories) && importedData.categories.length > 0 ? importedData.categories : [...new Set(importedData.products.map((p) => p.category).filter(Boolean))]);
        setTransactions(importedData.transactions);
        setStoreSettings(importedData.settings);
        if ('currentShift' in importedData)
            setCurrentShift(importedData.currentShift ?? null);
        if (importedData.heldOrders)
            setHeldOrders(importedData.heldOrders);
        setCart([]);
    };
    if (SUPABASE_CONFIGURED && !forceLocalMode && !authSession) return _jsx(AuthGate, { onLocalMode: () => setForceLocalMode(true) });
    if (SUPABASE_CONFIGURED && !forceLocalMode && dbLoading) return _jsx("div", { className: "min-h-screen bg-slate-950 text-white flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-black mb-2", children: "Menghubungkan Database..." }), _jsx("div", { className: "text-slate-400 text-sm", children: "Memuat produk, stok, transaksi, dan laporan." })] }) });
    return (_jsxs("div", { className: "min-h-screen bg-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white", children: [_jsx(Navbar, { activeTab: activeTab, setActiveTab: setActiveTab, cartCount: cart.reduce((s, i) => s + i.quantity, 0), storeSettings: storeSettings, currentShift: currentShift, onOpenShiftModal: () => setIsShiftModalOpen(true), onOpenSettings: () => setIsSettingsModalOpen(true), onOpenMobileGuide: () => setIsMobileGuideOpen(true), onOpenCameraScanner: () => setIsCameraScannerOpen(true) }), _jsxs("main", { className: "flex-1 pb-16 lg:pb-0", children: [activeTab === 'pos' && (_jsx(PosRegister, { products: products, categories: categories, cart: cart, setCart: setCart, storeSettings: storeSettings, onOpenPayment: handleOpenPayment, heldOrders: heldOrders, onHoldOrder: handleHoldOrder, onRestoreHeldOrder: handleRestoreHeldOrder, onDeleteHeldOrder: handleDeleteHeldOrder, onOpenCameraScanner: () => setIsCameraScannerOpen(true) })), activeTab === 'inventory' && (_jsx(InventoryManager, { products: products, categories: categories, onCategoriesChange: handleCategoriesChange, onAddProduct: handleAddProduct, onUpdateProduct: handleUpdateProduct, onDeleteProduct: handleDeleteProduct, onQuickAdjustStock: handleQuickAdjustStock })), activeTab === 'transactions' && (_jsx(TransactionHistory, { transactions: transactions, onReprintReceipt: handleReprintReceipt, onRefundTransaction: handleRefundTransaction, storeSettings: storeSettings })), activeTab === 'reports' && (_jsx(SalesReport, { transactions: transactions, products: products })), activeTab === 'settings' && (_jsx("div", { className: "max-w-4xl mx-auto p-4 sm:p-6", children: _jsxs("div", { className: "bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center", children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 mb-2", children: "Pengaturan Sistem Kasir" }), _jsx("p", { className: "text-sm text-slate-500 max-w-md mx-auto mb-6", children: "Atur informasi toko, identitas struk kasir, persentase pajak, serta backup dan restore data." }), _jsxs("div", { className: "flex flex-wrap items-center justify-center gap-3", children: [_jsx("button", { onClick: () => setIsSettingsModalOpen(true), className: "px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/20 transition-all", children: "Buka Panel Pengaturan" }), _jsx("button", { onClick: () => setIsMobileGuideOpen(true), className: "px-6 py-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-sm rounded-xl border border-slate-700 transition-all", children: "Panduan Pasang di HP & Tablet" }), SUPABASE_CONFIGURED && !forceLocalMode && (_jsx("button", { onClick: () => supabase.auth.signOut(), className: "px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 transition-all", children: "Keluar Database" }))] })] }) }))] }), _jsx(BottomMobileNav, { activeTab: activeTab, setActiveTab: setActiveTab, cartCount: cart.reduce((s, i) => s + i.quantity, 0), onOpenMobileGuide: () => setIsMobileGuideOpen(true) }), _jsx(PaymentModal, { isOpen: isPaymentOpen, onClose: () => setIsPaymentOpen(false), cart: cart, cartSummary: activeCartSummary, storeSettings: storeSettings, onPaymentSuccess: handlePaymentSuccess, transactionCount: transactions.length, cashierName: currentShift?.cashierName || storeSettings.defaultCashierName }), _jsx(ReceiptModal, { isOpen: isReceiptOpen, onClose: () => setIsReceiptOpen(false), transaction: lastTransaction, storeSettings: storeSettings, onNewTransaction: handleNewTransaction }), _jsx(ShiftModal, { isOpen: isShiftModalOpen, onClose: () => setIsShiftModalOpen(false), currentShift: currentShift, onStartShift: handleStartShift, onCloseShift: handleCloseShift, transactions: transactions, storeSettings: storeSettings }), _jsx(StoreSettingsModal, { isOpen: isSettingsModalOpen, onClose: () => setIsSettingsModalOpen(false), settings: storeSettings, onSaveSettings: async (nextSettings) => { setStoreSettings(nextSettings); if (SUPABASE_CONFIGURED && !forceLocalMode && dbHydrated && dbStoreId) { try { await saveSettings(dbStoreId, nextSettings); } catch (e) { showToast(`Gagal menyimpan pengaturan: ${e.message}`, 'error'); } } }, onResetToDemo: handleResetToDemo, products: products, categories: categories, transactions: transactions, currentShift: currentShift, heldOrders: heldOrders, onImportData: handleImportData }), _jsx(CameraBarcodeScanner, { isOpen: isCameraScannerOpen, onClose: () => setIsCameraScannerOpen(false), products: products, onScanSuccess: handleScanCameraSuccess }), _jsx(MobileInstallGuideModal, { isOpen: isMobileGuideOpen, onClose: () => setIsMobileGuideOpen(false) }), _jsx(ToastContainer, { toasts: toasts, onDismiss: dismissToast })] }));
}
