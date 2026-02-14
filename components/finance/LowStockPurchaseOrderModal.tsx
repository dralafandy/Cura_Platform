import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { InventoryItem, Supplier, PurchaseOrderItem, PurchaseOrder, NotificationType } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import PurchaseOrderPrintable from './PurchaseOrderPrintable';
import { openPrintWindow } from '../../utils/print';

interface LowStockPurchaseOrderModalProps {
    clinicData: ClinicData;
    onClose: () => void;
    onDraftsSaved?: () => void;
}

const LowStockPurchaseOrderModal: React.FC<LowStockPurchaseOrderModalProps> = ({ clinicData, onClose, onDraftsSaved }) => {
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { suppliers, inventoryItems } = clinicData;

    // Filter low stock items
    const lowStockItems = useMemo(() => {
        return inventoryItems.filter(item => item.currentStock <= item.minStockLevel);
    }, [inventoryItems]);

    // Group items by supplier
    const itemsBySupplier = useMemo(() => {
        const grouped: Record<string, InventoryItem[]> = {};
        lowStockItems.forEach(item => {
            if (!grouped[item.supplierId]) {
                grouped[item.supplierId] = [];
            }
            grouped[item.supplierId].push(item);
        });
        return grouped;
    }, [lowStockItems]);

    // State for editable purchase order items
    const [purchaseOrderItems, setPurchaseOrderItems] = useState<Record<string, PurchaseOrderItem[]>>(() => {
        const initial: Record<string, PurchaseOrderItem[]> = {};
        Object.entries(itemsBySupplier).forEach(([supplierId, items]) => {
            initial[supplierId] = items.map(item => ({
                inventoryItemId: item.id,
                itemName: item.name,
                quantity: Math.max(1, item.minStockLevel - item.currentStock), // Calculate required quantity
                unitCost: item.unitCost,
                totalCost: Math.max(1, item.minStockLevel - item.currentStock) * item.unitCost
            }));
        });
        return initial;
    });

    // State for purchase order name
    const [purchaseOrderName, setPurchaseOrderName] = useState<string>(t('inventory.lowStockPurchaseOrder'));

    const handleQuantityChange = (supplierId: string, itemIndex: number, newQuantity: number) => {
        setPurchaseOrderItems(prev => {
            const updated = { ...prev };
            if (updated[supplierId]) {
                const updatedItems = [...updated[supplierId]];
                updatedItems[itemIndex] = {
                    ...updatedItems[itemIndex],
                    quantity: Math.max(0, newQuantity),
                    totalCost: Math.max(0, newQuantity) * updatedItems[itemIndex].unitCost
                };
                // Remove item if quantity is 0
                updated[supplierId] = updatedItems.filter(item => item.quantity > 0);
            }
            return updated;
        });
    };

    const handleRemoveItem = (supplierId: string, itemIndex: number) => {
        setPurchaseOrderItems(prev => {
            const updated = { ...prev };
            if (updated[supplierId]) {
                updated[supplierId] = updated[supplierId].filter((_, index) => index !== itemIndex);
            }
            return updated;
        });
    };

    const generatePurchaseOrders = () => {
        const purchaseOrders: PurchaseOrder[] = [];

        Object.entries(purchaseOrderItems).forEach(([supplierId, items]) => {
            if (items.length > 0) {
        const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
        const purchaseOrder: PurchaseOrder = {
            id: `PO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            name: purchaseOrderName || t('inventory.lowStockPurchaseOrder'), // Use user input or default
            supplierId,
            orderDate: new Date().toISOString().split('T')[0],
            status: 'draft',
            items,
            totalAmount,
            notes: 'Automatically generated from low stock report',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
                purchaseOrders.push(purchaseOrder);
            }
        });

        return purchaseOrders;
    };

    const handlePrintAll = () => {
        const purchaseOrders = generatePurchaseOrders();
        
        if (purchaseOrders.length === 0) {
            (addNotification as any)(t('purchaseOrder.noItemsToPrint'), NotificationType.WARNING);
            return;
        }

        // Print each purchase order
        purchaseOrders.forEach((order, index) => {
            const supplier = suppliers.find(s => s.id === order.supplierId);
            if (supplier) {
                const printableComponent = (
                    <PurchaseOrderPrintable
                        order={order}
                        supplier={supplier}
                        clinic={clinicData.clinicInfo}
                        items={order.items}
                    />
                );
                openPrintWindow(`طلبية شراء - ${supplier.name}`, printableComponent);
            }
        });

        (addNotification as any)(t('purchaseOrder.reportsPrinted', { count: purchaseOrders.length }), NotificationType.SUCCESS);
    };

    const handlePrintSupplier = (supplierId: string) => {
        const items = purchaseOrderItems[supplierId];
        if (!items || items.length === 0) {
            (addNotification as any)(t('purchaseOrder.noItemsForSupplier'), NotificationType.WARNING);
            return;
        }

        const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
        const purchaseOrder: PurchaseOrder = {
            id: `PO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            name: purchaseOrderName || t('inventory.lowStockPurchaseOrder'), // Use user input or default
            supplierId,
            orderDate: new Date().toISOString().split('T')[0],
            status: 'draft',
            items,
            totalAmount,
            notes: 'Automatically generated from low stock report',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) {
            const printableComponent = (
                <PurchaseOrderPrintable
                    order={purchaseOrder}
                    supplier={supplier}
                    clinic={clinicData.clinicInfo}
                    items={items}
                />
            );
            openPrintWindow(`طلبية شراء - ${supplier.name}`, printableComponent);
            (addNotification as any)(t('purchaseOrder.reportPrinted'), NotificationType.SUCCESS);
        }
    };

    const handleSaveDrafts = () => {
        const purchaseOrders = generatePurchaseOrders();
        
        if (purchaseOrders.length === 0) {
            (addNotification as any)(t('purchaseOrder.noItemsToSave'), NotificationType.WARNING);
            return;
        }

        const existingDrafts = JSON.parse(localStorage.getItem('purchaseOrders_drafts') || '[]');
        const updatedDrafts = [...existingDrafts, ...purchaseOrders];
        localStorage.setItem('purchaseOrders_drafts', JSON.stringify(updatedDrafts));
        
        (addNotification as any)(t('purchaseOrder.draftsSaved', { count: purchaseOrders.length }), NotificationType.SUCCESS);
        if (onDraftsSaved) onDraftsSaved();
        onClose();
    };

    const getSupplierName = (supplierId: string) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        return supplier?.name || t('common.unknownSupplier');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(value);
    };

    const totalItems = Object.values(purchaseOrderItems).reduce((sum, items) => sum + items.length, 0);
    const totalAmount = Object.values(purchaseOrderItems).reduce((sum, items) => 
        sum + items.reduce((itemSum, item) => itemSum + item.totalCost, 0), 0
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                {/* Header */}
                <header className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/30 dark:to-amber-900/20 flex-shrink-0">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
                            {t('inventory.lowStockPurchaseOrders')}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400">
                            {t('purchaseOrder.orderName')} {t('purchaseOrder.optional')}
                        </label>
                        <input
                            type="text"
                            value={purchaseOrderName}
                            onChange={(e) => setPurchaseOrderName(e.target.value)}
                            placeholder={t('purchaseOrder.orderNamePlaceholder')}
                            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        />
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
                    {/* Summary */}
                    <div className="bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/30 dark:to-amber-900/20 p-3 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-600">
                        <div className="flex justify-between items-center gap-2 sm:gap-4">
                            <div className="text-center">
                                <p className="text-[10px] sm:text-sm text-purple-700 dark:text-purple-400">{t('inventory.suppliersCount')}</p>
                                <p className="text-lg sm:text-2xl font-bold text-purple-800 dark:text-purple-300">{Object.keys(purchaseOrderItems).length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] sm:text-sm text-purple-700 dark:text-purple-400">{t('inventory.totalItems')}</p>
                                <p className="text-lg sm:text-2xl font-bold text-purple-800 dark:text-purple-300">{totalItems}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] sm:text-sm text-purple-700 dark:text-purple-400">{t('inventory.totalAmount')}</p>
                                <p className="text-sm sm:text-2xl font-bold text-purple-800 dark:text-purple-300">{formatCurrency(totalAmount)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Orders by Supplier */}
                    {Object.entries(purchaseOrderItems).map(([supplierId, items]) => {
                        if (items.length === 0) return null;
                        
                        const supplierTotal = items.reduce((sum, item) => sum + item.totalCost, 0);
                        
                        return (
                            <div key={supplierId} className="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-3 sm:p-4">
                                {/* Supplier Header */}
                                <div className="flex justify-between items-center mb-3 sm:mb-4 pb-2 border-b border-slate-200 dark:border-slate-600">
                                    <h3 className="text-sm sm:text-lg font-semibold text-purple-700 dark:text-purple-400 truncate">
                                        {getSupplierName(supplierId)}
                                    </h3>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                                            {formatCurrency(supplierTotal)}
                                        </span>
                                        <button
                                            onClick={() => handlePrintSupplier(supplierId)}
                                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            title={t('common.print')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0v1a2 2 0 002 2h6a2 2 0 002-2v-1M8 12h8m-8 4h.01M5 12h.01M19 12h.01M5 16h.01M19 16h.01" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="space-y-2 sm:space-y-3">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 dark:bg-slate-600 rounded-lg">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-slate-500 w-5 text-xs hidden sm:inline">{index + 1}</span>
                                                <span className="flex-1 text-sm text-slate-800 dark:text-slate-200 font-medium truncate">{item.itemName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(supplierId, index, parseInt(e.target.value) || 0)}
                                                    className="w-14 sm:w-16 md:w-20 p-1.5 sm:p-2 text-sm border border-slate-300 dark:border-slate-500 rounded-lg text-center focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-500 text-slate-800 dark:text-slate-200"
                                                />
                                                <span className="text-[10px] sm:text-xs md:text-sm text-purple-600 dark:text-purple-400 whitespace-nowrap">
                                                    {formatCurrency(item.unitCost)}
                                                </span>
                                                <span className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-bold whitespace-nowrap">
                                                    {formatCurrency(item.totalCost)}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveItem(supplierId, index)}
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
                            </div>
                        );
                    })}
                </main>

                {/* Footer */}
                <footer className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 bg-gray-50 dark:bg-slate-800/50 rounded-b-lg sm:rounded-b-xl">
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {totalItems} {t('purchaseOrder.orderItems').toLowerCase()}
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={handleSaveDrafts}
                            disabled={totalItems === 0}
                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            {t('purchaseOrder.saveDrafts')}
                        </button>
                        <button
                            onClick={handlePrintAll}
                            disabled={totalItems === 0}
                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0v1a2 2 0 002 2h6a2 2 0 002-2v-1M8 12h8m-8 4h.01M5 12h.01M19 12h.01M5 16h.01M19 16h.01" />
                            </svg>
                            {t('purchaseOrder.printAll')}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LowStockPurchaseOrderModal;
