import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export class ErrorBoundary extends React.Component {
    state = {
        hasError: false,
        error: null,
    };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error in Kasir Pintar:', error, errorInfo);
    }
    handleReset = () => {
        const reload = () => window.location.reload();
        try {
            [
                'pos_products',
                'pos_transactions',
                'pos_store_settings',
                'pos_current_shift',
                'pos_held_orders',
            ].forEach((key) => localStorage.removeItem(key));
            if ('caches' in window) {
                caches
                    .keys()
                    .then((names) => Promise.all(names.filter((name) => name.startsWith('kasir-pintar-')).map((name) => caches.delete(name))))
                    .finally(reload);
            }
            else {
                reload();
            }
        }
        catch {
            reload();
        }
    };
    handleReload = () => {
        window.location.reload();
    };
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "min-h-screen bg-slate-900 text-white flex items-center justify-center p-4", children: _jsxs("div", { className: "max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl", children: [_jsx("div", { className: "w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold", children: "\u26A0\uFE0F" }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "Aplikasi Membutuhkan Muat Ulang" }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Terjadi kendala saat memuat data aplikasi. Silakan tekan tombol di bawah untuk menyegarkan tampilan." })] }), this.state.error && (_jsx("div", { className: "p-3 bg-slate-950/80 rounded-xl text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-24", children: this.state.error.message })), _jsxs("div", { className: "flex flex-col gap-2 pt-2", children: [_jsx("button", { onClick: this.handleReload, className: "w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-emerald-600/20", children: "Segarkan Aplikasi (Reload)" }), _jsx("button", { onClick: this.handleReset, className: "w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-xs rounded-xl transition-colors", children: "Reset Data & Bersihkan Cache" })] })] }) }));
        }
        return this.props.children;
    }
}
