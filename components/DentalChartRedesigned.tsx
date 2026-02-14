import React, { useState, useEffect } from 'react';
import { DentalChartData, Tooth, ToothStatus } from '../types';
import { useI18n } from '../hooks/useI18n';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Modern color scheme with gradients and improved contrast
const toothStatusColors: Record<ToothStatus, { bg: string; text: string; border: string; }> = {
    [ToothStatus.HEALTHY]:    { bg: 'bg-gradient-to-br from-green-100 to-green-200', text: 'text-green-800', border: 'border-green-300' },
    [ToothStatus.FILLING]:    { bg: 'bg-gradient-to-br from-blue-400 to-blue-600', text: 'text-white', border: 'border-blue-700' },
    [ToothStatus.CROWN]:      { bg: 'bg-gradient-to-br from-yellow-300 to-yellow-500', text: 'text-yellow-900', border: 'border-yellow-600' },
    [ToothStatus.MISSING]:    { bg: 'bg-gradient-to-br from-gray-300 to-gray-500', text: 'text-white', border: 'border-gray-600' },
    [ToothStatus.IMPLANT]:    { bg: 'bg-gradient-to-br from-purple-400 to-purple-600', text: 'text-white', border: 'border-purple-700' },
    [ToothStatus.ROOT_CANAL]: { bg: 'bg-gradient-to-br from-pink-400 to-pink-600', text: 'text-white', border: 'border-pink-700' },
    [ToothStatus.CAVITY]:     { bg: 'bg-gradient-to-br from-red-400 to-red-600', text: 'text-white', border: 'border-red-700' },
};

// Simple and professional dental icons for tooth status
const toothStatusIcons: Record<ToothStatus, string> = {
    [ToothStatus.HEALTHY]: '✓',
    [ToothStatus.FILLING]: '●',
    [ToothStatus.CROWN]: '♔',
    [ToothStatus.MISSING]: '✗',
    [ToothStatus.IMPLANT]: '⚙',
    [ToothStatus.ROOT_CANAL]: '⚡',
    [ToothStatus.CAVITY]: '▲',
};

// Arabic labels for tooth status
const toothStatusLabels: Record<ToothStatus, string> = {
    [ToothStatus.HEALTHY]: 'س',
    [ToothStatus.FILLING]: 'ح',
    [ToothStatus.CROWN]: 'ت',
    [ToothStatus.MISSING]: 'م',
    [ToothStatus.IMPLANT]: 'ز',
    [ToothStatus.ROOT_CANAL]: 'ع',
    [ToothStatus.CAVITY]: 'ت',
};

// Default tooth data
const defaultTooth: Tooth = { status: ToothStatus.HEALTHY, notes: '' };

// Generate all tooth IDs
const allToothIds = [
    ...Array.from({ length: 8 }, (_, i) => `UR${8 - i}`),
    ...Array.from({ length: 8 }, (_, i) => `UL${i + 1}`),
    ...Array.from({ length: 8 }, (_, i) => `LL${i + 1}`),
    ...Array.from({ length: 8 }, (_, i) => `LR${8 - i}`),
];

// Create default dental chart with all teeth initialized
const defaultDentalChart: DentalChartData = allToothIds.reduce((acc, id) => {
    acc[id] = defaultTooth;
    return acc;
}, {} as DentalChartData);

