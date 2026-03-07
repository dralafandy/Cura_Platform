import React, { useState } from 'react';
import { DentalChartData, Tooth, ToothStatus } from '../types';
import { useI18n } from '../hooks/useI18n';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const toothStatusColors: Record<ToothStatus, { bg: string; text: string; border: string; }> = {
    [ToothStatus.HEALTHY]:    { bg: 'bg-gradient-to-b from-white to-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    [ToothStatus.FILLING]:    { bg: 'bg-gradient-to-b from-blue-400 to-blue-600', text: 'text-white', border: 'border-blue-600' },
    [ToothStatus.CROWN]:      { bg: 'bg-gradient-to-b from-yellow-300 to-yellow-500', text: 'text-white', border: 'border-yellow-500' },
    [ToothStatus.MISSING]:    { bg: 'bg-gradient-to-b from-slate-300 to-slate-500', text: 'text-white', border: 'border-slate-500' },
    [ToothStatus.IMPLANT]:    { bg: 'bg-gradient-to-b from-purple-400 to-purple-600', text: 'text-white', border: 'border-purple-600' },
    [ToothStatus.ROOT_CANAL]: { bg: 'bg-gradient-to-b from-pink-400 to-pink-600', text: 'text-white', border: 'border-pink-600' },
    [ToothStatus.CAVITY]:     { bg: 'bg-gradient-to-b from-red-400 to-red-600', text: 'text-white', border: 'border-red-600' },
};

const toothStatusIcons: Record<ToothStatus, string> = {
    [ToothStatus.HEALTHY]: '🦷',
    [ToothStatus.FILLING]: '🔘',
    [ToothStatus.CROWN]: '👑',
    [ToothStatus.MISSING]: '❌',
    [ToothStatus.IMPLANT]: '🦷',
    [ToothStatus.ROOT_CANAL]: '🩺',
    [ToothStatus.CAVITY]: '⚠️',
};

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

const TreatmentHistoryModal: React.FC<{
    toothId: string;
    history: { date: string; treatment: string; dentist: string }[];
    onClose: () => void;
}> = ({ toothId, history, onClose }) => {
    const { t } = useI18n();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
                <header className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-700">{t('dentalChart.treatmentHistoryTitle', {toothId: toothId})}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-4">
                    {history.length ? (
                        <div className="space-y-4">
                            {history.map((treatment, index) => (
                                <div key={index} className="p-3 border border-slate-200 rounded-lg">
                                    <p className="font-semibold">{treatment.treatment}</p>
                                    <p className="text-sm text-slate-600">{t('dentalChart.treatmentDate')}: {treatment.date}</p>
                                    <p className="text-sm text-slate-600">{t('dentalChart.treatmentBy')}: {treatment.dentist}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-600">{t('dentalChart.noTreatmentHistory')}</p>
                    )}
                </main>
            </div>
        </div>
    );
};

const ToothComponent: React.FC<{
    toothId: string;
    tooth: Tooth;
    onClick: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    isSelected?: boolean;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: () => void;
    onDoubleClick?: () => void;
}> = ({ toothId, tooth, onClick, onContextMenu, isSelected = false, onMouseEnter, onMouseLeave, onDoubleClick }) => {
    const { t } = useI18n();
    const number = toothId.replace(/[A-Z]/g, '');
    const { bg, border, text } = toothStatusColors[tooth.status];
    return (
        <div className="flex flex-col items-center">
            <button
                onClick={onClick}
                onContextMenu={onContextMenu}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onDoubleClick={onDoubleClick}
                className={`w-10 h-12 flex items-center justify-center border-2 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 shadow-sm ${bg} ${border} ${text} focus:outline-none focus:ring-2 focus:ring-primary-light ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 animate-pulse' : ''}`}
                style={{ clipPath: 'polygon(15% 0%, 85% 0%, 95% 15%, 100% 30%, 100% 100%, 0% 100%, 0% 30%, 5% 15%)' }}
                aria-label={t('dentalChart.toothAriaLabel', {toothId: toothId, status: t(`toothStatus.${tooth.status}`)})}
            >
                <span className="font-bold text-sm select-none">{number}</span>
            </button>
            <span className="text-xs mt-1">{toothStatusLabels[tooth.status]}</span>
        </div>
    );
};

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
                <header className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-700">{t('editToothModal.title', {toothId: toothId})}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-4 space-y-4">
                    <div>
                         <label htmlFor="toothStatus" className="block text-sm font-medium text-slate-600 dark:text-slate-400">{t('editToothModal.status')}</label>
                        <select
                            id="toothStatus"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ToothStatus)}
                             className="mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        >
                            {Object.values(ToothStatus).map(s => <option key={s} value={s}>{t(`toothStatus.${s}`)}</option>)}
                        </select>
                    </div>
                     <div>
                         <label htmlFor="toothNotes" className="block text-sm font-medium text-slate-600 dark:text-slate-400">{t('editToothModal.notes')}</label>
                        <textarea
                            id="toothNotes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-1 p-2 border border-slate-300 rounded-lg w-full h-24 focus:ring-primary focus:border-primary"
                            placeholder={t('editToothModal.addNotesPlaceholder')}
                        />
                    </div>
                </main>
                <footer className="p-4 bg-slate-50 dark:bg-slate-700 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400">{t('common.save')}</button>
                </footer>
            </div>
        </div>
    );
};

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
                <header className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-700">{t('bulkEditModal.title', {count: selectedTeeth.length})}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-4 space-y-4">
                    <div>
                         <label htmlFor="bulkStatus" className="block text-sm font-medium text-slate-600 dark:text-slate-400">{t('bulkEditModal.status')}</label>
                        <select
                            id="bulkStatus"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ToothStatus)}
                             className="mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        >
                            {Object.values(ToothStatus).map(s => <option key={s} value={s}>{t(`toothStatus.${s}`)}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor="bulkNotes" className="block text-sm font-medium text-slate-600 dark:text-slate-400">{t('bulkEditModal.notes')}</label>
                        <textarea
                            id="bulkNotes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-1 p-2 border border-slate-300 rounded-lg w-full h-24 focus:ring-primary focus:border-primary"
                            placeholder={t('bulkEditModal.addNotesPlaceholder')}
                        />
                    </div>
                </main>
                <footer className="p-4 bg-slate-50 dark:bg-slate-700 flex justify-end space-x-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400">{t('common.save')}</button>
                </footer>
            </div>
        </div>
    );
};

