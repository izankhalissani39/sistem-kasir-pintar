import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, CreditCard, Download, PieChart, BarChart3, Package, ArrowUpRight } from 'lucide-react';
import { formatRupiah, formatNumber } from './formatters.js';
export const SalesReport = ({ transactions, products }) => {
    const [timeFilter, setTimeFilter] = useState('today');
    const [customDate, setCustomDate] = useState('');
    // Filter transactions by selected timeframe
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
        return transactions.filter((t) => {
            if (t.status !== 'completed')
                return false;
            const txTime = new Date(t.date).getTime();
            if (timeFilter === 'today')
                return txTime >= startOfToday;
            if (timeFilter === '7days')
                return txTime >= sevenDaysAgo;
            if (timeFilter === '30days')
                return txTime >= thirtyDaysAgo;
            if (timeFilter === 'custom' && customDate) {
    const selectedDate = new Date(`${customDate}T00:00:00`);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    return txTime >= selectedDate.getTime() &&
           txTime < nextDate.getTime();
}
            return true;
        });
    }, [transactions, timeFilter, customDate]);
    const formatMonthName = (dateValue) => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(dateValue));
    const periodLabel = useMemo(() => {
        const now = new Date();
        if (timeFilter === 'today') return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
        if (timeFilter === '7days') {
            const start = new Date(Date.now() - 7 * 24 * 3600 * 1000);
            return `${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' }).format(start)} – ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(now)}`;
        }
        if (timeFilter === '30days') {
            const start = new Date(Date.now() - 30 * 24 * 3600 * 1000);
            return `${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' }).format(start)} – ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(now)}`;
        }
        if (timeFilter === 'custom' && customDate) {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(`${customDate}T00:00:00`));
}
        return 'Semua periode';
    }, [timeFilter, customDate]);
    // High-level Financial Summary
    const metrics = useMemo(() => {
        const totalSales = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const totalCost = filteredTransactions.reduce((sum, t) => sum + (t.totalCost || 0), 0);
        const totalTax = filteredTransactions.reduce((sum, t) => sum + (t.taxAmount || 0), 0);
        const netSalesBeforeTax = totalSales - totalTax;
        const grossProfit = netSalesBeforeTax - totalCost;
        const profitMargin = netSalesBeforeTax > 0 ? Math.round((grossProfit / netSalesBeforeTax) * 100) : 0;
        const totalTransactions = filteredTransactions.length;
        const avgOrderValue = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;
        const totalItemsSold = filteredTransactions.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0);
        return {
            totalSales,
            totalCost,
            grossProfit,
            profitMargin,
            totalTransactions,
            avgOrderValue,
            totalItemsSold,
        };
    }, [filteredTransactions]);
    // Sales by Category
    const categorySales = useMemo(() => {
        const map = {};
        filteredTransactions.forEach((t) => {
            const discountFactor = t.subtotal > 0 ? Math.max(0, (t.subtotal - t.discountAmount) / t.subtotal) : 1;
            t.items.forEach((item) => {
                const prod = products.find((p) => p.id === item.productId);
                const cat = prod?.category || 'Lainnya';
                if (!map[cat]) {
                    map[cat] = { count: 0, revenue: 0 };
                }
                map[cat].count += item.quantity;
                map[cat].revenue += item.subtotal * discountFactor;
            });
        });
        return Object.entries(map)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredTransactions, products]);
    // Top Selling Products
    const topProducts = useMemo(() => {
        const map = {};
        filteredTransactions.forEach((t) => {
            const discountFactor = t.subtotal > 0 ? Math.max(0, (t.subtotal - t.discountAmount) / t.subtotal) : 1;
            t.items.forEach((item) => {
                if (!map[item.productId]) {
                    map[item.productId] = {
                        name: item.productName,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                map[item.productId].quantity += item.quantity;
                map[item.productId].revenue += item.subtotal * discountFactor;
            });
        });
        return Object.values(map)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 25);
    }, [filteredTransactions]);
    // Payment Method Breakdown
    const paymentMethodShare = useMemo(() => {
        const map = {
            cash: { count: 0, total: 0 },
            qris: { count: 0, total: 0 },
            transfer: { count: 0, total: 0 },
            debit: { count: 0, total: 0 },
            credit: { count: 0, total: 0 },
        };
        filteredTransactions.forEach((t) => {
            const method = t.paymentMethod || 'cash';
            if (!map[method])
                map[method] = { count: 0, total: 0 };
            map[method].count += 1;
            map[method].total += t.totalAmount;
        });
        return [
            { id: 'cash', name: 'Tunai (Cash)', ...map.cash, color: 'bg-emerald-500' },
            { id: 'qris', name: 'QRIS / E-Wallet', ...map.qris, color: 'bg-purple-500' },
            { id: 'transfer', name: 'Transfer Bank', ...map.transfer, color: 'bg-blue-500' },
            { id: 'debit', name: 'Kartu Debit', ...map.debit, color: 'bg-amber-500' },
            { id: 'credit', name: 'Kartu Kredit', ...map.credit, color: 'bg-orange-500' },
        ].filter((m) => m.count > 0 || m.total > 0);
    }, [filteredTransactions]);
    // Export to CSV
    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) {
            alert('Tidak ada data untuk diekspor!');
            return;
        }
        const headers = ['No Invoice', 'Tanggal', 'Bulan', 'Kasir', 'Pelanggan', 'Metode Pembayaran', 'Subtotal', 'Diskon', 'PPN', 'Total Tagihan', 'Total Modal', 'Status'];
        const rows = filteredTransactions.map((t) => [
            t.invoiceNumber,
            `"${t.date}"`,
            `"${formatMonthName(t.date)}"`,
            `"${t.cashierName}"`,
            `"${t.customerName || 'Umum'}"`,
            t.paymentMethod,
            t.subtotal,
            t.discountAmount,
            t.taxAmount,
            t.totalAmount,
            t.totalCost || 0,
            t.status,
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Laporan_Penjualan_${timeFilter}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-4 sm:p-6 space-y-6", children: [_jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(BarChart3, { className: "w-5 h-5 text-emerald-600" }), _jsxs("div", { children: [_jsx("h2", { className: "font-bold text-base text-slate-800", children: "Laporan & Analitik Penjualan" }), _jsxs("p", { className: "text-[11px] text-slate-500 mt-0.5", children: ["Periode: ", _jsx("span", { className: "font-semibold text-emerald-700", children: periodLabel })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2 w-full sm:w-auto", children: [_jsx("div", { className: "flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto", children: [
                                    { id: 'today', label: 'Hari Ini' },
                                    { id: '7days', label: '7 Hari' },
                                    { id: '30days', label: '30 Hari' },
                                    { id: 'custom', label: 'Pilih Tanggal'},
                                    { id: 'all', label: 'Semua' },
                                ].map((tab) => (_jsx("button", { onClick: () => setTimeFilter(tab.id), className: `flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeFilter === tab.id
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'}`, children: tab.label }, tab.id))) }),timeFilter === 'custom' && (_jsx("input", {
    type: "date",
    value: customDate,
    onChange: (e) => {
        setCustomDate(e.target.value);
        setTimeFilter('custom');
    },
    className: "w-[180px] h-10 shrink-0 px-3 py-2 bg-white border-2 border-emerald-500 rounded-xl text-sm text-slate-700",
    title: "Pilih tanggal laporan"
})),_jsxs("button", { onClick: handleExportCSV, className: "px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0", title: "Download file Excel/CSV", children: [_jsx(Download, { className: "w-4 h-4 text-emerald-400" }), _jsx("span", { className: "hidden sm:inline", children: "Ekspor CSV" })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4", children: [_jsxs("div", { className: "bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Total Pendapatan" }), _jsx("div", { className: "p-2 bg-emerald-50 text-emerald-600 rounded-xl", children: _jsx(DollarSign, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "text-xl sm:text-2xl font-extrabold text-slate-900 font-mono-receipt", children: formatRupiah(metrics.totalSales) }), _jsxs("div", { className: "text-[11px] text-emerald-600 font-semibold mt-1 flex items-center", children: [_jsx(ArrowUpRight, { className: "w-3.5 h-3.5 mr-0.5" }), "Omset Bersih"] })] })] }), _jsxs("div", { className: "bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Total Modal Penjualan" }), _jsx("div", { className: "p-2 bg-rose-50 text-rose-600 rounded-xl", children: _jsx(DollarSign, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "text-xl sm:text-2xl font-extrabold text-rose-600 font-mono-receipt", children: formatRupiah(metrics.totalCost) }), _jsx("div", { className: "text-[11px] text-slate-500 mt-1", children: "Modal barang yang terjual pada periode ini" })] })] }), _jsxs("div", { className: "bg-white p-4 sm:p-5 rounded-2xl border bo
                                    const maxQty = topProducts[0].quantity || 1;
                                    const percentage = Math.round((prod.quantity / maxQty) * 100);
                                    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]", children: idx + 1 }), _jsx("span", { className: "font-bold text-slate-800", children: prod.name })] }), _jsxs("div", { className: "text-right font-mono-receipt font-semibold text-slate-700", children: [prod.quantity, " unit \u2022 ", formatRupiah(prod.revenue)] })] }), _jsx("div", { className: "w-full bg-slate-100 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: "bg-emerald-500 h-2 rounded-full transition-all duration-500", style: { width: `${percentage}%` } }) })] }, idx));
                                }) }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-base text-slate-900", children: "Metode Pembayaran" }), _jsx("p", { className: "text-xs text-slate-500", children: "Proporsi penerimaan uang kasir" })] }), _jsx(CreditCard, { className: "w-5 h-5 text-blue-600" })] }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: paymentMethodShare.map((m) => {
                                            const sharePercent = metrics.totalSales > 0 ? Math.round((m.total / metrics.totalSales) * 100) : 0;
                                            return (_jsxs("div", { className: "p-3 bg-slate-50 rounded-2xl border border-slate-200", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: `w-2.5 h-2.5 rounded-full ${m.color}` }), _jsx("span", { className: "text-xs font-bold text-slate-700 truncate", children: m.name })] }), _jsx("div", { className: "text-sm font-extrabold font-mono-receipt text-slate-900 mt-1", children: formatRupiah(m.total) }), _jsxs("div", { className: "text-[10px] text-slate-500 mt-0.5", children: [m.count, " transaksi (", sharePercent, "%)"] })] }, m.id));
                                        }) })] }), _jsxs("div", { className: "bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-bold text-base text-slate-900", children: "Penjualan per Kategori" }), _jsx(PieChart, { className: "w-5 h-5 text-purple-600" })] }), _jsx("div", { className: "space-y-2", children: categorySales.map((cat, idx) => (_jsxs("div", { className: "flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-500" }), _jsx("span", { className: "font-medium text-slate-700", children: cat.name }), _jsxs("span", { className: "text-[10px] text-slate-400", children: ["(", cat.count, " item)"] })] }), _jsx("span", { className: "font-bold font-mono-receipt text-slate-800", children: formatRupiah(cat.revenue) })] }, idx))) })] })] })] })] }));
};
