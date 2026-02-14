import React, { useState, useMemo, useEffect } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { InventoryItem, Supplier, PurchaseOrderItem, PurchaseOrder, NotificationType } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';

const CreatePurchaseOrderModal: React.FC<{
    clinicData: ClinicData;
    onClose: () => void;
    onOrderCreated: (order: PurchaseOrder) => void;
    editingOrder?: PurchaseOrder | null;
}> = ({ clinicData, onClose, onOrderCreated, editingOrder }) => {
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { suppliers, inventoryItems } = clinicData;

    const [selectedSupplierId, setSelectedSupplierId] = useState<string>(editingOrder?.supplierId || '');
    const [orderDate, setOrderDate] = useState<string>(editingOrder?.orderDate || new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState<string>(editingOrder?.notes || '');
    const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>(editingOrder?.items || []);
    const [materialSearch, setMaterialSearch] = useState<string>('');
    const [isPrinting, setIsPrinting] = useState(false);
    const [orderName, setOrderName] = useState<string>('');

    const materialSuppliers = useMemo(() => 
        suppliers.filter(s => s.type === 'Material Supplier'),
        [suppliers]
    );

    const filteredMaterials = useMemo(() => {
        return inventoryItems.filter(item => {
            const matchesSupplier = !selectedSupplierId || item.supplierId === selectedSupplierId;
            const matchesSearch = !materialSearch || 
                item.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
                item.description?.toLowerCase().includes(materialSearch.toLowerCase());
            const notAlreadyAdded = !orderItems.some(oi => oi.inventoryItemId === item.id);
            return matchesSupplier && matchesSearch && notAlreadyAdded;
        });
    }, [inventoryItems, selectedSupplierId, materialSearch, orderItems]);

    const selectedSupplier = useMemo(() => 
        suppliers.find(s => s.id === selectedSupplierId),
        [suppliers, selectedSupplierId]
    );

    const totalAmount = useMemo(() => 
        orderItems.reduce((sum, item) => sum + item.totalCost, 0),
        [orderItems]
    );

    const handleAddItem = (item: InventoryItem) => {
        const newItem: PurchaseOrderItem = {
            inventoryItemId: item.id,
            itemName: item.name,
            quantity: 1,
            unitCost: item.unitCost || 0,
            totalCost: item.unitCost || 0
        };
        setOrderItems([...orderItems, newItem]);
        setMaterialSearch('');
    };

    const handleUpdateQuantity = (index: number, quantity: number) => {
        const updatedItems = [...orderItems];
        updatedItems[index].quantity = Math.max(1, quantity);
        updatedItems[index].totalCost = updatedItems[index].quantity * updatedItems[index].unitCost;
        setOrderItems(updatedItems);
    };

    const handleRemoveItem = (index: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const generateOrderId = () => {
        const prefix = orderName ? orderName.replace(/\s+/g, '-').substring(0, 10) : 'PO';
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    };

    const saveToDrafts = () => {
        const order: PurchaseOrder = {
            id: editingOrder?.id || generateOrderId(),
            supplierId: selectedSupplierId,
            orderDate,
            status: 'draft',
            items: orderItems,
            totalAmount,
            notes,
            createdAt: editingOrder?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const existingDrafts = JSON.parse(localStorage.getItem('purchaseOrders_drafts') || '[]');
        
        // Remove any existing draft with the same ID to avoid duplicates
        const filteredDrafts = existingDrafts.filter((d: PurchaseOrder) => d.id !== order.id);
        
        // Add the new/updated order
        const updatedDrafts = [...filteredDrafts, order];
        
        localStorage.setItem('purchaseOrders_drafts', JSON.stringify(updatedDrafts));
        (addNotification as any)(t('purchaseOrder.draftSaved'), NotificationType.SUCCESS);
        onOrderCreated(order);
        onClose();
    };

    const handleSend = () => {
        if (orderItems.length === 0) {
            (addNotification as any)(t('purchaseOrder.emptyOrder'), NotificationType.WARNING);
            return;
        }

        const order: PurchaseOrder = {
            id: editingOrder?.id || generateOrderId(),
            supplierId: selectedSupplierId,
            orderDate,
            status: 'sent',
            items: orderItems,
            totalAmount,
            notes,
            createdAt: editingOrder?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Remove from drafts if editing a draft
        if (editingOrder?.status === 'draft') {
            const existingDrafts = JSON.parse(localStorage.getItem('purchaseOrders_drafts') || '[]');
            const updatedDrafts = existingDrafts.filter((d: PurchaseOrder) => d.id !== editingOrder.id);
            localStorage.setItem('purchaseOrders_drafts', JSON.stringify(updatedDrafts));
        }

        (addNotification as any)(t('purchaseOrder.orderSent'), NotificationType.SUCCESS);
        onOrderCreated(order);
        onClose();
    };

    const handlePrint = () => {
        if (orderItems.length === 0) {
            (addNotification as any)(t('purchaseOrder.emptyOrder'), NotificationType.WARNING);
            return;
        }

        const order: PurchaseOrder = {
            id: editingOrder?.id || generateOrderId(),
            supplierId: selectedSupplierId,
            orderDate,
            status: 'draft',
            items: orderItems,
            totalAmount,
            notes,
            createdAt: editingOrder?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setIsPrinting(true);
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${t('purchaseOrder.orderTitle')}</title>
                        <style>
                            body { font-family: Arial, sans-serif; direction: rtl; }
                            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                            th { background-color: #7c3aed; color: white; }
                            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
                            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                            .supplier-info { background: #f5f5f5; padding: 10px; border-radius: 5px; }
                            @media print {
                                .no-print { display: none; }
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
                                font-family: Arial, sans-serif;
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
                            
                            @media print {
                                .close-button-container {
                                    display: none !important;
                                }
                            }
                            
                            @media (max-width: 640px) {
                                .close-button-container {
                                    padding: 16px;
                                }
                                .close-button {
                                    padding: 12px 20px;
                                    font-size: 16px;
                                }
                            }
                        </style>
                    </head>
                    <body style="padding-top: 80px;">
                        <!-- Close Button - Visible only on screen, hidden when printing -->
                        <div class="close-button-container">
                            <button onclick="window.close()" class="close-button" aria-label="إغلاق التقرير">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                <span>إغلاق</span>
                            </button>
                        </div>
                        <div class="header">

                            <div>
                                <h1>${t('purchaseOrder.orderTitle')}</h1>
                                ${editingOrder ? `<p style="color: #7c3aed;">مسودة - Draft</p>` : ''}
                            </div>
                            <div class="supplier-info">
                                <h3>${t('purchaseOrder.selectSupplier')}</h3>
                                <p><strong>${selectedSupplier?.name || ''}</strong></p>
                                <p>${selectedSupplier?.contact_person || ''}</p>
                                <p>${selectedSupplier?.phone || ''}</p>
                                <p>${t('purchaseOrder.orderDate')}: ${orderDate}</p>
                            </div>
                        </div>
                        <h3>${t('purchaseOrder.orderItems')}</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>${t('inventory.itemName')}</th>
                                    <th>${t('purchaseOrder.quantity')}</th>
                                    <th>${t('purchaseOrder.unitCost')}</th>
                                    <th>${t('purchaseOrder.totalCost')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orderItems.map((item, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${item.itemName}</td>
                                        <td>${item.quantity}</td>
                                        <td>${item.unitCost.toFixed(2)}</td>
                                        <td>${item.totalCost.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="4" style="text-align: left; font-weight: bold;">${t('purchaseOrder.totalAmount')}</td>
                                    <td style="font-weight: bold;">${totalAmount.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        ${notes ? `<div style="margin-top: 20px;"><strong>${t('purchaseOrder.notes')}:</strong><p>${notes}</p></div>` : ''}
                        <div class="no-print" style="margin-top: 20px; text-align: center;">
                            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                                ${t('common.print')}
                            </button>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            
            printWindow.onload = () => {
                printWindow.print();
            };
        }

        setIsPrinting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                <header className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/30 dark:to-amber-900/20 flex-shrink-0">
                    <h2 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
                        {editingOrder ? t('purchaseOrder.editDraft') : t('purchaseOrder.createOrder')}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
                    {/* Order Name (for draft identification) */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400 mb-1.5 sm:mb-2">
                            {t('purchaseOrder.orderName')} ({t('purchaseOrder.optional')})
                        </label>
                        <input
                            type="text"
                            value={orderName}
                            onChange={(e) => setOrderName(e.target.value)}
                            placeholder={t('purchaseOrder.orderNamePlaceholder')}
                            className="p-2 text-sm border border-purple-200 dark:border-purple-600 rounded-lg w-full focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    {/* Supplier Selection */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400 mb-1.5 sm:mb-2">
                            {t('purchaseOrder.selectSupplier')} *
                        </label>
                        <select
                            value={selectedSupplierId}
                            onChange={(e) => setSelectedSupplierId(e.target.value)}
                            className="p-2 text-sm border border-purple-200 dark:border-purple-600 rounded-lg w-full focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        >
                            <option value="">{t('purchaseOrder.selectSupplier')}</option>
                            {materialSuppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Order Date */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400 mb-1.5 sm:mb-2">
                            {t('purchaseOrder.orderDate')}
                        </label>
                        <input
                            type="date"
                            value={orderDate}
                            onChange={(e) => setOrderDate(e.target.value)}
                            className="p-2 text-sm border border-purple-200 dark:border-purple-600 rounded-lg w-full focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    {/* Material Search & Add */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400 mb-1.5 sm:mb-2">
                            {t('purchaseOrder.addMaterial')}
                        </label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zm0 1l-10 9m10-9l10 9m-10-9v10" />
                            </svg>
                            <input
                                type="text"
                                placeholder={t('purchaseOrder.searchMaterial')}
                                value={materialSearch}
                                onChange={(e) => setMaterialSearch(e.target.value)}
                                className="w-full pl-4 pr-10 p-2 text-sm border border-purple-200 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                        
                        {materialSearch && filteredMaterials.length > 0 && (
                            <div className="mt-2 bg-white dark:bg-slate-700 border border-purple-200 dark:border-purple-600 rounded-lg shadow-lg max-h-40 sm:max-h-48 overflow-y-auto">
                                {filteredMaterials.slice(0, 5).map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleAddItem(item)}
                                        className="w-full text-right px-3 sm:px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex justify-between items-center"
                                    >
                                        <span className="text-sm text-slate-800 dark:text-slate-200">{item.name}</span>
                                        <span className="text-xs text-purple-600 dark:text-purple-400">
                                            {t('purchaseOrder.currentStock')}: {item.currentStock}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    {orderItems.length > 0 && (
                        <div>
                            <h3 className="text-sm sm:text-lg font-semibold text-purple-700 dark:text-purple-400 mb-2 sm:mb-3">
                                {t('purchaseOrder.orderItems')}
                            </h3>
                            <div className="space-y-2">
                                {orderItems.map((item, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-slate-500 w-5 text-xs sm:text-sm">{index + 1}</span>
                                            <span className="flex-1 text-sm text-slate-800 dark:text-slate-200 font-medium truncate">{item.itemName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 justify-end">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                                                className="w-14 sm:w-20 p-1.5 sm:p-2 text-sm border border-purple-200 dark:border-purple-600 rounded-lg text-center focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
                                            />
                                            <span className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 w-16 sm:w-24 text-left">
                                                {item.unitCost.toFixed(2)}
                                            </span>
                                            <span className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-bold w-20 sm:w-28 text-left">
                                                {item.totalCost.toFixed(2)}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveItem(index)}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex justify-between items-center">
                                <span className="text-sm sm:text-lg font-bold text-purple-700 dark:text-purple-400">
                                    {t('purchaseOrder.totalAmount')}
                                </span>
                                <span className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                                    {new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(totalAmount)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400 mb-1.5 sm:mb-2">
                            {t('purchaseOrder.notes')}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('purchaseOrder.notesPlaceholder')}
                            className="w-full p-2 text-sm border border-purple-200 dark:border-purple-600 rounded-lg h-16 sm:h-20 focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        />
                    </div>
                </main>

                <footer className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 bg-gray-50 dark:bg-slate-800/50 rounded-b-lg sm:rounded-b-xl">
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {orderItems.length} {t('purchaseOrder.orderItems').toLowerCase()}
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={saveToDrafts}
                            disabled={!selectedSupplierId}
                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span className="hidden sm:inline">{t('purchaseOrder.saveDraft')}</span>
                            <span className="sm:hidden">{t('purchaseOrder.saveDraft')}</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={orderItems.length === 0 || isPrinting || !selectedSupplierId}
                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0v1a2 2 0 002 2h6a2 2 0 002-2v-1M8 12h8m-8 4h.01M5 12h.01M19 12h.01M5 16h.01M19 16h.01" />
                            </svg>
                            <span className="hidden sm:inline">{t('purchaseOrder.printOrder')}</span>
                            <span className="sm:hidden">{t('common.print')}</span>
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={orderItems.length === 0 || !selectedSupplierId}
                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span className="hidden sm:inline">{t('purchaseOrder.sendOrder')}</span>
                            <span className="sm:hidden">{t('purchaseOrder.sendOrder')}</span>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CreatePurchaseOrderModal;