const Quadrant: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
    <div className={className}>
        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center">{title}</h4>
        <div className="flex justify-center gap-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex-wrap">
            {children}
        </div>
    </div>
);


interface DentalChartProps {
    chartData: DentalChartData;
    onUpdate: (newChartData: DentalChartData) => void;
    treatmentHistory?: Record<string, { date: string; treatment: string; dentist: string }[]>;
}

const DentalChart: React.FC<DentalChartProps> = ({ chartData, onUpdate, treatmentHistory = {} }) => {
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

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.2, 2));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.2, 0.6));
    };

    const handleMouseEnter = (toothId: string) => (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({ visible: true, toothId, x: rect.left + rect.width / 2, y: rect.top - 10 });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const handleExport = async () => {
        const chartElement = document.querySelector('.bg-neutral.p-4.rounded-lg') as HTMLElement;
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
            console.log('DentalChart: handleSaveTooth called with toothId:', selectedToothId, 'newTooth:', newTooth);
            console.log('DentalChart: newChartData:', newChartData);
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

    const upperRight = Array.from({ length: 8 }, (_, i) => `UR${8 - i}`);
    const upperLeft = Array.from({ length: 8 }, (_, i) => `UL${i + 1}`);
    const lowerLeft = Array.from({ length: 8 }, (_, i) => `LL${i + 1}`);
    const lowerRight = Array.from({ length: 8 }, (_, i) => `LR${8 - i}`);
    
    return (
        <div>
             <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 justify-center bg-neutral dark:bg-slate-900 p-3 rounded-lg shadow-sm">
                <button
                    onClick={() => {
                        setIsMultiSelectMode(!isMultiSelectMode);
                        setSelectedTeeth([]);
                        setSelectedToothId(null);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isMultiSelectMode
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                >
                    {isMultiSelectMode ? t('dentalChart.exitMultiSelect') : t('dentalChart.multiSelect')}
                </button>
                {isMultiSelectMode && selectedTeeth.length > 0 && (
                    <button
                        onClick={() => setIsBulkEditModalOpen(true)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        {t('dentalChart.bulkEdit')} ({selectedTeeth.length})
                    </button>
                )}
                <button
                    onClick={() => setIsCompactView(!isCompactView)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isCompactView
                            ? 'bg-purple-500 text-white hover:bg-purple-600'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                >
                    {isCompactView ? t('dentalChart.exitCompactView') : t('dentalChart.compactView')}
                </button>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                    {t('dentalChart.exportChart')}
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={handleZoomIn} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">+</button>
                    <button onClick={handleZoomOut} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">-</button>
                </div>
                {Object.entries(toothStatusColors).map(([status, { bg, border }]) => (
                    <div key={status} className="flex items-center text-xs text-slate-700">
                         <span className={`w-4 h-4 rounded me-2 ${bg} ${border} border`}></span>
                         <span className="text-slate-700 dark:text-slate-300">{t(`toothStatus.${status}`)}</span>
                    </div>
                ))}
            </div>

             <div className="bg-neutral dark:bg-slate-900 p-4 rounded-lg shadow-inner" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}>
                {isCompactView ? (
                    <div className="grid grid-cols-8 gap-2 justify-center">
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
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row md:justify-between gap-4">
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
                                    />
                                ))}
                            </Quadrant>
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
                                    />
                                ))}
                            </Quadrant>
                        </div>

                        <div className="flex flex-col md:flex-row md:justify-between gap-4">
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
                                     />
                                 ))}
                             </Quadrant>
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
                                     />
                                 ))}
                             </Quadrant>
                        </div>
                    </div>
                )}
            </div>

            {tooltip && tooltip.visible && (
                <div
                     className="fixed z-40 bg-black text-white dark:text-slate-200 text-xs rounded px-2 py-1 pointer-events-none"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
                >
                    <div>{t('toothStatus.' + safeChartData[tooltip.toothId].status)}</div>
                    {safeChartData[tooltip.toothId].notes && <div>{safeChartData[tooltip.toothId].notes}</div>}
                    {treatmentHistory[tooltip.toothId] && treatmentHistory[tooltip.toothId].length > 0 && (
                        <div>Last: {treatmentHistory[tooltip.toothId][0].treatment}</div>
                    )}
                </div>
            )}

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

export default DentalChart;
