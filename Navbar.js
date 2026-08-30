import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Store, ShoppingCart, Package, History, BarChart3, Settings, Clock, Maximize, Minimize, Coins, Sparkles, Smartphone, Camera } from 'lucide-react';
export const Navbar = ({ activeTab, setActiveTab, cartCount, storeSettings, currentShift, onOpenShiftModal, onOpenSettings, onOpenMobileGuide, onOpenCameraScanner, }) => {
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            }).format(now));
            setCurrentDate(new Intl.DateTimeFormat('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }).format(now));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', syncFullscreenState);
        syncFullscreenState();
        return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
    }, []);
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        }
        else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
            }
        }
    };
    const navItems = [
        { id: 'pos', label: 'Kasir (POS)', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : null },
        { id: 'inventory', label: 'Produk & Stok', icon: Package },
        { id: 'transactions', label: 'Riwayat Transaksi', icon: History },
        { id: 'reports', label: 'Laporan Penjualan', icon: BarChart3 },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
    ];
    return (_jsx("header", { className: "bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md", children: _jsx("div", { className: "max-w-7xl mx-auto px-3 sm:px-4 lg:px-6", children: _jsxs("div", { className: "flex items-center justify-between h-14 sm:h-16", children: [_jsxs("div", { className: "flex items-center space-x-2.5 cursor-pointer", onClick: () => setActiveTab('pos'), children: [_jsx("div", { className: "w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0", children: _jsx(Store, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "font-bold text-sm sm:text-lg tracking-tight text-white line-clamp-1", children: storeSettings.storeName || 'Kasir Pintar POS' }), _jsxs("span", { className: "hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", children: [_jsx(Sparkles, { className: "w-3 h-3 mr-1" }), "HP & Tablet Ready"] })] }), _jsx("p", { className: "text-[11px] text-slate-400 hidden sm:block line-clamp-1", children: storeSettings.tagline || 'Sistem Kasir Modern' })] })] }), _jsx("nav", { className: "hidden lg:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50", children: navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (_jsxs("button", { id: `nav-tab-${item.id}`, onClick: () => setActiveTab(item.id), className: `relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`, children: [_jsx(Icon, { className: "w-4 h-4" }), _jsx("span", { children: item.label }), item.badge && (_jsx("span", { className: "ml-1.5 px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-slate-900 rounded-full animate-pulse", children: item.badge }))] }, item.id));
                        }) }), _jsxs("div", { className: "flex items-center space-x-1.5 sm:space-x-2.5", children: [onOpenCameraScanner && (_jsxs("button", { onClick: onOpenCameraScanner, className: "p-2 sm:px-3 sm:py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95", title: "Scan Barcode via Kamera HP/Tablet", children: [_jsx(Camera, { className: "w-4 h-4 text-white" }), _jsx("span", { className: "hidden sm:inline", children: "Scan Kamera" })] })), onOpenMobileGuide && (_jsxs("button", { onClick: onOpenMobileGuide, className: "flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold border border-slate-700 transition-colors", title: "Panduan Pakai di HP & Tablet (Android / iOS)", children: [_jsx(Smartphone, { className: "w-3.5 h-3.5" }), _jsx("span", { className: "hidden sm:inline", children: "Pasang di HP" })] })), _jsxs("button", { id: "shift-status-btn", onClick: onOpenShiftModal, className: "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors text-slate-200", title: "Kelola Shift & Kas", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${currentShift?.status === 'open' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}` }), _jsx(Coins, { className: "w-3.5 h-3.5 text-emerald-400 hidden md:inline" }), _jsx("span", { className: "font-medium", children: currentShift?.status === 'open' ? 'Shift On' : 'Shift' })] }), _jsxs("div", { className: "hidden xl:flex flex-col text-right px-2 py-0.5", children: [_jsxs("span", { className: "text-xs font-semibold text-slate-200 font-mono-receipt tracking-wider flex items-center justify-end", children: [_jsx(Clock, { className: "w-3 h-3 mr-1 text-slate-400" }), currentTime] }), _jsx("span", { className: "text-[10px] text-slate-400", children: currentDate })] }), _jsx("button", { id: "fullscreen-toggle-btn", onClick: toggleFullscreen, className: "p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors", title: isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh POS', children: isFullscreen ? _jsx(Minimize, { className: "w-4 h-4" }) : _jsx(Maximize, { className: "w-4 h-4" }) })] })] }) }) }));
};
