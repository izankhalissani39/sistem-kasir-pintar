import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { Coins, X, Lock, Unlock } from 'lucide-react';
import { motion } from 'motion/react';
import { formatRupiah, formatFullDateTimeIndo } from '../utils/formatters.js';
export const ShiftModal = ({ isOpen, onClose, currentShift, onStartShift, onCloseShift, transactions, storeSettings, }) => {
    const [startingCashInput, setStartingCashInput] = useState('200000');
    const [cashierNameInput, setCashierNameInput] = useState(storeSettings.defaultCashierName);
    const [actualCashInput, setActualCashInput] = useState('');
    const [shiftNotes, setShiftNotes] = useState('');
    const [isClosingView, setIsClosingView] = useState(false);
    // Calculate live shift statistics for current session
    const shiftStats = useMemo(() => {
        if (!currentShift || currentShift.status !== 'open') {
            return {
                cashSales: 0,
                nonCashSales: 0,
                totalSales: 0,
                transactionCount: 0,
                expectedCash: 0,
            };
        }
        const shiftStartTime = new Date(currentShift.startTime).getTime();
        const shiftTransactions = transactions.filter((t) => {
            const txTime = new Date(t.date).getTime();
            return txTime >= shiftStartTime && t.status === 'completed';
        });
        const cashSales = shiftTransactions
            .filter((t) => t.paymentMethod === 'cash')
            .reduce((sum, t) => sum + t.totalAmount, 0);
        const nonCashSales = shiftTransactions
            .filter((t) => t.paymentMethod !== 'cash')
            .reduce((sum, t) => sum + t.totalAmount, 0);
        const totalSales = cashSales + nonCashSales;
        const transactionCount = shiftTransactions.length;
        const expectedCash = currentShift.startingCash + cashSales;
        return {
            cashSales,
            nonCashSales,
            totalSales,
            transactionCount,
            expectedCash,
        };
    }, [currentShift, transactions]);
    const actualCash = useMemo(() => {
        const val = parseFloat(actualCashInput.replace(/[^0-9]/g, ''));
        return isNaN(val) ? 0 : val;
    }, [actualCashInput]);
    const cashDifference = useMemo(() => {
        return actualCash - shiftStats.expectedCash;
    }, [actualCash, shiftStats.expectedCash]);
    if (!isOpen)
        return null;
    const handleStartSubmit = (e) => {
        e.preventDefault();
        const starting = parseFloat(startingCashInput.replace(/[^0-9]/g, '')) || 0;
        onStartShift(starting, cashierNameInput.trim() || storeSettings.defaultCashierName);
        onClose();
    };
    const handleCloseSubmit = (e) => {
        e.preventDefault();
        onCloseShift(actualCash, shiftNotes);
        onClose();
    };
    return (_jsx("div", { className: "fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto", children: [_jsxs("div", { className: "p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2.5", children: [_jsx(Coins, { className: "w-5 h-5 text-emerald-400" }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-base", children: "Manajemen Shift & Kas Laci" }), _jsx("p", { className: "text-xs text-slate-400", children: currentShift?.status === 'open' ? 'Shift Sedang Berjalan' : 'Belum Ada Shift Terbuka' })] })] }), _jsx("button", { onClick: onClose, className: "p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), currentShift?.status === 'open' ? (
                // ACTIVE SHIFT VIEW / CLOSE SHIFT
                _jsxs("div", { className: "p-4 sm:p-6 space-y-4", children: [_jsxs("div", { className: "p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" }), _jsx("span", { className: "text-xs font-bold text-emerald-900 uppercase", children: "Shift Kasir Aktif" })] }), _jsxs("div", { className: "font-bold text-sm text-slate-800 mt-1", children: ["Kasir: ", currentShift.cashierName] }), _jsxs("div", { className: "text-[11px] text-slate-500", children: ["Mulai: ", formatFullDateTimeIndo(currentShift.startTime)] })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-[10px] text-slate-500 uppercase block", children: "Modal Awal Kas" }), _jsx("span", { className: "font-bold font-mono-receipt text-slate-800 text-sm", children: formatRupiah(currentShift.startingCash) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2.5 text-xs", children: [_jsxs("div", { className: "p-3 bg-slate-50 rounded-xl border border-slate-200", children: [_jsx("span", { className: "text-slate-500 block", children: "Penjualan Tunai (Cash)" }), _jsx("span", { className: "font-bold text-sm font-mono-receipt text-emerald-600", children: formatRupiah(shiftStats.cashSales) })] }), _jsxs("div", { className: "p-3 bg-slate-50 rounded-xl border border-slate-200", children: [_jsx("span", { className: "text-slate-500 block", children: "Penjualan Non-Tunai" }), _jsx("span", { className: "font-bold text-sm font-mono-receipt text-blue-600", children: formatRupiah(shiftStats.nonCashSales) })] }), _jsxs("div", { className: "p-3 bg-slate-50 rounded-xl border border-slate-200", children: [_jsx("span", { className: "text-slate-500 block", children: "Total Omset Shift" }), _jsx("span", { className: "font-bold text-sm font-mono-receipt text-slate-900", children: formatRupiah(shiftStats.totalSales) })] }), _jsxs("div", { className: "p-3 bg-slate-50 rounded-xl border border-slate-200", children: [_jsx("span", { className: "text-slate-500 block", children: "Jumlah Transaksi" }), _jsxs("span", { className: "font-bold text-sm text-slate-900", children: [shiftStats.transactionCount, " Transaksi"] })] })] }), _jsxs("div", { className: "p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-400 uppercase tracking-wider block", children: "Uang Kas Seharusnya di Laci" }), _jsx("span", { className: "text-[10px] text-slate-400", children: "Modal Awal + Penjualan Tunai" })] }), _jsx("div", { className: "text-xl font-extrabold font-mono-receipt text-emerald-400", children: formatRupiah(shiftStats.expectedCash) })] }), isClosingView ? (_jsxs("form", { onSubmit: handleCloseSubmit, className: "space-y-3 pt-2 border-t border-slate-200", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Hitung & Masukkan Uang Kas Aktual di Laci (Rp)" }), _jsx("input", { type: "number", required: true, min: "0", placeholder: "Hitung seluruh uang fisik di laci kasir...", value: actualCashInput, onChange: (e) => setActualCashInput(e.target.value), className: "w-full px-3.5 py-2.5 border-2 border-emerald-500 rounded-xl text-lg font-bold font-mono-receipt focus:outline-none", autoFocus: true })] }), actualCashInput && (_jsxs("div", { className: `p-3 rounded-xl border text-xs flex items-center justify-between ${cashDifference === 0
                                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                        : cashDifference > 0
                                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                                            : 'bg-rose-50 text-rose-900 border-rose-200'}`, children: [_jsx("span", { children: cashDifference === 0
                                                ? 'Selisih Kas: Pas (Cocok Sempurna)'
                                                : cashDifference > 0
                                                    ? 'Selisih Kas: Lebih'
                                                    : 'Selisih Kas: Kurang' }), _jsx("span", { className: "font-bold font-mono-receipt text-sm", children: formatRupiah(cashDifference) })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "Catatan Tutup Shift" }), _jsx("input", { type: "text", placeholder: "Contoh: Operan shift siang ke shift malam lancar", value: shiftNotes, onChange: (e) => setShiftNotes(e.target.value), className: "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" })] }), _jsxs("div", { className: "flex space-x-2 pt-2", children: [_jsx("button", { type: "button", onClick: () => setIsClosingView(false), className: "flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold", children: "Batal" }), _jsx("button", { type: "submit", className: "flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-700/20", children: "Tutup Shift & Kunci Kas" })] })] })) : (_jsxs("div", { className: "flex space-x-2 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold", children: "Lanjut Berjualan" }), _jsxs("button", { type: "button", onClick: () => setIsClosingView(true), className: "flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-rose-700/20", children: [_jsx(Lock, { className: "w-4 h-4" }), _jsx("span", { children: "Tutup Shift Kasir" })] })] }))] })) : (
                // START NEW SHIFT FORM
                _jsxs("form", { onSubmit: handleStartSubmit, className: "p-4 sm:p-6 space-y-4", children: [_jsxs("div", { className: "p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900", children: [_jsxs("div", { className: "font-bold flex items-center space-x-1.5 mb-1", children: [_jsx(Unlock, { className: "w-4 h-4 text-emerald-600" }), _jsx("span", { children: "Buka Shift Kasir Baru" })] }), _jsx("p", { className: "text-slate-600", children: "Masukkan nama kasir yang bertugas dan modal awal uang receh/kembalian di laci kasir." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Nama Kasir" }), _jsx("input", { type: "text", required: true, value: cashierNameInput, onChange: (e) => setCashierNameInput(e.target.value), className: "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-bold text-slate-700 mb-1", children: "Modal Kas Awal di Laci (Rp)" }), _jsx("input", { type: "number", required: true, min: "0", value: startingCashInput, onChange: (e) => setStartingCashInput(e.target.value), placeholder: "200000", className: "w-full px-3.5 py-3 border-2 border-emerald-500 rounded-xl text-xl font-bold font-mono-receipt focus:outline-none" }), _jsx("div", { className: "flex gap-1.5 mt-2", children: [100000, 200000, 300000, 500000].map((amt) => (_jsx("button", { type: "button", onClick: () => setStartingCashInput(amt.toString()), className: "flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono-receipt font-semibold", children: formatRupiah(amt).replace('Rp', '') }, amt))) })] }), _jsxs("div", { className: "pt-2 flex space-x-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold", children: "Batal" }), _jsx("button", { type: "submit", className: "flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/20", children: "Buka Shift Sekarang" })] })] }))] }) }));
};