// Modern Tooth Component with enhanced interactivity
const ToothComponent: React.FC<{
    toothId: string;
    tooth: Tooth;
    onClick: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    isSelected?: boolean;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: () => void;
    onDoubleClick?: () => void;
    onLongPress?: (toothId: string) => void;
}> = ({ toothId, tooth, onClick, onContextMenu, isSelected = false, onMouseEnter, onMouseLeave, onDoubleClick, onLongPress }) => {
    const { t } = useI18n();
    const number = toothId.replace(/[A-Z]/g, '');
    const { bg, border, text } = toothStatusColors[tooth.status];
    
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const handleTouchStart = () => {
        const timer = setTimeout(() => {
            if (onLongPress) onLongPress(toothId);
            if ('vibrate' in navigator) navigator.vibrate(50);
        }, 500);
        setLongPressTimer(timer);
    };
    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };
    return (
        <div className="flex flex-col items-center group">
            <div className="relative">
                <button
                    onClick={onClick}
                    onContextMenu={onContextMenu}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onDoubleClick={onDoubleClick}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    className={`w-14 h-16 flex flex-col items-center justify-center border-2 rounded-xl transition-all duration-200 ease-in-out hover:scale-110 active:scale-95 shadow-md bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-light ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 animate-pulse' : ''}`}
                    style={{ clipPath: 'polygon(20% 0%, 80% 0%, 90% 10%, 95% 25%, 100% 50%, 100% 100%, 0% 100%, 0% 50%, 5% 25%, 10% 10%)' }}
                    aria-label={t('dentalChart.toothAriaLabel', {toothId: toothId, status: t(`toothStatus.${tooth.status}`)})}
                >
                    <span className="font-bold text-lg select-none">{number}</span>
                    <span className="text-lg mt-1">{toothStatusIcons[tooth.status]}</span>
                </button>
                <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full ${bg} border border-white shadow-sm`}></div>
            </div>
        </div>
    );
};

// Modern Quadrant Component
const Quadrant: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 ${className}`}>
        <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 text-center">{title}</h4>
        <div className="grid grid-cols-8 gap-2 justify-center">
            {children}
        </div>
    </div>
);

