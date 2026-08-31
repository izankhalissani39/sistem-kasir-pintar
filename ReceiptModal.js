import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Printer, Share2, Copy, Check, PlusCircle, X, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatRupiah, formatFullDateTimeIndo } from './formatters.js';
export const ReceiptModal = ({ isOpen, onClose, transaction, storeSettings, onNewTransaction, }) => {
    const [copied, setCopied] = useState(false);
    const [showWaInput, setShowWaInput] = useState(false);
    const [waNumber, setWaNumber] = useState(transaction?.customerPhone || '');
    useEffect(() => {
        if (isOpen && transaction) {
            setWaNumber(transaction.customerPhone || '');
            setShowWaInput(false);
            setCopied(false);
        }
    }, [isOpen, transaction]);
    useEffect(() => {
        if (!isOpen || !transaction)
            return;
        const handleSpace = (event) => {
            if (event.code !== 'Space')
                return;
            const target = event.target;
            if (target && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName))
                return;
            event.preventDefault();
            onNewTransaction();
        };
        window.addEventListener('keydown', handleSpace);
        return () => window.removeEventListener('keydown', handleSpace);
    }, [isOpen, transaction, onNewTransaction]);
    if (!isOpen || !transaction)
        return null;
    const handlePrint = () => {
        window.print();
    };
    const generateReceiptText = () => {
        const lines = [
            `==============================`,
            `${storeSettings.storeName.toUpperCase()}`,
            `${storeSettings.tagline}`,
            `${storeSettings.address}`,
            `Telp: ${storeSettings.phone}`,
            `==============================`,
            `No. Nota : ${transaction.invoiceNumber}`,
            `Tanggal  : ${formatFullDateTimeIndo(transaction.date)}`,
            `Kasir    : ${transaction.cashierName}`,
            `Pelanggan: ${transaction.customerName || 'Umum'}`,
            `------------------------------`,
        ];
        transaction.items.forEach((item) => {
            lines.push(`${item.productName}`);
            lines.push(`  ${item.quantity} x ${formatRupiah(item.unitPrice)} = ${formatRupiah(item.subtotal)}`);
        });
        lines.push(`------------------------------`);
        lines.push(`Subtotal  : ${formatRupiah(transaction.subtotal)}`);
        if (transaction.discountAmount > 0) {
            lines.push(`Diskon    : -${formatRupiah(transaction.discountAmount)}`);
        }
        if (transaction.taxAmount > 0) {
            lines.push(`PPN       : +${formatRupiah(transaction.taxAmount)}`);
        }
        lines.push(`TOTAL     : ${formatRupiah(transaction.totalAmount)}`);
        lines.push(`Metode    : ${transaction.paymentMethod.toUpperCase()}`);
        lines.push(`Bayar     : ${formatRupiah(transaction.amountPaid)}`);
        lines.push(`Kembali   : ${formatRupiah(transaction.change)}`);
        lines.push(`==============================`);
        lines.push(`${storeSettings.receiptFooter}`);
        lines.push(`==============================`);
        return lines.join('\n');
    };
    const handleCopy = () => {
        const text = generateReceiptText();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const handleSendWhatsApp = (e) => {
        e.preventDefault();
        let cleanedNumber = waNumber.replace(/[^0-9]/g, '');
        if (cleanedNumber.startsWith('0')) {
            cleanedNumber = '62' + cleanedNumber.slice(1);
        }
        else if (!cleanedNumber.startsWith('62')) {
            cleanedNumber = '62' + cleanedNumber;
        }
        const receiptText = encodeURIComponent(`*STRUK PEMBAYARAN - ${storeSettings.storeName}*\n\n` + generateReceiptText());
        window.open(`https://wa.me/${cleanedNumber}?text=${receiptText}`, '_blank');
    };
    return (_jsx("div", { className: "fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto", children: [_jsxs("div", { className: "p-4 bg-emerald-600 text-white flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(CheckCircle2, { className: "w-5 h-5" }), _jsx("h3", { className: "font-bold text-base", children: "Transaksi Berhasil!" })] }), _jsx("button", { onClick: onClose, className: "text-white/80 hover:text-white p-1 rounded-lg hover:bg-emerald-700 transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "p-4 sm:p-6 bg-slate-100 flex justify-center", children: _jsxs("div", { id: "printable-receipt", className: `receipt-${storeSettings.paperWidth} w-full max-w-[340px] bg-white p-5 rounded-xl shadow-md border border-slate-200 font-mono-receipt text-slate-900 text-xs leading-relaxed select-text`, children: [_jsxs("div", { className: "text-center pb-3 border-b border-dashed border-slate-300", children: [_jsx("h2", { className: "font-bold text-sm text-slate-900 tracking-tight", children: storeSettings.storeName }), _jsx("p", { className: "text-[11px] text-slate-600 mt-0.5", children: storeSettings.tagline }), _jsx("p", { className: "text-[10px] text-slate-500 mt-0.5", children: storeSettings.address }), _jsxs("p", { className: "text-[10px] text-slate-500", children: ["Telp: ", storeSettings.phone] })] }), _jsxs("div", { className: "py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-500", children: "No. Nota:" }), _jsx("span", { className: "font-bold", children: transaction.invoiceNumber })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-500", children: "Waktu:" }), _jsx("span", { children: formatFullDateTimeIndo(transaction.date) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-500", children: "Kasir:" }), _jsx("span", { children: transaction.cashierName })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-500", children: "Pelanggan:" }), _jsx("span", { children: transaction.customerName || 'Umum' })] })] }), _jsx("div", { className: "py-2 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]", children: transaction.items.map((item, idx) => (_jsxs("div", { children: [_jsx("div", { className: "font-semibold text-slate-800 line-clamp-1", children: item.productName }), _jsxs("div", { className: "flex justify-between text-slate-600 text-[10px]", children: [_jsxs("span", { children: [item.quantity, " x ", formatRupiah(item.unitPrice)] }), _jsx("span", { className: "font-bold text-slate-800", children: formatRupiah(item.subtotal) })] })] }, idx))) }), _jsxs("div", { className: "py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Subtotal:" }), _jsx("span", { children: formatRupiah(transaction.subtotal) })] }), transaction.discountAmount > 0 && (_jsxs("div", { className: "flex justify-between text-rose-600", children: [_jsx("span", { children: "Diskon:" }), _jsxs("span", { children: ["-", formatRupiah(transaction.discountAmount)] })] })), transaction.taxAmount > 0 && (_jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { children: ["PPN (", transaction.taxPercent, "%):"] }), _jsxs("span", { children: ["+", formatRupiah(transaction.taxAmount)] })] })), _jsxs("div", { className: "flex justify-between font-bold text-xs pt-1 border-t border-slate-200", children: [_jsx("span", { children: "TOTAL:" }), _jsx("span", { children: formatRupiah(transaction.totalAmount) })] }), _jsxs("div", { className: "flex justify-between pt-0.5 text-slate-600", children: [_jsx("span", { children: "Metode:" }), _jsx("span", { className: "uppercase", children: transaction.paymentMethod })] }), _jsxs("div", { className: "flex justify-between text-slate-600", children: [_jsx("span", { children: "Bayar:" }), _jsx("span", { children: formatRupiah(transaction.amountPaid) })] }), _jsxs("div", { className: "flex justify-between font-bold text-slate-800", children: [_jsx("span", { children: "Kembali:" }), _jsx("span", { children: formatRupiah(transaction.change) })] })] }), _jsx("div", { className: "pt-3 text-center text-[10px] text-slate-500 whitespace-pre-line leading-normal", children: storeSettings.receiptFooter })] }) }), _jsxs("div", { className: "p-4 bg-white border-t border-slate-200 space-y-2", children: [showWaInput ? (_jsxs("form", { onSubmit: handleSendWhatsApp, className: "flex gap-2", children: [_jsx("input", { type: "tel", placeholder: "No WA (0812xxxx)", value: waNumber, onChange: (e) => setWaNumber(e.target.value), className: "flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs", autoFocus: true }), _jsxs("button", { type: "submit", className: "px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1", children: [_jsx(Send, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Kirim" })] }), _jsx("button", { type: "button", onClick: () => setShowWaInput(false), className: "px-2 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs", children: "\u2715" })] })) : (_jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs("button", { id: "print-receipt-btn", onClick: handlePrint, className: "py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs", children: [_jsx(Printer, { className: "w-3.5 h-3.5 text-emerald-400" }), _jsx("span", { children: "Cetak Struk" })] }), _jsxs("button", { id: "wa-receipt-btn", onClick: () => setShowWaInput(true), className: "py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors", children: [_jsx(Share2, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "WhatsApp" })] }), _jsxs("button", { onClick: handleCopy, className: "py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors", children: [copied ? _jsx(Check, { className: "w-3.5 h-3.5 text-emerald-600" }) : _jsx(Copy, { className: "w-3.5 h-3.5" }), _jsx("span", { children: copied ? 'Tersalin' : 'Salin Teks' })] })] })), _jsxs("button", { id: "new-transaction-btn", onClick: onNewTransaction, className: "w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-700/20 transition-all active:scale-98", children: [_jsx(PlusCircle, { className: "w-4 h-4" }), _jsx("span", { children: "Transaksi Baru / Selesai (Spasi)" })] })] })] }) }));
};
