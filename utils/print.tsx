import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nProvider } from '../contexts/I18nContext';
import { AuthProvider } from '../contexts/AuthContext';

export interface OpenPrintWindowOptions {
    pageSize?: string;
    mode?: 'standard' | 'minimal';
    width?: number;
    height?: number;
}

export const openPrintWindow = (
    title: string,
    component: React.ReactElement,
    options: OpenPrintWindowOptions = {}
) => {
    const {
        pageSize = 'A4 portrait',
        mode = 'standard',
        width = 1000,
        height = 800,
    } = options;
    const isMinimal = mode === 'minimal';

    const printWindow = window.open('', '_blank', `height=${height},width=${width}`);
    if (!printWindow) {
        alert('Please allow popups for this website to print reports.');
        return;
    }

    printWindow.document.title = title;

    // Enhanced print styles with comprehensive CSS coverage
    const printStyles = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                /* Reset and base styles */
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                html {
                    font-size: 16px;
                }
                
                body {
                    font-family: 'Cairo', sans-serif;
                    direction: rtl;
                    font-size: 12pt;
                    line-height: 1.6;
                    color: #1e293b;
                    background: ${isMinimal ? '#f8fafc' : 'white'};
                    padding: ${isMinimal ? '16px' : '1.5cm'};
                    padding-top: 80px;
                }
                
                @media (max-width: 640px) {
                    body {
                        padding: ${isMinimal ? '8px' : '0.5cm'};
                        padding-top: 90px;
                    }
                }

                ${isMinimal ? `
                @media print {
                    @page {
                        size: ${pageSize};
                        margin: 8mm;
                    }

                    html, body {
                        background: #ffffff !important;
                    }

                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                ` : `
                /* Print-specific styles */
                @media print {
                    @page {
                        size: ${pageSize};
                        margin: 1cm;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Force colors for print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    /* Clean print adjustments */
                    .print-clean-bg {
                        background: none !important;
                        box-shadow: none !important;
                    }
                    
                    .print-clean-border {
                        border: none !important;
                    }
                    
                    /* Force all text to be visible (dark) when printing */
                    * {
                        color: #1e293b !important;
                        text-shadow: none !important;
                    }
                    
                    /* Override specific text colors */
                    .text-white { color: #1e293b !important; }
                    .text-slate-400 { color: #64748b !important; }
                    .text-slate-500 { color: #64748b !important; }
                    .text-slate-600 { color: #475569 !important; }
                    .text-primary { color: #0d9488 !important; }
                    .text-primary-dark { color: #0f766e !important; }
                    .text-emerald-500 { color: #10b981 !important; }
                    .text-emerald-600 { color: #059669 !important; }
                    .text-blue-500 { color: #3b82f6 !important; }
                    .text-blue-600 { color: #2563eb !important; }
                    .text-violet-500 { color: #8b5cf6 !important; }
                    .text-violet-600 { color: #7c3aed !important; }
                    
                    /* Remove gradient backgrounds and use solid colors */
                    .bg-gradient-to-r,
                    .bg-gradient-to-l,
                    .bg-gradient-to-br,
                    .bg-gradient-to-bl,
                    .bg-gradient-to-t,
                    .bg-gradient-to-b {
                        background: #f8fafc !important;
                    }
                    
                    /* Remove white text from badges */
                    .bg-blue-500,
                    .bg-emerald-500,
                    .bg-violet-500,
                    .bg-gradient-to-r {
                        color: #1e293b !important;
                    }
                    
                    /* Page breaks */
                    .break-before-always { page-break-before: always; }
                    .break-after-always { page-break-after: always; }
                    .break-inside-avoid { page-break-inside: avoid; }
                    
                    /* Table improvements for print */
                    table {
                        font-size: 10pt;
                        border-collapse: collapse;
                    }
                    
                    th, td {
                        padding: 10px 8px;
                    }
                    
                    th {
                        border-bottom: 2px solid #334155;
                        font-weight: 600;
                    }
                    
                    td {
                        border-bottom: 1px solid #e2e8f0;
                    }
                    
                    thead { display: table-header-group; }
                    tbody { display: table-row-group; }
                    tr { page-break-inside: avoid; }
                    
                    /* Headers styling */
                    h1, h2, h3, h4, h5, h6 {
                        color: #0f172a !important;
                        margin-bottom: 0.5em;
                    }
                    
                    p, span, li, div {
                        color: #334155 !important;
                    }
                }
                `}
                
                /* Background colors */
                .bg-white { background-color: #ffffff; }
                .bg-slate-50 { background-color: #f8fafc; }
                .bg-slate-100 { background-color: #f1f5f9; }
                .bg-slate-200 { background-color: #e2e8f0; }
                .bg-blue-50 { background-color: #eff6ff; }
                .bg-blue-100 { background-color: #dbeafe; }
                .bg-blue-500 { background-color: #3b82f6; }
                .bg-emerald-50 { background-color: #ecfdf5; }
                .bg-emerald-100 { background-color: #d1fae5; }
                .bg-emerald-500 { background-color: #10b981; }
                .bg-red-50 { background-color: #fef2f2; }
                .bg-red-100 { background-color: #fee2e2; }
                .bg-amber-50 { background-color: #fffbeb; }
                .bg-amber-100 { background-color: #fef3c7; }
                .bg-violet-50 { background-color: #f5f3ff; }
                .bg-violet-100 { background-color: #ede9fe; }
                .bg-violet-500 { background-color: #8b5cf6; }
                .bg-rose-50 { background-color: #fff1f2; }
                .bg-teal-50 { background-color: #f0fdfa; }
                .bg-teal-100 { background-color: #ccfbf1; }
                .bg-cyan-50 { background-color: #ecfeff; }
                .bg-indigo-50 { background-color: #eef2ff; }
                .bg-indigo-100 { background-color: #e0e7ff; }
                .bg-purple-50 { background-color: #faf5ff; }
                .bg-pink-50 { background-color: #fdf2f8; }
                .bg-orange-50 { background-color: #fff7ed; }
                
                /* Text colors */
                .text-white { color: #ffffff; }
                .text-slate-400 { color: #94a3b8; }
                .text-slate-500 { color: #64748b; }
                .text-slate-600 { color: #475569; }
                .text-slate-700 { color: #334155; }
                .text-slate-800 { color: #1e293b; }
                .text-slate-900 { color: #0f172a; }
                .text-blue-500 { color: #3b82f6; }
                .text-blue-600 { color: #2563eb; }
                .text-blue-700 { color: #1d4ed8; }
                .text-emerald-500 { color: #10b981; }
                .text-emerald-600 { color: #059669; }
                .text-emerald-700 { color: #047857; }
                .text-red-500 { color: #ef4444; }
                .text-red-600 { color: #dc2626; }
                .text-amber-500 { color: #f59e0b; }
                .text-amber-600 { color: #d97706; }
                .text-amber-700 { color: #92400e; }
                .text-violet-500 { color: #8b5cf6; }
                .text-violet-600 { color: #7c3aed; }
                .text-violet-700 { color: #6d28d9; }
                .text-teal-600 { color: #0d9488; }
                .text-teal-700 { color: #0f766e; }
                .text-cyan-600 { color: #0891b2; }
                .text-purple-600 { color: #9333ea; }
                .text-pink-600 { color: #db2777; }
                .text-orange-600 { color: #ea580c; }
                
                /* Border colors */
                .border { border-width: 1px; border-style: solid; }
                .border-2 { border-width: 2px; }
                .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
                .border-x { border-left-width: 1px; border-left-style: solid; border-right-width: 1px; border-right-style: solid; }
                .border-slate-100 { border-color: #f1f5f9; }
                .border-slate-200 { border-color: #e2e8f0; }
                .border-slate-300 { border-color: #cbd5e1; }
                .border-blue-100 { border-color: #dbeafe; }
                .border-blue-200 { border-color: #bfdbfe; }
                .border-emerald-200 { border-color: #a7f3d0; }
                .border-teal-200 { border-color: #99f6e4; }
                .border-cyan-200 { border-color: #a5f3fc; }
                .border-violet-200 { border-color: #ddd6fe; }
                .border-purple-200 { border-color: #e9d5ff; }
                .border-pink-200 { border-color: #fbcfe8; }
                .border-orange-200 { border-color: #fed7aa; }
                .border-indigo-200 { border-color: #c7d2fe; }
                .border-amber-200 { border-color: #fde68a; }
                .border-rose-200 { border-color: #fecdd3; }
                
                /* Padding */
                .p-1 { padding: 4px; }
                .p-2 { padding: 8px; }
                .p-3 { padding: 12px; }
                .p-4 { padding: 16px; }
                .p-5 { padding: 20px; }
                .p-6 { padding: 24px; }
                .p-8 { padding: 32px; }
                .px-2 { padding-left: 8px; padding-right: 8px; }
                .px-3 { padding-left: 12px; padding-right: 12px; }
                .px-4 { padding-left: 16px; padding-right: 16px; }
                .px-6 { padding-left: 24px; padding-right: 24px; }
                .py-1 { padding-top: 4px; padding-bottom: 4px; }
                .py-2 { padding-top: 8px; padding-bottom: 8px; }
                .py-3 { padding-top: 12px; padding-bottom: 12px; }
                .py-4 { padding-top: 16px; padding-bottom: 16px; }
                .pt-4 { padding-top: 16px; }
                .pb-4 { padding-bottom: 16px; }
                .pl-2 { padding-left: 8px; }
                
                /* Margin */
                .m-0 { margin: 0; }
                .mb-1 { margin-bottom: 4px; }
                .mb-2 { margin-bottom: 8px; }
                .mb-3 { margin-bottom: 12px; }
                .mb-4 { margin-bottom: 16px; }
                .mb-6 { margin-bottom: 24px; }
                .mb-8 { margin-bottom: 32px; }
                .mt-1 { margin-top: 4px; }
                .mt-2 { margin-top: 8px; }
                .mt-4 { margin-top: 16px; }
                .mt-6 { margin-top: 24px; }
                .mt-8 { margin-top: 32px; }
                .ml-2 { margin-left: 8px; }
                .mr-2 { margin-right: 8px; }
                .gap-1 { gap: 4px; }
                .gap-2 { gap: 8px; }
                .gap-3 { gap: 12px; }
                .gap-4 { gap: 16px; }
                .gap-6 { gap: 24px; }
                .space-y-2 > * + * { margin-top: 8px; }
                .space-y-3 > * + * { margin-top: 12px; }
                .space-y-4 > * + * { margin-top: 16px; }
                .space-y-6 > * + * { margin-top: 24px; }
                
                /* Flexbox */
                .flex { display: flex; }
                .flex-col { flex-direction: column; }
                .flex-wrap { flex-wrap: wrap; }
                .items-start { align-items: flex-start; }
                .items-center { align-items: center; }
                .items-end { align-items: flex-end; }
                .justify-start { justify-content: flex-start; }
                .justify-center { justify-content: center; }
                .justify-end { justify-content: flex-end; }
                .justify-between { justify-content: space-between; }
                .justify-around { justify-content: space-around; }
                
                /* Grid */
                .grid { display: grid; }
                .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                .col-span-2 { grid-column: span 2 / span 2; }
                .col-span-3 { grid-column: span 3 / span 3; }
                
                /* Sizing */
                .w-full { width: 100%; }
                .w-1\\/2 { width: 50%; }
                .w-1\\/3 { width: 33.333%; }
                .w-2\\/3 { width: 66.666%; }
                .w-1\\/4 { width: 25%; }
                .w-auto { width: auto; }
                .w-2 { width: 8px; }
                .w-4 { width: 16px; }
                .w-6 { width: 24px; }
                .w-8 { width: 32px; }
                .w-10 { width: 40px; }
                .w-12 { width: 48px; }
                .w-14 { width: 56px; }
                .w-16 { width: 64px; }
                .h-2 { height: 8px; }
                .h-4 { height: 16px; }
                .h-5 { height: 20px; }
                .h-6 { height: 24px; }
                .h-8 { height: 32px; }
                .h-10 { height: 40px; }
                .h-12 { height: 48px; }
                .h-14 { height: 56px; }
                .h-16 { height: 64px; }
                .h-full { height: 100%; }
                .h-auto { height: auto; }
                .max-w-sm { max-width: 384px; }
                .max-w-md { max-width: 448px; }
                .max-w-lg { max-width: 512px; }
                .min-h-screen { min-height: 100vh; }
                
                /* Typography */
                .text-xs { font-size: 0.75rem; }
                .text-sm { font-size: 0.875rem; }
                .text-base { font-size: 1rem; }
                .text-lg { font-size: 1.125rem; }
                .text-xl { font-size: 1.25rem; }
                .text-2xl { font-size: 1.5rem; }
                .text-3xl { font-size: 1.875rem; }
                .text-4xl { font-size: 2.25rem; }
                .font-thin { font-weight: 100; }
                .font-light { font-weight: 300; }
                .font-normal { font-weight: 400; }
                .font-medium { font-weight: 500; }
                .font-semibold { font-weight: 600; }
                .font-bold { font-weight: 700; }
                .font-extrabold { font-weight: 800; }
                .font-mono { font-family: monospace; }
                
                /* Images */
                img { max-width: 100%; height: auto; }
                .w-16 { width: 64px; }
                .h-16 { height: 64px; }
                .w-20 { width: 80px; }
                .h-20 { height: 80px; }
                .w-24 { width: 96px; }
                .h-24 { height: 96px; }
                .object-contain { object-fit: contain; }
                .object-cover { object-fit: cover; }
                .object-fill { object-fit: fill; }
                .bg-white { background-color: #ffffff; }
                .rounded-lg { border-radius: 8px; }
                .rounded-xl { border-radius: 12px; }
                .rounded-full { border-radius: 9999px; }
                .p-1 { padding: 4px; }
                .p-2 { padding: 8px; }
                .border { border-width: 1px; border-style: solid; border-color: #e2e8f0; }
                
                /* Tables */
                table { border-collapse: collapse; width: 100%; }
                th { text-align: right; font-weight: 600; }
                td { text-align: right; }
                
                /* Shadows */
                .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
                .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
                .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
                .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
                .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                .shadow-blue-200 { box-shadow: 0 10px 15px -3px rgba(191, 219, 254, 0.5); }
                .shadow-violet-200 { box-shadow: 0 10px 15px -3px rgba(221, 214, 254, 0.5); }
                .shadow-emerald-200 { box-shadow: 0 10px 15px -3px rgba(167, 243, 208, 0.5); }
                .shadow-amber-200 { box-shadow: 0 10px 15px -3px rgba(253, 230, 138, 0.5); }
                .shadow-rose-200 { box-shadow: 0 10px 15px -3px rgba(254, 205, 211, 0.5); }
                
                /* Border radius */
                .rounded { border-radius: 4px; }
                .rounded-md { border-radius: 6px; }
                .rounded-lg { border-radius: 8px; }
                .rounded-xl { border-radius: 12px; }
                .rounded-2xl { border-radius: 16px; }
                .rounded-3xl { border-radius: 24px; }
                .rounded-full { border-radius: 9999px; }
                .rounded-t-xl { border-top-left-radius: 12px; border-top-right-radius: 12px; }
                .rounded-b-xl { border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }
                .rounded-t-lg { border-top-left-radius: 8px; border-top-right-radius: 8px; }
                .rounded-b-lg { border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
                
                /* Gradient backgrounds */
                .bg-gradient-to-r { background: linear-gradient(to right, var(--tw-gradient-stops)); }
                .bg-gradient-to-l { background: linear-gradient(to left, var(--tw-gradient-stops)); }
                .bg-gradient-to-t { background: linear-gradient(to top, var(--tw-gradient-stops)); }
                .bg-gradient-to-b { background: linear-gradient(to bottom, var(--tw-gradient-stops)); }
                .bg-gradient-to-tr { background: linear-gradient(to top right, var(--tw-gradient-stops)); }
                .bg-gradient-to-tl { background: linear-gradient(to top left, var(--tw-gradient-stops)); }
                .bg-gradient-to-br { background: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
                .bg-gradient-to-bl { background: linear-gradient(to bottom left, var(--tw-gradient-stops)); }
                
                /* Gradient from colors */
                .from-slate-50 { --tw-gradient-from: #f8fafc; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(248, 250, 252, 0)); }
                .from-slate-100 { --tw-gradient-from: #f1f5f9; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(241, 245, 249, 0)); }
                .from-blue-50 { --tw-gradient-from: #eff6ff; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(239, 246, 255, 0)); }
                .from-blue-100 { --tw-gradient-from: #dbeafe; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(219, 234, 254, 0)); }
                .from-blue-400 { --tw-gradient-from: #60a5fa; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(96, 165, 250, 0)); }
                .from-blue-500 { --tw-gradient-from: #3b82f6; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0)); }
                .from-blue-600 { --tw-gradient-from: #2563eb; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(37, 99, 235, 0)); }
                .from-emerald-50 { --tw-gradient-from: #ecfdf5; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(236, 253, 245, 0)); }
                .from-emerald-400 { --tw-gradient-from: #34d399; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(52, 211, 153, 0)); }
                .from-emerald-500 { --tw-gradient-from: #10b981; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(16, 185, 129, 0)); }
                .from-emerald-600 { --tw-gradient-from: #059669; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(5, 150, 105, 0)); }
                .from-violet-50 { --tw-gradient-from: #f5f3ff; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(245, 243, 255, 0)); }
                .from-violet-400 { --tw-gradient-from: #a78bfa; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(167, 139, 250, 0)); }
                .from-violet-500 { --tw-gradient-from: #8b5cf6; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(139, 92, 246, 0)); }
                .from-violet-600 { --tw-gradient-from: #7c3aed; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(124, 58, 237, 0)); }
                .from-indigo-50 { --tw-gradient-from: #eef2ff; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(238, 242, 255, 0)); }
                .from-indigo-500 { --tw-gradient-from: #6366f1; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(99, 102, 241, 0)); }
                .from-indigo-600 { --tw-gradient-from: #4f46e5; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(79, 70, 229, 0)); }
                .from-teal-50 { --tw-gradient-from: #f0fdfa; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(240, 253, 250, 0)); }
                .from-teal-400 { --tw-gradient-from: #2dd4bf; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(45, 212, 191, 0)); }
                .from-cyan-400 { --tw-gradient-from: #22d3ee; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(34, 211, 238, 0)); }
                .from-cyan-500 { --tw-gradient-from: #06b6d4; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(6, 182, 212, 0)); }
                .from-amber-400 { --tw-gradient-from: #fbbf24; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(251, 191, 36, 0)); }
                .from-amber-500 { --tw-gradient-from: #f59e0b; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(245, 158, 11, 0)); }
                .from-rose-400 { --tw-gradient-from: #fb7185; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(251, 113, 133, 0)); }
                .from-pink-400 { --tw-gradient-from: #f472b6; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(244, 114, 182, 0)); }
                .from-orange-400 { --tw-gradient-from: #fb923c; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(251, 146, 60, 0)); }
                
                /* Gradient to colors */
                .to-slate-50 { --tw-gradient-to: #f8fafc; }
                .to-blue-50 { --tw-gradient-to: #eff6ff; }
                .to-blue-100 { --tw-gradient-to: #dbeafe; }
                .to-indigo-50 { --tw-gradient-to: #eef2ff; }
                .to-indigo-500 { --tw-gradient-to: #6366f1; }
                .to-indigo-600 { --tw-gradient-to: #4f46e5; }
                .to-emerald-50 { --tw-gradient-to: #ecfdf5; }
                .to-emerald-500 { --tw-gradient-to: #10b981; }
                .to-emerald-600 { --tw-gradient-to: #059669; }
                .to-teal-50 { --tw-gradient-to: #f0fdfa; }
                .to-teal-500 { --tw-gradient-to: #14b8a6; }
                .to-purple-500 { --tw-gradient-to: #a855f7; }
                .to-purple-600 { --tw-gradient-to: #9333ea; }
                .to-violet-500 { --tw-gradient-to: #8b5cf6; }
                .to-violet-600 { --tw-gradient-to: #7c3aed; }
                .to-cyan-500 { --tw-gradient-to: #06b6d4; }
                .to-cyan-600 { --tw-gradient-to: #0891b2; }
                .to-amber-500 { --tw-gradient-to: #f59e0b; }
                .to-amber-600 { --tw-gradient-to: #d97706; }
                .to-orange-500 { --tw-gradient-to: #f97316; }
                .to-orange-600 { --tw-gradient-to: #ea580c; }
                .to-pink-500 { --tw-gradient-to: #ec4899; }
                .to-pink-600 { --tw-gradient-to: #db2777; }
                .to-rose-500 { --tw-gradient-to: #f43f5e; }
                .to-rose-600 { --tw-gradient-to: #e11d48; }
                .to-blue-500 { --tw-gradient-to: #3b82f6; }
                .to-blue-600 { --tw-gradient-to: #2563eb; }
                .to-slate-200 { --tw-gradient-to: #e2e8f0; }
                
                /* Background opacity */
                .bg-white\\/20 { background-color: rgba(255, 255, 255, 0.2); }
                .bg-white\\/25 { background-color: rgba(255, 255, 255, 0.25); }
                .bg-white\\/30 { background-color: rgba(255, 255, 255, 0.3); }
                .bg-white\\/10 { background-color: rgba(255, 255, 255, 0.1); }
                .bg-black\\/10 { background-color: rgba(0, 0, 0, 0.1); }
                .bg-black\\/5 { background-color: rgba(0, 0, 0, 0.05); }
                
                /* Opacity */
                .opacity-0 { opacity: 0; }
                .opacity-50 { opacity: 0.5; }
                .opacity-75 { opacity: 0.75; }
                .opacity-80 { opacity: 0.8; }
                .opacity-90 { opacity: 0.9; }
                .opacity-100 { opacity: 1; }
                
                /* Whitespace */
                .whitespace-normal { white-space: normal; }
                .whitespace-pre { white-space: pre; }
                .whitespace-pre-wrap { white-space: pre-wrap; }
                .whitespace-nowrap { white-space: nowrap; }
                
                /* SVG sizing */
                .w-3 { width: 12px; }
                .w-4 { width: 16px; }
                .w-5 { width: 20px; }
                .w-6 { width: 24px; }
                .w-7 { width: 28px; }
                .w-8 { width: 32px; }
                .w-9 { width: 36px; }
                .w-10 { width: 40px; }
                .h-3 { height: 12px; }
                .h-4 { height: 16px; }
                .h-5 { height: 20px; }
                .h-6 { height: 24px; }
                .h-7 { height: 28px; }
                .h-8 { height: 32px; }
                .h-9 { height: 36px; }
                .h-10 { height: 40px; }
                
                /* SVG fill and stroke */
                .fill-current { fill: currentColor; }
                .stroke-current { stroke: currentColor; }
                .fill-none { fill: none; }
                .stroke-none { stroke: none; }
                
                /* Visibility */
                .hidden { display: none; }
                .visible { visibility: visible; }
                .invisible { visibility: hidden; }
                
                /* Overflow */
                .overflow-hidden { overflow: hidden; }
                .overflow-visible { overflow: visible; }
                .overflow-auto { overflow: auto; }
                
                /* Position */
                .relative { position: relative; }
                .absolute { position: absolute; }
                .fixed { position: fixed; }
                .static { position: static; }
                .sticky { position: sticky; }
                
                /* Positioning */
                .top-0 { top: 0; }
                .right-0 { right: 0; }
                .bottom-0 { bottom: 0; }
                .left-0 { left: 0; }
                .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
                .inset-x-0 { right: 0; left: 0; }
                .inset-y-0 { top: 0; bottom: 0; }
                .z-0 { z-index: 0; }
                .z-10 { z-index: 10; }
                .z-20 { z-index: 20; }
                .z-50 { z-index: 50; }
                
                /* Border style */
                .border-solid { border-style: solid; }
                .border-dashed { border-style: dashed; }
                .border-dotted { border-style: dotted; }
                
                /* Outline */
                .outline-none { outline: none; }
                .outline { outline: 2px solid; }
                
                /* Text decoration */
                .underline { text-decoration: underline; }
                .line-through { text-decoration: line-through; }
                .no-underline { text-decoration: none; }
                
                /* Line height */
                .leading-tight { line-height: 1.25; }
                .leading-normal { line-height: 1.5; }
                .leading-relaxed { line-height: 1.625; }
                .leading-loose { line-height: 2; }
                
                /* List styles */
                .list-none { list-style: none; }
                .list-disc { list-style-type: disc; }
                .list-decimal { list-style-type: decimal; }
                .list-square { list-style-type: square; }
                
                /* Text align */
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .text-center { text-align: center; }
                .text-justify { text-align: justify; }
                
                /* Inline elements */
                .inline { display: inline; }
                .inline-block { display: inline-block; }
                .inline-flex { display: inline-flex; }
                .block { display: block; }
                
                /* Transform origin */
                .origin-center { transform-origin: center; }
                .origin-top { transform-origin: top; }
                .origin-top-right { transform-origin: top right; }
                .origin-bottom { transform-origin: bottom; }
                
                /* Transition */
                .transition { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
                .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
                .transition-colors { transition-property: color, background-color, border-color; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
                .transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
                .transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
                
                /* Transform scale */
                .scale-90 { transform: scale(0.9); }
                .scale-95 { transform: scale(0.95); }
                .scale-100 { transform: scale(1); }
                .scale-105 { transform: scale(1.05); }
                .scale-110 { transform: scale(1.1); }
                
                /* Translate */
                .translate-x-0 { transform: translateX(0); }
                .translate-x-1 { transform: translateX(4px); }
                .translate-x-2 { transform: translateX(8px); }
                .translate-x-full { transform: translateX(100%); }
                .translate-y-0 { transform: translateY(0); }
                .translate-y-1 { transform: translateY(4px); }
                .translate-y-2 { transform: translateY(8px); }
                .translate-y-full { transform: translateY(100%); }
                
                /* Pointer events */
                .pointer-events-none { pointer-events: none; }
                .pointer-events-auto { pointer-events: auto; }
                
                /* User select */
                .select-none { user-select: none; }
                .select-text { user-select: text; }
                .select-all { user-select: all; }
                
                /* Cursor */
                .cursor-auto { cursor: auto; }
                .cursor-pointer { cursor: pointer; }
                .cursor-not-allowed { cursor: not-allowed; }
                
                /* Responsive breakpoints */
                @media (min-width: 640px) {
                    .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
                
                @media (min-width: 768px) {
                    .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                    .md\\:col-span-2 { grid-column: span 2 / span 2; }
                    .md\\:col-span-3 { grid-column: span 3 / span 3; }
                    .md\\:flex-row { flex-direction: row; }
                    .md\\:flex-col { flex-direction: column; }
                }
                
                @media (min-width: 1024px) {
                    .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                    .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                }
                
                /* Animations */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideIn {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
                    50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
                }
                
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                .animate-slideIn { animation: slideIn 0.3s ease-out; }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .animate-spin { animation: spin 1s linear infinite; }
                .animate-bounce { animation: bounce 1s infinite; }
                
                /* Selection */
                ::selection {
                    background-color: #dbeafe;
                    color: #1e40af;
                }
                
                /* Scrollbar styling */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                /* Close Button Styles */
                .close-button-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 9999;
                    background: linear-gradient(to bottom, #f8fafc, #ffffff);
                    border-bottom: 1px solid #e2e8f0;
                    padding: 12px 16px;
                    display: flex;
                    justify-content: flex-start;
                    align-items: center;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .close-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 10px 16px;
                    font-family: 'Cairo', sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
                }
                
                .close-button:hover {
                    background: #dc2626;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
                }
                
                .close-button:active {
                    transform: translateY(0);
                }
                
                .close-button svg {
                    width: 18px;
                    height: 18px;
                }
                
                /* Mobile optimizations for close button */
                @media (max-width: 640px) {
                    .close-button-container {
                        padding: 16px;
                    }
                    
                    .close-button {
                        padding: 12px 20px;
                        font-size: 16px;
                    }
                    
                    .close-button svg {
                        width: 20px;
                        height: 20px;
                    }
                }
                
                /* Print optimizations */

                @media print {
                    /* Hide decorative elements when printing */
                    .no-print-decorative {
                        background: none !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    
                    /* Ensure text is crisp */
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                
                /* Medical/Dental specific print styles */
                .prescription-header {
                    border-bottom: 3px solid #3b82f6;
                    padding-bottom: 1rem;
                    margin-bottom: 1.5rem;
                }
                
                .invoice-header {
                    background: linear-gradient(to right, #eff6ff, #dbeafe);
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                
                .report-section {
                    margin-bottom: 1.5rem;
                    page-break-inside: avoid;
                }
                
                .signature-section {
                    margin-top: 3rem;
                    padding-top: 1rem;
                    border-top: 1px dashed #cbd5e1;
                }
                
                .watermark {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 6rem;
                    opacity: 0.05;
                    pointer-events: none;
                    white-space: nowrap;
                }
            </style>
        </head>
        <body class="bg-white">
            <!-- Close Button - Visible only on screen, hidden when printing -->
            <div class="close-button-container no-print">
                <button onclick="window.close()" class="close-button" aria-label="إغلاق التقرير">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>إغلاق</span>
                </button>
            </div>
            <div id="print-root"></div>
        </body>

        </html>
    `;

    // Write styles to the print window
    printWindow.document.write(printStyles);
    printWindow.document.close();

    // Create a root element in the new window
    const printRoot = printWindow.document.getElementById('print-root');
    if (!printRoot) {
        console.error('Failed to create print root element');
        return;
    }

    const root = ReactDOM.createRoot(printRoot);

    // Render the component with necessary providers
    root.render(
        <React.StrictMode>
            <AuthProvider>
                <I18nProvider>
                    {component}
                </I18nProvider>
            </AuthProvider>
        </React.StrictMode>
    );

    // Wait for content to render and then print
    const waitAndPrint = (attempts = 0) => {
        const maxAttempts = 15;
        const delay = 400;
        
        try {
            const content = printWindow.document.getElementById('print-root');
            if (content && content.children.length > 0) {
                const rect = content.getBoundingClientRect();
                if (rect.height > 0 || rect.width > 0) {
                    // Fonts might still be loading, wait a bit more
                    setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();
                    }, 800);
                    return;
                }
            }
            
            if (attempts < maxAttempts) {
                setTimeout(() => waitAndPrint(attempts + 1), delay);
            } else {
                // Final attempt to print
                try {
                    printWindow.focus();
                    printWindow.print();
                } catch (e) {
                    console.error('Print failed:', e);
                }
            }
        } catch (error) {
            console.error('Print check failed:', error);
            if (attempts < maxAttempts) {
                setTimeout(() => waitAndPrint(attempts + 1), delay);
            }
        }
    };

    // Start the print check process
    setTimeout(() => waitAndPrint(0), 1200);
};
