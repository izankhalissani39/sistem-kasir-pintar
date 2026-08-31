import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Banknote, QrCode, CreditCard, Building2, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { formatRupiah, playBeepSound, generateInvoiceNumber } from './formatters.js';
export const PaymentModal = ({ isOpen, onClose, cart, cartSummary, storeSettings, onPaymentSuccess, transactionCount, cashierName, }) => {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaidInput, setAmountPaidInput] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [transactionNotes, setTransactionNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [qrisScanned, setQrisScanned] = useState(false);
    const [nonCashConfirmed, setNonCashConfirmed] = useState(false);
    const processingRef = useRef(false);
    // Set default amount paid to exact total when modal opens
    useEffect(() => {
        if (isOpen) {
            setPaymentMethod('cash');
            setAmountPaidInput(cartSummary.total.toString());
            setCustomerPhone('');
            setTransactionNotes('');
            setQrisScanned(false);
            setNonCashConfirmed(false);
            setIsProcessing(false);
            processingRef.current = false;
        }
    }, [isOpen, cartSummary.total]);
    const numericAmountPaid = useMemo(() => {
        if (paymentMethod !== 'cash')
            return cartSummary.total;
        const val = parseFloat(amountPaidInput.replace(/[^0-9]/g, ''));
        return isNaN(val) ? 0 : val;
    }, [amountPaidInput, paymentMethod, cartSummary.total]);
    const changeAmount = useMemo(() => {
        return numericAmountPaid - cartSummary.total;
    }, [numericAmountPaid, cartSummary.total]);
    const isPaymentValid = useMemo(() => {
        if (paymentMethod === 'cash') {
            return numericAmountPaid >= cartSummary.total;
        }
        if (paymentMethod === 'qris') {
            return qrisScanned;
        }
        if (paymentMethod === 'transfer' || paymentMethod === 'debit' || paymentMethod === 'credit') {
            return nonCashConfirmed;
        }
        return true;
    }, [paymentMethod, numericAmountPaid, cartSummary.total, qrisScanned, nonCashConfirmed]);
    // Quick cash options tailored to Indonesian Rupiah notes
    const quickCashOptions = useMemo(() => {
        const total = cartSummary.total;
        const options = new Set();
        options.add(total); // Uang Pas
        // Next roundups
        const denominations = [10000, 20000, 50000, 100000, 200000, 500000];
        for (const d of denominations) {
            if (d >= total) {
                options.add(d);
            }
        }
        // Also add next 50k / 100k milestone
        const next50k = Math.ceil(total / 50000) * 50000;
        const next100k = Math.ceil(total / 100000) * 100000;
        if (next50k > total)
            options.add(next50k);
        if (next100k > total)
            options.add(next100k);
        return Array.from(options).sort((a, b) => a - b).slice(0, 6);
    }, [cartSummary.total]);
    // Handle final completion
    const handleCompleteTransaction = () => {
        if (!isPaymentValid || isProcessing || processingRef.current)
            return;
        processingRef.current = true;
        setIsProcessing(true);
        playBeepSound('success');
        // Fire celebratory confetti
        try {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
            });
        }
        catch {
            // Ignore if confetti fails
        }
        const totalCost = cart.reduce((sum, item) => sum + item.product.costPrice * item.quantity, 0);
        const newTransaction = {
            id: `trx-${Date.now()}`,
            invoiceNumber: generateInvoiceNumber(transactionCount + 1),
            date: new Date().toISOString(),
            items: cart.map((item) => ({
                productId: item.product.id,
                productName: item.product.name,
                sku: item.product.sku,
                unit: item.product.unit,
                unitPrice: item.product.sellingPrice,
                costPrice: item.product.costPrice,
                quantity: item.quantity,
                discount: Math.min(item.product.sellingPrice, Math.max(0, item.customDiscount || 0)),
                subtotal: Math.max(0, item.product.sellingPrice - (item.customDiscount || 0)) * item.quantity,
                notes: item.notes,
            })),
            subtotal: cartSummary.subtotal,
            taxPercent: storeSettings.taxPercent,
            taxAmount: cartSummary.tax,
            discountAmount: cartSummary.discount,
            totalAmount: cartSummary.total,
            totalCost,
            paymentMethod,
            amountPaid: paymentMethod === 'cash' ? numericAmountPaid : cartSummary.total,
            change: paymentMethod === 'cash' ? Math.max(0, changeAmount) : 0,
            cashierName,
            customerName: cartSummary.customerName || 'Pelanggan Umum',
            customerPhone: customerPhone.trim() || undefined,
            status: 'completed',
            notes: transactionNotes.trim() || undefined,
        };
        try {
            const committed = onPaymentSuccess(newTransaction);
            if (!committed) {
                processingRef.current = false;
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Payment commit failed:', error);
            processingRef.current = false;
            setIsProcessing(false);
        }
    };
    // Match the shortcut shown on the primary button.
    useEffect(() => {
        if (!isOpen)
            return;
        const handleEnter = (event) => {
            if (event.key !== 'Enter')
                return;
            const target = event.target;
            if (target?.tagName === 'TEXTAREA')
                return;
            event.preventDefault();
            handleCompleteTransaction();
        };
        window.addEventListener('keydown', handleEnter);
        return () => window.removeEventListener('keydown', handleEnter);
    });
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 10 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95 }, className: "bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto", children: [_jsxs("div", { className: "p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20", children: _jsx(Banknote, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-lg leading-tight", children: "Pembayaran Kasir" }), _jsxs("p", { className: "text-xs text-slate-400", children: ["Pelanggan: ", _jsx("span", { className: "text-slate-200 font-semibold", children: cartSummary.customerName || 'Pelanggan Umum' })] })] })] }), _jsx("button", { onClick: onClose, className: "p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-4 sm:p-5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs font-bold text-emerald-800 uppercase tracking-wider", children: "Total yang Harus Dibayar" }), _jsx("div", { className: "text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono-receipt mt-0.5", children: formatRupiah(cartSummary.total) })] }), _jsxs("div", { className: "text-right text-xs text-emerald-900/80", children: [_jsxs("div", { children: ["Subtotal: ", formatRupiah(cartSummary.subtotal)] }), cartSummary.discount > 0 && (_jsxs("div", { className: "text-rose-600 font-semibold", children: ["Diskon: -", formatRupiah(cartSummary.discount)] })), cartSummary.tax > 0 && _jsxs("div", { children: ["PPN: +", formatRupiah(cartSummary.tax)] })] })] }), _jsxs("div", { className: "p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto max-h-[60vh]", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2", children: "Pilih Metode Pembayaran" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-2", children: [
                                        { id: 'cash', label: 'Tunai (Cash)', icon: Banknote },
                                        { id: 'qris', label: 'QRIS / E-Wallet', icon: QrCode },
                                        { id: 'transfer', label: 'Transfer Bank', icon: Building2 },
                                        { id: 'debit', label: 'Kartu Debit/EDC', icon: CreditCard },
                                        { id: 'credit', label: 'Kartu Kredit/EDC', icon: CreditCard },
                                    ].map((m) => {
                                        const Icon = m.icon;
                                        const isSelected = paymentMethod === m.id;
                                        return (_jsxs("button", { type: "button", onClick: () => {
                                                setPaymentMethod(m.id);
                                                setQrisScanned(false);
                                                setNonCashConfirmed(false);
                                                playBeepSound('beep');
                                            }, className: `p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${isSelected
                                                ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'}`, children: [_jsx(Icon, { className: `w-5 h-5 mb-2 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}` }), _jsx("span", { className: "text-xs", children: m.label })] }, m.id));
                                    }) })] }), paymentMethod === 'cash' && (_jsxs("div", { className: "space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5", children: "Uang Diterima (Rp)" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg font-mono", children: "Rp" }), _jsx("input", { id: "cash-amount-input", type: "number", value: amountPaidInput, onChange: (e) => setAmountPaidInput(e.target.value), placeholder: "0", className: "w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 focus:border-emerald-500 rounded-xl text-xl font-bold font-mono-receipt text-slate-900 focus:outline-none", autoFocus: true })] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Pilihan Cepat Nominal:" }), _jsx("div", { className: "grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-1.5", children: quickCashOptions.map((amount) => {
                                                const isExact = amount === cartSummary.total;
                                                return (_jsx("button", { type: "button", onClick: () => {
                                                        setAmountPaidInput(amount.toString());
                                                        playBeepSound('beep');
                                                    }, className: `py-2 px-1 rounded-xl text-xs font-bold font-mono-receipt border transition-all text-center ${numericAmountPaid === amount
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`, children: isExact ? 'Uang Pas' : formatRupiah(amount).replace('Rp', '') }, amount));
                                            }) })] }), _jsxs("div", { className: `p-3.5 rounded-xl border flex items-center justify-between ${changeAmount >= 0
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
                                        : 'bg-rose-50 border-rose-200 text-rose-800'}`, children: [_jsxs("div", { className: "flex items-center space-x-2", children: [changeAmount >= 0 ? (_jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-600 shrink-0" })) : (_jsx(AlertCircle, { className: "w-5 h-5 text-rose-600 shrink-0" })), _jsxs("div", { children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider block", children: changeAmount >= 0 ? 'Kembalian Pelanggan' : 'Uang Kurang' }), _jsx("span", { className: "text-[11px] opacity-80", children: changeAmount >= 0 ? 'Harus dikembalikan ke pembeli' : 'Nominal masih kurang' })] })] }), _jsx("div", { className: "text-xl font-extrabold font-mono-receipt", children: formatRupiah(Math.abs(changeAmount)) })] })] })), paymentMethod === 'qris' && (_jsxs("div", { className: "p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center space-y-3", children: [_jsxs("div", { className: "bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-col items-center", children: [_jsx("div", { className: "flex items-center space-x-2 mb-2", children: _jsx("span", { className: "text-xs font-bold tracking-widest text-slate-800", children: "QRIS STANDAR INDONESIA" }) }), _jsxs("div", { className: "w-48 h-48 bg-slate-900 rounded-xl flex items-center justify-center p-3 relative overflow-hidden", children: [_jsx(QrCode, { className: "w-40 h-40 text-white" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-pulse" })] }), _jsx("span", { className: "mt-2 text-xs font-mono-receipt font-bold text-slate-700", children: "NMID: ID1020038472910" }), _jsx("span", { className: "text-sm font-bold text-emerald-600 font-mono-receipt", children: formatRupiah(cartSummary.total) })] }), _jsx("div", { className: "text-xs text-slate-500 max-w-sm", children: "Arahkan pelanggan untuk scan kode QR di atas menggunakan GoPay, OVO, DANA, BCA, ShopeePay, atau m-Banking." }), _jsxs("button", { type: "button", onClick: () => {
                                        setQrisScanned(true);
                                        playBeepSound('beep');
                                    }, className: `px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${qrisScanned
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`, children: [_jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-600" }), _jsx("span", { children: qrisScanned ? 'Pembayaran QRIS Terkonfirmasi' : 'Simulasi Pembayaran QRIS Berhasil' })] })] })), paymentMethod === 'transfer' && (_jsxs("div", { className: "p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs", children: [_jsx("div", { className: "font-bold text-slate-800", children: "Pilih Rekening Tujuan Toko:" }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { className: "p-2.5 bg-white rounded-xl border border-slate-200", children: [_jsx("div", { className: "font-bold text-slate-800", children: "BCA: 8820-192-831" }), _jsxs("div", { className: "text-slate-500 text-[11px]", children: ["a/n ", storeSettings.storeName] })] }), _jsxs("div", { className: "p-2.5 bg-white rounded-xl border border-slate-200", children: [_jsx("div", { className: "font-bold text-slate-800", children: "Mandiri: 137-00-19283-1" }), _jsxs("div", { className: "text-slate-500 text-[11px]", children: ["a/n ", storeSettings.storeName] })] })] }), _jsx("button", { type: "button", onClick: () => setNonCashConfirmed((prev) => !prev), className: `w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all ${nonCashConfirmed
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`, children: nonCashConfirmed ? 'Transfer Sudah Dikonfirmasi' : 'Konfirmasi Dana Transfer Sudah Masuk' })] })), (paymentMethod === 'debit' || paymentMethod === 'credit') && (_jsxs("div", { className: "p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs", children: [_jsxs("div", { className: "font-bold text-slate-800", children: ["Mesin EDC Pembayaran ", paymentMethod === 'credit' ? 'Kredit' : 'Debit'] }), _jsx("p", { className: "text-slate-500", children: "Gesek atau tap kartu debit/kredit pelanggan pada mesin EDC kasir, lalu konfirmasi setelah transaksi EDC berhasil." }), _jsx("button", { type: "button", onClick: () => setNonCashConfirmed((prev) => !prev), className: `w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all ${nonCashConfirmed
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`, children: nonCashConfirmed ? 'Pembayaran EDC Terkonfirmasi' : 'Konfirmasi Pembayaran EDC Berhasil' })] })), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "block text-xs font-semibold text-slate-700 flex items-center space-x-1", children: [_jsx(Smartphone, { className: "w-3.5 h-3.5 text-slate-400" }), _jsx("span", { children: "No. WhatsApp Pelanggan (Opsional untuk kirim struk digital)" })] }), _jsx("input", { type: "tel", placeholder: "Contoh: 08123456789", value: customerPhone, onChange: (e) => setCustomerPhone(e.target.value), className: "w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700", children: "Catatan Transaksi (Opsional)" }), _jsx("input", { type: "text", placeholder: "Contoh: pesanan dibungkus / referensi pembayaran", value: transactionNotes, onChange: (e) => setTransactionNotes(e.target.value), className: "w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500" })] })] }), _jsxs("div", { className: "p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-sm transition-colors", children: "Batal" }), _jsxs("button", { id: "confirm-payment-btn", type: "button", disabled: !isPaymentValid || isProcessing, onClick: handleCompleteTransaction, className: `flex-1 py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg transition-all ${!isPaymentValid || isProcessing
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/25 active:scale-95'}`, children: [_jsx(CheckCircle2, { className: "w-5 h-5" }), _jsx("span", { children: isProcessing ? 'Memproses Transaksi...' : 'Selesaikan Pembayaran (Enter)' })] })] })] }) }));
};
