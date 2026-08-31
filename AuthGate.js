import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import React, { useState } from 'react';
import { LogIn, ShieldCheck, Database } from 'lucide-react';
import { supabase } from './supabaseClient.js';

export const AuthGate = ({ onLocalMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message);
    setLoading(false);
  };
  return _jsx('div', { className: 'min-h-screen bg-slate-950 flex items-center justify-center p-4', children: _jsxs('div', { className: 'w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8', children: [
    _jsx('div', { className: 'w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-5', children: _jsx(Database, { size: 28 }) }),
    _jsx('h1', { className: 'text-2xl font-black text-slate-900', children: 'Login Database Kasir' }),
    _jsx('p', { className: 'text-sm text-slate-500 mt-2 mb-6', children: 'Masuk untuk menggunakan data produk, stok, transaksi, dan laporan yang tersimpan di server.' }),
    _jsxs('form', { onSubmit: login, className: 'space-y-4', children: [
      _jsx('input', { type: 'email', required: true, value: email, onChange: e => setEmail(e.target.value), placeholder: 'Email kasir', className: 'w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500' }),
      _jsx('input', { type: 'password', required: true, value: password, onChange: e => setPassword(e.target.value), placeholder: 'Password', className: 'w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500' }),
      error && _jsx('div', { className: 'text-sm text-red-600 bg-red-50 rounded-xl p-3', children: error }),
      _jsxs('button', { disabled: loading, className: 'w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2', children: [_jsx(LogIn, { size: 18 }), loading ? 'Memproses...' : 'Masuk'] })
    ] }),
    _jsxs('div', { className: 'mt-6 text-xs text-slate-400 flex gap-2', children: [_jsx(ShieldCheck, { size: 15 }), 'Akses database dilindungi Supabase Auth + RLS.'] }),
    _jsx('button', { type: 'button', onClick: onLocalMode, className: 'mt-5 text-xs text-slate-500 underline', children: 'Gunakan mode lokal sementara' })
  ] }) });
};
