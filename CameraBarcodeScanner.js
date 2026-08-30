import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Flashlight, RotateCw, CheckCircle2, AlertCircle, Barcode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playBeepSound } from '../utils/formatters.js';
export const CameraBarcodeScanner = ({ isOpen, onClose, products, onScanSuccess, }) => {
    const videoRef = useRef(null);
    const resumeTimerRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [cameraFacing, setCameraFacing] = useState('environment');
    const [hasTorch, setHasTorch] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [manualInput, setManualInput] = useState('');
    const [lastScannedResult, setLastScannedResult] = useState(null);
    // Initialize camera stream
    useEffect(() => {
        if (!isOpen)
            return;
        let activeStream = null;
        let cancelled = false;
        const startCamera = async () => {
            setCameraError(null);
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Kamera tidak didukung pada browser ini atau koneksi tidak aman.');
                }
                const constraints = {
                    video: {
                        facingMode: { ideal: cameraFacing },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                };
                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                activeStream = mediaStream;
                if (cancelled) {
                    mediaStream.getTracks().forEach((track) => track.stop());
                    return;
                }
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play().catch(() => { });
                }
                // Check torch support
                const track = mediaStream.getVideoTracks()[0];
                const capabilities = (track.getCapabilities ? track.getCapabilities() : {});
                if (capabilities.torch) {
                    setHasTorch(true);
                }
            }
            catch (err) {
                console.warn('Camera access error:', err);
                setCameraError(err.name === 'NotAllowedError'
                    ? 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser HP Anda.'
                    : 'Tidak dapat mengakses kamera perangkat. Pastikan tidak sedang digunakan aplikasi lain.');
            }
        };
        startCamera();
        return () => {
            cancelled = true;
            setStream(null);
            setHasTorch(false);
            setIsTorchOn(false);
            if (activeStream) {
                activeStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isOpen, cameraFacing]);
    // Toggle Flashlight
    const toggleTorch = async () => {
        if (!stream)
            return;
        const track = stream.getVideoTracks()[0];
        try {
            const nextState = !isTorchOn;
            await track.applyConstraints({
                advanced: [{ torch: nextState }],
            });
            setIsTorchOn(nextState);
        }
        catch (e) {
            console.warn('Torch toggle failed:', e);
        }
    };
    // Switch between front and back cameras
    const switchCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
        setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
    };
    // Live Barcode Detector Loop (using standard BarcodeDetector if available)
    useEffect(() => {
        if (!isOpen || !stream || !isScanning)
            return;
        let isSubscribed = true;
        let barcodeDetector = null;
        if ('BarcodeDetector' in window) {
            try {
                barcodeDetector = new window.BarcodeDetector({
                    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
                });
            }
            catch {
                barcodeDetector = null;
            }
        }
        const interval = setInterval(async () => {
            if (!isSubscribed || !videoRef.current || videoRef.current.readyState < 2)
                return;
            if (barcodeDetector) {
                try {
                    const barcodes = await barcodeDetector.detect(videoRef.current);
                    if (barcodes && barcodes.length > 0) {
                        const rawValue = barcodes[0].rawValue;
                        handleDetectedCode(rawValue);
                    }
                }
                catch {
                    // Detector error, ignore
                }
            }
        }, 400);
        return () => {
            isSubscribed = false;
            clearInterval(interval);
        };
    }, [isOpen, stream, isScanning, products]);
    // Handle detected barcode/SKU
    const handleDetectedCode = (code) => {
        if (!code)
            return;
        const cleanCode = code.trim().toLowerCase();
        // Haptic vibration feedback for mobile devices
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate([40, 30, 60]);
            }
            catch { }
        }
        const matched = products.find((p) => (p.barcode && p.barcode.toLowerCase() === cleanCode) ||
            p.sku.toLowerCase() === cleanCode);
        if (matched) {
            playBeepSound('beep');
            setLastScannedResult({
                code,
                productName: matched.name,
                success: true,
            });
            onScanSuccess(matched);
            setIsScanning(false);
            // Auto resume scan after 1.8s
            if (resumeTimerRef.current)
                window.clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = window.setTimeout(() => {
                setIsScanning(true);
                setLastScannedResult(null);
            }, 1800);
        }
        else {
            playBeepSound('error');
            setLastScannedResult({
                code,
                productName: 'Produk tidak ditemukan dalam katalog',
                success: false,
            });
            setIsScanning(false);
            if (resumeTimerRef.current)
                window.clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = window.setTimeout(() => {
                setIsScanning(true);
                setLastScannedResult(null);
            }, 2000);
        }
    };
    useEffect(() => {
        return () => {
            if (resumeTimerRef.current)
                window.clearTimeout(resumeTimerRef.current);
        };
    }, []);
    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualInput.trim())
            return;
        handleDetectedCode(manualInput.trim());
        setManualInput('');
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden safe-area-inset", children: [_jsxs("div", { className: "w-full max-w-md flex items-center justify-between z-10 pt-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "p-2 bg-emerald-600/90 rounded-xl text-white", children: _jsx(Camera, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-white font-bold text-base leading-tight", children: "Scan Kamera HP / Tablet" }), _jsx("p", { className: "text-slate-400 text-xs", children: "Arahkan kamera ke barcode produk" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [hasTorch && (_jsx("button", { onClick: toggleTorch, className: `p-2.5 rounded-full backdrop-blur-md border transition-all ${isTorchOn
                                    ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-lg shadow-amber-400/30'
                                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`, title: "Lampu Senter Flash", children: _jsx(Flashlight, { className: "w-4 h-4" }) })), _jsx("button", { onClick: switchCamera, className: "p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/20 transition-all", title: "Ganti Kamera Depan/Belakang", children: _jsx(RotateCw, { className: "w-4 h-4" }) }), _jsx("button", { onClick: onClose, className: "p-2.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-full backdrop-blur-md border border-rose-500/30 transition-all", title: "Tutup Scanner", children: _jsx(X, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "relative w-full max-w-md aspect-[3/4] sm:aspect-square my-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/40 shadow-2xl flex items-center justify-center", children: [cameraError ? (_jsxs("div", { className: "p-6 text-center text-white space-y-3", children: [_jsx(AlertCircle, { className: "w-12 h-12 text-rose-500 mx-auto" }), _jsx("h4", { className: "font-bold text-sm text-rose-300", children: "Akses Kamera Terkendala" }), _jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: cameraError }), _jsx("p", { className: "text-xs text-emerald-400 pt-2 font-medium", children: "\uD83D\uDCA1 Anda tetap dapat mengetik barcode atau memilih produk langsung di bawah ini." })] })) : (_jsxs(_Fragment, { children: [_jsx("video", { ref: videoRef, playsInline: true, muted: true, autoPlay: true, className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute inset-0 pointer-events-none flex items-center justify-center", children: _jsxs("div", { className: "relative w-64 sm:w-72 h-44 sm:h-48 rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center", children: [_jsx("div", { className: "absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-lg" }), _jsx("div", { className: "absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-lg" }), _jsx("div", { className: "absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-lg" }), _jsx("div", { className: "absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-lg" }), _jsx(motion.div, { animate: { y: [-70, 70, -70] }, transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' }, className: "w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e]" }), _jsx("span", { className: "absolute bottom-2 text-[10px] text-emerald-300 font-bold bg-slate-900/80 px-2 py-0.5 rounded-full uppercase tracking-wider", children: "Posisikan Barcode di Kotak" })] }) })] })), _jsx(AnimatePresence, { children: lastScannedResult && (_jsxs(motion.div, { initial: { opacity: 0, y: 20, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: `absolute bottom-4 left-4 right-4 p-3 rounded-2xl border backdrop-blur-md shadow-xl flex items-center space-x-3 z-20 ${lastScannedResult.success
                                ? 'bg-emerald-950/90 border-emerald-500 text-white'
                                : 'bg-rose-950/90 border-rose-500 text-white'}`, children: [lastScannedResult.success ? (_jsx(CheckCircle2, { className: "w-6 h-6 text-emerald-400 shrink-0 animate-bounce" })) : (_jsx(AlertCircle, { className: "w-6 h-6 text-rose-400 shrink-0" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-xs font-bold text-slate-300 font-mono", children: lastScannedResult.code }), _jsx("div", { className: "text-sm font-extrabold truncate", children: lastScannedResult.productName })] })] })) })] }), _jsxs("div", { className: "w-full max-w-md space-y-2.5 pb-2", children: [_jsxs("form", { onSubmit: handleManualSubmit, className: "flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Barcode, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), _jsx("input", { type: "text", placeholder: "Atau ketik Barcode / SKU...", value: manualInput, onChange: (e) => setManualInput(e.target.value), className: "w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsx("button", { type: "submit", className: "px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shrink-0", children: "Input" })] }), _jsxs("div", { children: [_jsxs("div", { className: "text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between", children: [_jsx("span", { children: "Pilih Cepat Produk (Simulasi):" }), _jsxs("span", { className: "text-emerald-400 font-mono text-[10px]", children: [products.length, " Katalog"] })] }), _jsx("div", { className: "grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-1", children: products.slice(0, 6).map((p) => (_jsxs("button", { type: "button", onClick: () => handleDetectedCode(p.barcode || p.sku), className: "p-2 bg-slate-900/80 hover:bg-emerald-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-colors flex items-center space-x-2", children: [_jsx("div", { className: "w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0", children: "+" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-xs font-bold text-white truncate", children: p.name }), _jsx("div", { className: "text-[10px] text-slate-400 font-mono", children: p.barcode || p.sku })] })] }, p.id))) })] })] })] }));
};
