import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Store, Settings, Printer, Save, RotateCcw, Download, Upload, CheckCircle2, X } from 'lucide-react';
import { motion } from 'motion/react';
export const StoreSettingsModal = ({ isOpen, onClose, settings, onSaveSettings, onResetToDemo, products, categories = [], transactions, currentShift, heldOrders, onImportData, }) => {
    const [formData, setFormData] = useState({ ...settings });
    const [saveSuccess, setSaveSuccess] = useState(false);
    useEffect(() => {
        if (isOpen) {
            setFormData({ ...settings });
            setSaveSuccess(false);
        }
    }, [isOpen, settings]);
    if (!isOpen)
        return null;
    const handleSubmit = (e) => {
        e.preventDefault();
        onSaveSettings(formData);
        setSaveSuccess(true);
        setTimeout(() => {
            setSaveSuccess(false);
            onClose();
        }, 800);
    };
    // Export JSON backup
    const handleExportBackup = () => {
        const backupData = {
            version: '1.1',
            exportDate: new Date().toISOString(),
            storeSettings: formData,
            products,
            categories,
            transactions,
            currentShift,
            heldOrders,
        };
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `Backup_Kasir_${formData.storeName.replace(/\s+/g, '_')}_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };
    // Import JSON backup
    const handleImportBackup = (e) => {
        const fileReader = new FileReader();
        if (e.target.files && e.target.files[0]) {
            fileReader.readAsText(e.target.files[0], 'UTF-8');
            fileReader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target?.result);
                    const isProduct = (value) => {
                        if (!value || typeof value !== 'object')
                            return false;
                        const product = value;
                        return (typeof product.id === 'string' &&
                            typeof product.name === 'string' &&
                            typeof product.sku === 'string' &&
                            typeof product.costPrice === 'number' &&
                            typeof product.sellingPrice === 'number' &&
                            typeof product.stock === 'number' &&
                            typeof product.minStockAlert === 'number' &&
                            typeof product.unit === 'string');
                    };
                    const isTransaction = (value) => {
                        if (!value || typeof value !== 'object')
                            return false;
                        const transaction = value;
                        return (typeof transaction.id === 'string' &&
                            typeof transaction.invoiceNumber === 'string' &&
                            typeof transaction.date === 'string' &&
                            Array.isArray(transaction.items) &&
                            typeof transaction.totalAmount === 'number' &&
                            typeof transaction.paymentMethod === 'string' &&
                            (transaction.status === 'completed' || transaction.status === 'refunded'));
                    };
                    if (!Array.isArray(parsed.products) || !parsed.products.every(isProduct)) {
                        alert('Format produk pada file backup tidak valid.');
                        return;
                    }
                    const importedTransactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
                    if (!importedTransactions.every(isTransaction)) {
                        alert('Format transaksi pada file backup tidak valid.');
                        return;
                    }
                    const importedSettings = parsed.storeSettings && typeof parsed.storeSettings === 'object'
                        ? { ...settings, ...parsed.storeSettings }
                        : settings;
                    const importedHeldOrders = Array.isArray(parsed.heldOrders)
                        ? parsed.heldOrders.filter((order) => Boolean(order) &&
                            typeof order === 'object' &&
                            typeof order.id === 'string' &&
                            Array.isArray(order.items))
                        : undefined;
                    let importedShift = undefined;
                    if ('currentShift' in parsed) {
                        if (parsed.currentShift === null) {
                            importedShift = null;
                        }
                        else if (parsed.currentShift && typeof parsed.currentShift === 'object') {
                            const shift = parsed.currentShift;
                            if (typeof shift.id !== 'string' ||
                                typeof shift.cashierName !== 'string' ||
                                typeof shift.startTime !== 'string' ||
                                typeof shift.startingCash !== 'number' ||
                                (shift.status !== 'open' && shift.status !== 'closed')) {
                                alert('Format data shift pada file backup tidak valid.');
                                return;
                            }
                            importedShift = shift;
                        }
                    }
                    onImportData({
                        products: parsed.products,
                        categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : [...new Set(parsed.products.map((p) => p.category).filter(Boolean))],
                        transactions: importedTransactions,
                        settings: importedSettings,
                        currentShift: importedShift,
                        heldOrders: importedHeldOrders || [],
                    });
                    setFormData(importedSettings);
                    alert('Data berhasil dipulihkan dari file backup!');
                    onClose();
                }
                catch {
                    alert('Gagal membaca file JSON backup.');
                }
            };
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto", children: [_jsxs("div", { className: "p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2.5", children: [_jsx(Settings, { className: "w-5 h-5 text-emerald-400" }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-base", children: "Pengaturan Toko & Kasir" }), _jsx("p", { className: "text-xs text-slate-400", children: "Konfigurasi struk, nama toko, pajak, dan cadangan data" })] })] }), _jsx("button", { onClick: onClose, className: "p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("h4", { className: "text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5", children: [_jsx(Store, { className: "w-4 h-4 text-emerald-600" }), _jsx("span", { children: "Profil Identitas Toko" })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "Nama Toko" }), _jsx("input", { type: "text", required: true, value: formData.storeName, onChange: (e) => setFormData({ ...formData, storeName: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "Slogan / Tagline" }), _jsx("input", { type: "text", value: formData.tagline, onChange: (e) => setFormData({ ...formData, tagline: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "No. Telp / WhatsApp" }), _jsx("input", { type: "text", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "Nama Kasir Default" }), _jsx("input", { type: "text", value: formData.defaultCashierName, onChange: (e) => setFormData({ ...formData, defaultCashierName: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "Jenis Usaha" }), _jsx("select", { value: formData.businessType, onChange: (e) => setFormData({ ...formData, businessType: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500", children: ['Retail / Minimarket', 'Warung & Kelontong', 'Cafe & Resto', 'Toko Baju / Fashion', 'Lainnya'].map((type) => (_jsx("option", { value: type, children: type }, type))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "Lebar Kertas Struk" }), _jsxs("select", { value: formData.paperWidth, onChange: (e) => setFormData({ ...formData, paperWidth: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500", children: [_jsx("option", { value: "58mm", children: "58 mm" }), _jsx("option", { value: "80mm", children: "80 mm" })] })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "Alamat Lengkap Toko" }), _jsx("input", { type: "text", value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" })] })] })] }), _jsxs("div", { className: "space-y-3 pt-3 border-t border-slate-200", children: [_jsxs("h4", { className: "text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5", children: [_jsx(Printer, { className: "w-4 h-4 text-emerald-600" }), _jsx("span", { children: "Pengaturan Struk Thermal & Pajak" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "Catatan Kaki Struk (Footer Greeting)" }), _jsx("textarea", { rows: 2, value: formData.receiptFooter, onChange: (e) => setFormData({ ...formData, receiptFooter: e.target.value }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono-receipt" })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "font-bold text-xs text-slate-800 block", children: "Pajak Pertambahan Nilai (PPN)" }), _jsx("span", { className: "text-[11px] text-slate-500", children: "Terapkan pajak otomatis saat checkout" })] }), _jsx("input", { type: "checkbox", checked: formData.enableTax, onChange: (e) => setFormData({ ...formData, enableTax: e.target.checked }), className: "w-5 h-5 accent-emerald-600 rounded cursor-pointer" })] }), formData.enableTax && (_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-700 mb-1", children: "Persentase PPN (%)" }), _jsx("input", { type: "number", min: "0", max: "100", value: formData.taxPercent, onChange: (e) => setFormData({ ...formData, taxPercent: parseFloat(e.target.value) || 0 }), className: "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono-receipt" })] }))] })] }), _jsxs("div", { className: "space-y-3 pt-3 border-t border-slate-200", children: [_jsxs("h4", { className: "text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5", children: [_jsx(Save, { className: "w-4 h-4 text-emerald-600" }), _jsx("span", { children: "Cadangan & Pemulihan Data" })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-2", children: [_jsxs("button", { type: "button", onClick: handleExportBackup, className: "p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-colors", children: [_jsx(Download, { className: "w-4 h-4 text-slate-600" }), _jsx("span", { children: "Download Backup JSON" })] }), _jsxs("label", { className: "p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-colors cursor-pointer text-center", children: [_jsx(Upload, { className: "w-4 h-4 text-slate-600" }), _jsx("span", { children: "Pulihkan dari File" }), _jsx("input", { type: "file", accept: ".json", onChange: handleImportBackup, className: "hidden" })] }), _jsxs("button", { type: "button", onClick: () => {
                                                if (confirm('Reset seluruh data ke demo produk dan contoh transaksi awal?')) {
                                                    onResetToDemo();
                                                    onClose();
                                                }
                                            }, className: "p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-colors", children: [_jsx(RotateCcw, { className: "w-4 h-4 text-rose-600" }), _jsx("span", { children: "Reset ke Data Demo" })] })] })] }), _jsxs("div", { className: "pt-3 border-t border-slate-200 flex items-center justify-between", children: [saveSuccess ? (_jsxs("div", { className: "flex items-center text-emerald-600 text-xs font-bold", children: [_jsx(CheckCircle2, { className: "w-4 h-4 mr-1" }), "Pengaturan berhasil disimpan!"] })) : (_jsx("div", {})), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold", children: "Batal" }), _jsx("button", { type: "submit", className: "px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20", children: "Simpan Pengaturan" })] })] })] })] }) }));
};
