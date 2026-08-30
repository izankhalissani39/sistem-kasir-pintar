import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ShoppingCart, Package, History, BarChart3, Settings } from 'lucide-react';
export const BottomMobileNav = ({ activeTab, setActiveTab, cartCount, onOpenMobileGuide, }) => {
    const tabs = [
        { id: 'pos', label: 'Kasir', icon: ShoppingCart, badge: cartCount },
        { id: 'inventory', label: 'Produk', icon: Package },
        { id: 'transactions', label: 'Riwayat', icon: History },
        { id: 'reports', label: 'Laporan', icon: BarChart3 },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
    ];
    return (_jsx("div", { className: "lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 safe-area-bottom shadow-2xl", children: _jsx("div", { className: "flex items-center justify-around", children: tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${isActive
                        ? 'text-emerald-400 font-bold scale-105'
                        : 'text-slate-400 hover:text-slate-200'}`, children: [_jsxs("div", { className: "relative", children: [_jsx(Icon, { className: `w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}` }), tab.badge && tab.badge > 0 ? (_jsx("span", { className: "absolute -top-1.5 -right-2.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ring-2 ring-slate-900 animate-pulse", children: tab.badge })) : null] }), _jsx("span", { className: "text-[10px] mt-1 tracking-tight", children: tab.label })] }, tab.id));
            }) }) }));
};
