import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
export const ToastContainer = ({ toasts, onDismiss }) => {
    return (_jsx("div", { className: "fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 pointer-events-none flex flex-col gap-2", children: _jsx(AnimatePresence, { children: toasts.map((t) => {
                const isSuccess = t.type === 'success';
                const isError = t.type === 'error';
                const isWarning = t.type === 'warning';
                return (_jsxs(motion.div, { initial: { opacity: 0, y: -20, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -20, scale: 0.95 }, className: `pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${isSuccess
                        ? 'bg-emerald-950/90 border-emerald-500/50 text-white'
                        : isError
                            ? 'bg-rose-950/90 border-rose-500/50 text-white'
                            : isWarning
                                ? 'bg-amber-950/90 border-amber-500/50 text-white'
                                : 'bg-slate-900/90 border-slate-700 text-white'}`, children: [isSuccess && _jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-400 shrink-0" }), isError && _jsx(AlertCircle, { className: "w-5 h-5 text-rose-400 shrink-0" }), isWarning && _jsx(AlertTriangle, { className: "w-5 h-5 text-amber-400 shrink-0" }), t.type === 'info' && _jsx(Info, { className: "w-5 h-5 text-blue-400 shrink-0" }), _jsx("div", { className: "flex-1 text-xs font-semibold leading-relaxed", children: t.message }), _jsx("button", { onClick: () => onDismiss(t.id), className: "p-1 text-slate-400 hover:text-white rounded-lg transition-colors", children: _jsx(X, { className: "w-4 h-4" }) })] }, t.id));
            }) }) }));
};
