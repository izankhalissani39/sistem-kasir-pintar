/**
 * Utility formatters for Indonesian POS System
 */
export function formatRupiah(amount) {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    if (isNaN(num))
        return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}
export function formatNumber(amount) {
    const num = amount || 0;
    return new Intl.NumberFormat('id-ID').format(num);
}
export function formatDateIndo(dateStr) {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
}
export function formatTimeIndo(dateStr) {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(date);
}
export function formatFullDateTimeIndo(dateStr) {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return `${formatDateIndo(date)} ${formatTimeIndo(date)}`;
}
export function generateInvoiceNumber(sequence) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seqStr = String(sequence).padStart(4, '0');
    return `TRX-${year}${month}${day}-${seqStr}`;
}
export function generateRandomBarcode() {
    const prefix = '899'; // GS1 prefix commonly used for Indonesia
    const randomBody = String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0');
    const body = `${prefix}${randomBody}`; // 12 digits before EAN-13 check digit
    const checksumTotal = body
        .split('')
        .reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
    const checkDigit = (10 - (checksumTotal % 10)) % 10;
    return `${body}${checkDigit}`;
}
// Audio beep using Web Audio API for cashier feedback
export function playBeepSound(type = 'beep') {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass)
            return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'beep') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.08);
        }
        else if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.25);
        }
        else if (type === 'delete' || type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.setValueAtTime(150, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.12);
        }
    }
    catch {
        // Audio might be blocked before user interaction, safely ignore
    }
}