// Modern Treatment History Modal
const TreatmentHistoryModal: React.FC<{
    toothId: string;
    history: { date: string; treatment: string; dentist: string }[];
    onClose: () => void;
}> = ({ toothId, history, onClose }) => {
    const { t } = useI18n();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-primary to-primary-dark rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white">{t('dentalChart.treatmentHistoryTitle', {toothId: toothId})}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white" aria-label={t('common.closeForm')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-5 max-h-96 overflow-y-auto">
                    {history.length ? (
                        <div className="space-y-4">
                            {history.map((treatment, index) => (
                                <div key={index} className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:shadow-md transition-shadow">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{treatment.treatment}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t('dentalChart.treatmentDate')}: {treatment.date}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{t('dentalChart.treatmentBy')}: {treatment.dentist}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-600 dark:text-slate-400 text-center py-8">{t('dentalChart.noTreatmentHistory')}</p>
                    )}
                </main>
            </div>
        </div>
    );
};

// Modern Edit Tooth Modal
const EditToothModal: React.FC<{
    tooth: Tooth;
    toothId: string;
    onSave: (newTooth: Tooth) => void;
    onClose: () => void;
}> = ({ tooth, toothId, onSave, onClose }) => {
    const { t } = useI18n();
    const [status, setStatus] = useState(tooth.status);
    const [notes, setNotes] = useState(tooth.notes);

    const handleSave = () => {
        onSave({ status, notes });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100">
                <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-primary to-primary-dark rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white">{t('editToothModal.title', {toothId: toothId})}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white" aria-label={t('common.closeForm')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-5 space-y-5">
                    <div>
                        <label htmlFor="toothStatus" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('editToothModal.status')}</label>
                        <select
                            id="toothStatus"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ToothStatus)}
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary transition-shadow bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        >
                            {Object.values(ToothStatus).map(s => <option key={s} value={s}>{t(`toothStatus.${s}`)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="toothNotes" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('editToothModal.notes')}</label>
                        <textarea
                            id="toothNotes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg h-32 focus:ring-primary focus:border-primary transition-shadow bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            placeholder={t('editToothModal.addNotesPlaceholder')}
                        />
                    </div>
                </main>
                <footer className="p-5 bg-slate-50 dark:bg-slate-700/50 flex justify-end space-x-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500 transition-colors">{t('common.cancel')}</button>
                    <button onClick={handleSave} className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors">{t('common.save')}</button>
                </footer>
            </div>
        </div>
    );
};

// Modern Bulk Edit Modal
const BulkEditModal: React.FC<{
    selectedTeeth: string[];
    onSave: (status: ToothStatus, notes: string) => void;
    onClose: () => void;
}> = ({ selectedTeeth, onSave, onClose }) => {
    const { t } = useI18n();
    const [status, setStatus] = useState<ToothStatus>(ToothStatus.HEALTHY);
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        onSave(status, notes);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100">
                <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-primary to-primary-dark rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white">{t('bulkEditModal.title', {count: selectedTeeth.length})}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white" aria-label={t('common.closeForm')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-5 space-y-5">
                    <div>
                        <label htmlFor="bulkStatus" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('bulkEditModal.status')}</label>
                        <select
                            id="bulkStatus"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ToothStatus)}
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary transition-shadow bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        >
                            {Object.values(ToothStatus).map(s => <option key={s} value={s}>{t(`toothStatus.${s}`)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="bulkNotes" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('bulkEditModal.notes')}</label>
                        <textarea
                            id="bulkNotes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg h-32 focus:ring-primary focus:border-primary transition-shadow bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            placeholder={t('bulkEditModal.addNotesPlaceholder')}
                        />
                    </div>
                </main>
                <footer className="p-5 bg-slate-50 dark:bg-slate-700/50 flex justify-end space-x-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500 transition-colors">{t('common.cancel')}</button>
                    <button onClick={handleSave} className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors">{t('common.save')}</button>
                </footer>
            </div>
        </div>
    );
};

// Main Dental Chart Component with Modern Design
const DentalChartRedesigned: React.FC<{
    chartData: DentalChartData;
    onUpdate: (newChartData: DentalChartData) => void;
    treatmentHistory?: Record<string, { date: string; treatment: string; dentist: string }[]>;
}> = ({ chartData, onUpdate, treatmentHistory = {} }) => {
    const { t } = useI18n();
    const [selectedToothId, setSelectedToothId] = useState<string | null>(null);
    const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyToothId, setHistoryToothId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isCompactView, setIsCompactView] = useState(false);
    const [tooltip, setTooltip] = useState<{ visible: boolean; toothId: string; x: number; y: number } | null>(null);
    const [showLegend, setShowLegend] = useState(true);

    // Ensure chartData is initialized with defaults if undefined or missing teeth
    const safeChartData = React.useMemo(() => {
        if (!chartData) return defaultDentalChart;
        const merged = { ...defaultDentalChart };
        Object.keys(chartData).forEach(toothId => {
            if (chartData[toothId]) {
                merged[toothId] = chartData[toothId];
            }
        });
        return merged;
    }, [chartData]);

    const handleToothClick = (toothId: string) => {
        if (isMultiSelectMode) {
            setSelectedTeeth(prev =>
                prev.includes(toothId)
                    ? prev.filter(id => id !== toothId)
                    : [...prev, toothId]
            );
        } else {
            setSelectedToothId(toothId);
        }
    };

    const handleToothLongPress = (toothId: string) => {
        if (treatmentHistory[toothId]) {
            setHistoryToothId(toothId);
            setShowHistoryModal(true);
        }
    };

    const handleMouseEnter = (toothId: string) => (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({ visible: true, toothId, x: rect.left + rect.width / 2, y: rect.top - 10 });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const handleExport = async () => {
        const chartElement = document.querySelector('.dental-chart-container') as HTMLElement;
        if (chartElement) {
            const canvas = await html2canvas(chartElement);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
            pdf.save('dental-chart.pdf');
        }
    };

    const handleCloseModal = () => {
        setSelectedToothId(null);
    };

    const handleSaveTooth = (newTooth: Tooth) => {
        if (selectedToothId) {
            const newChartData = {
                ...safeChartData,
                [selectedToothId]: newTooth,
            };
            onUpdate(newChartData);
        }
    };

    const handleBulkSave = (status: ToothStatus, notes: string) => {
        const newChartData = { ...safeChartData };
        selectedTeeth.forEach(toothId => {
            newChartData[toothId] = { status, notes };
        });
        onUpdate(newChartData);
        setSelectedTeeth([]);
        setIsMultiSelectMode(false);
    };

    const selectedTooth = selectedToothId ? safeChartData[selectedToothId] : null;

    const upperRight = Array.from({ length: 8 }, (_, i) => `UR${i + 1}`);
    const upperLeft = Array.from({ length: 8 }, (_, i) => `UL${8 - i}`);
    const lowerLeft = Array.from({ length: 8 }, (_, i) => `LL${8 - i}`);
    const lowerRight = Array.from({ length: 8 }, (_, i) => `LR${i + 1}`);

    return (
        <div className="space-y-6">
            {/* Modern Control Panel */}
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl shadow-lg p-4 flex flex-wrap gap-3 justify-center items-center">
                <button
                    onClick={() => { setIsMultiSelectMode(!isMultiSelectMode); setSelectedTeeth([]); setSelectedToothId(null); }}
                    className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${isMultiSelectMode ? 'bg-white text-primary shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'}`}
                >
                    {isMultiSelectMode ? t('dentalChart.exitMultiSelect') : t('dentalChart.multiSelect')}
                </button>

                {isMultiSelectMode && selectedTeeth.length > 0 && (
                    <button
                        onClick={() => setIsBulkEditModalOpen(true)}
                        className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md"
                    >
                        {t('dentalChart.bulkEdit')} ({selectedTeeth.length})
                    </button>
                )}

                <button
                    onClick={() => setIsCompactView(!isCompactView)}
                    className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${isCompactView ? 'bg-white text-primary shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'}`}
                >
                    {isCompactView ? t('dentalChart.exitCompactView') : t('dentalChart.compactView')}
                </button>

                <button
                    onClick={handleExport}
                    className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md"
                >
                    {t('dentalChart.exportChart')}
                </button>

                <div className="flex items-center gap-2 bg-white/20 p-2 rounded-lg">
                    <input type="range" min="0.6" max="2" step="0.1" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} className="w-20" />
                    <span className="text-white font-medium">{Math.round(zoomLevel * 100)}%</span>
                </div>

                <button
                    onClick={() => setShowLegend(!showLegend)}
                    className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${showLegend ? 'bg-white text-primary shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'}`}
                >
                    {showLegend ? t('dentalChart.hideLegend') : t('dentalChart.showLegend')}
                </button>
            </div>

            {/* Legend */}
            {showLegend && (
                <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 z-50 flex flex-wrap gap-4 justify-center max-w-xs">
                    {Object.entries(toothStatusColors).map(([status, { bg, border }]) => (
                        <div key={status} className="flex flex-col items-center text-sm text-slate-700 dark:text-slate-300" title={t(`toothStatus.${status}`)}>
                            <div className="relative mb-1">
                                <div className="w-6 h-8 bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 90% 10%, 95% 25%, 100% 50%, 100% 100%, 0% 100%, 0% 50%, 5% 25%, 10% 10%)' }}>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">1</span>
                                    <span className="text-sm">{toothStatusIcons[status as ToothStatus]}</span>
                                </div>
                                <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full ${bg} border border-white shadow-sm`}></div>
                            </div>
                            <span className="font-medium text-center">{t(`toothStatus.${status}`)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Dental Chart Container */}
            <div
                className="dental-chart-container bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-inner p-6 transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
            >
                {isCompactView ? (
                    <div className="grid grid-cols-8 gap-3 justify-center">
                        {allToothIds.map(toothId => (
                            <ToothComponent
                                key={toothId}
                                toothId={toothId}
                                tooth={safeChartData[toothId]}
                                onClick={() => handleToothClick(toothId)}
                                onContextMenu={(e) => { e.preventDefault(); handleToothLongPress(toothId); }}
                                isSelected={selectedTeeth.includes(toothId)}
                                onMouseEnter={handleMouseEnter(toothId)}
                                onMouseLeave={handleMouseLeave}
                                onDoubleClick={() => setSelectedToothId(toothId)}
                                onLongPress={handleToothLongPress}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Quadrant title={t('dentalChart.upperLeft')}>
                                {upperLeft.map(toothId => (
                                    <ToothComponent
                                        key={toothId}
                                        toothId={toothId}
                                        tooth={safeChartData[toothId]}
                                        onClick={() => handleToothClick(toothId)}
                                        onContextMenu={(e) => { e.preventDefault(); handleToothLongPress(toothId); }}
                                        isSelected={selectedTeeth.includes(toothId)}
                                        onMouseEnter={handleMouseEnter(toothId)}
                                        onMouseLeave={handleMouseLeave}
                                        onDoubleClick={() => setSelectedToothId(toothId)}
                                        onLongPress={handleToothLongPress}
                                    />
                                ))}
                            </Quadrant>
                            <Quadrant title={t('dentalChart.upperRight')}>
                                {upperRight.map(toothId => (
                                    <ToothComponent
                                        key={toothId}
                                        toothId={toothId}
                                        tooth={safeChartData[toothId]}
                                        onClick={() => handleToothClick(toothId)}
                                        onContextMenu={(e) => { e.preventDefault(); handleToothLongPress(toothId); }}
                                        isSelected={selectedTeeth.includes(toothId)}
                                        onMouseEnter={handleMouseEnter(toothId)}
                                        onMouseLeave={handleMouseLeave}
                                        onDoubleClick={() => setSelectedToothId(toothId)}
                                        onLongPress={handleToothLongPress}
                                    />
                                ))}
                            </Quadrant>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Quadrant title={t('dentalChart.lowerLeft')}>
                                {lowerLeft.map(toothId => (
                                    <ToothComponent
                                        key={toothId}
                                        toothId={toothId}
                                        tooth={safeChartData[toothId]}
                                        onClick={() => handleToothClick(toothId)}
                                        onContextMenu={(e) => { e.preventDefault(); handleToothLongPress(toothId); }}
                                        isSelected={selectedTeeth.includes(toothId)}
                                        onMouseEnter={handleMouseEnter(toothId)}
                                        onMouseLeave={handleMouseLeave}
                                        onDoubleClick={() => setSelectedToothId(toothId)}
                                        onLongPress={handleToothLongPress}
                                    />
                                ))}
                            </Quadrant>
                            <Quadrant title={t('dentalChart.lowerRight')}>
                                {lowerRight.map(toothId => (
                                    <ToothComponent
                                        key={toothId}
                                        toothId={toothId}
                                        tooth={safeChartData[toothId]}
                                        onClick={() => handleToothClick(toothId)}
                                        onContextMenu={(e) => { e.preventDefault(); handleToothLongPress(toothId); }}
                                        isSelected={selectedTeeth.includes(toothId)}
                                        onMouseEnter={handleMouseEnter(toothId)}
                                        onMouseLeave={handleMouseLeave}
                                        onDoubleClick={() => setSelectedToothId(toothId)}
                                        onLongPress={handleToothLongPress}
                                    />
                                ))}
                            </Quadrant>
                        </div>
                    </div>
                )}
            </div>

            {/* Tooltip */}
            {tooltip && tooltip.visible && (
                <div
                    className="fixed z-40 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 text-xs rounded-lg px-3 py-2 pointer-events-none shadow-lg"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
                >
                    <div className="font-semibold">{t('toothStatus.' + safeChartData[tooltip.toothId].status)}</div>
                    {safeChartData[tooltip.toothId].notes && <div className="text-xs mt-1">{safeChartData[tooltip.toothId].notes}</div>}
                    {treatmentHistory[tooltip.toothId] && treatmentHistory[tooltip.toothId].length > 0 && (
                        <div className="text-xs mt-1">Last: {treatmentHistory[tooltip.toothId][0].treatment}</div>
                    )}
                </div>
            )}

            {/* Modals */}
            {selectedTooth && selectedToothId && (
                <EditToothModal
                    tooth={selectedTooth}
                    toothId={selectedToothId}
                    onSave={handleSaveTooth}
                    onClose={handleCloseModal}
                />
            )}

            {isBulkEditModalOpen && (
                <BulkEditModal
                    selectedTeeth={selectedTeeth}
                    onSave={handleBulkSave}
                    onClose={() => setIsBulkEditModalOpen(false)}
                />
            )}

            {showHistoryModal && historyToothId && (
                <TreatmentHistoryModal
                    toothId={historyToothId}
                    history={treatmentHistory[historyToothId] || []}
                    onClose={() => setShowHistoryModal(false)}
                />
            )}
        </div>
    );
};

export default DentalChartRedesigned;