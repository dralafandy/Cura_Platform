import React, { useState, useMemo, useEffect } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { InventoryItem, NotificationType, Supplier, PurchaseOrder, Permission } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getAllMaterials, DentalMaterial, getMaterialCategories, getMaterialsByCategory } from '../../utils/dentalMaterials';
import CreatePurchaseOrderModal from './CreatePurchaseOrderModal';
import LowStockPurchaseOrderModal from './LowStockPurchaseOrderModal';

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zm0 1l-10 9m10-9l10 9m-10-9v10" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7m0 14l7-7 7 7" /></svg>;

const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const DatabaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;

const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

// Inventory Item Card Component
const InventoryItemCard: React.FC<{
    item: InventoryItem;
    supplier?: Supplier;
    status: { label: string; class: string };
    onEdit: () => void;
    onDelete: () => void;
    onQuickStockUpdate: (item: InventoryItem, adjustment: number) => void;
    getStockPercentage: (item: InventoryItem) => number;
    getStockColor: (item: InventoryItem) => string;
    canEdit?: boolean;
    canDelete?: boolean;
}> = ({ item, supplier, status, onEdit, onDelete, onQuickStockUpdate, getStockPercentage, getStockColor, canEdit = true, canDelete = true }) => {
    const { t, locale } = useI18n();
    const { isDark } = useTheme();
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    
    const stockPercentage = getStockPercentage(item);
    const stockColor = getStockColor(item);
    const totalValue = item.currentStock * item.unitCost;

    return (
        <div className={`group relative rounded-xl border transition-all duration-200 hover:shadow-lg ${isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
            {/* Status indicator bar */}
            <div className={`h-1 rounded-t-xl ${stockColor} transition-all duration-300`} style={{ width: `${stockPercentage}%` }} />
            
            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-base truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            {item.name}
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate mt-0.5`}>
                            {item.description || t('common.na')}
                        </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${status.class}`}>
                        {status.label}
                    </span>
                </div>
                
                {/* Supplier info */}
                <div className="flex items-center gap-1.5 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {supplier?.name || t('inventory.supplierNotAvailable')}
                    </span>
                </div>
                
                {/* Stock level with progress bar */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {t('inventory.currentStock')}
                        </span>
                        <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {item.currentStock}
                        </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${stockColor}`}
                            style={{ width: `${stockPercentage}%` }}
                        />
                    </div>
                    {item.minStockLevel > 0 && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {t('inventory.minStockLevel')}: {item.minStockLevel}
                        </p>
                    )}
                </div>
                
                {/* Footer with price and actions */}
                <div className="flex items-center justify-between pt-3 border-t border-dashed ${isDark ? 'border-slate-700' : 'border-slate-200'}">
                    <div className="flex flex-col">
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {t('inventory.unitCost')}
                        </span>
                        <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                            {currencyFormatter.format(item.unitCost)}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Quick stock adjustment buttons */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                            <button
                                onClick={() => onQuickStockUpdate(item, -1)}
                                disabled={item.currentStock <= 0}
                                className={`p-1.5 rounded-md transition-all ${isDark ? 'hover:bg-slate-600 disabled:hover:bg-transparent text-slate-400 disabled:text-slate-600' : 'hover:bg-white hover:shadow-sm disabled:hover:bg-transparent text-slate-600 disabled:text-slate-300'} disabled:cursor-not-allowed`}
                                title={t('inventory.decreaseStock')}
                            >
                                <MinusIcon />
                            </button>
                            
                            {/* Note for adding stock - recommend supplier invoice */}
                            <div className="relative group">
                                <button
                                    onClick={() => onQuickStockUpdate(item, 1)}
                                    className={`p-1.5 rounded-md transition-all ${isDark ? 'hover:bg-slate-600 bg-slate-700 text-white' : 'hover:bg-white hover:shadow-sm bg-white text-slate-700'} disabled:cursor-not-allowed`}
                                    title={t('inventory.increaseStock')}
                                >
                                    <PlusIcon />
                                </button>
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 right-0 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {t('inventory.addItemNote')}
                                </div>
                            </div>
                        </div>
                        
                        {/* Small note below buttons */}
                        <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-1 text-center leading-tight">
                            {t('inventory.addItemNote')}
                        </div>
                        
                        <button
                            onClick={onEdit}
                            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-700 text-purple-400 hover:text-purple-300' : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'}`}
                            title={t('inventory.editItem')}
                        >
                            <EditIcon />
                        </button>
                        {canDelete && (
                            <button
                                onClick={onDelete}
                                className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300' : 'hover:bg-red-50 text-red-500 hover:text-red-600'}`}
                                title={t('inventory.deleteItem')}
                            >
                                <TrashIcon />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Total value badge */}
                <div className="mt-2 flex justify-end">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                        {t('inventory.totalValue')}: {currencyFormatter.format(totalValue)}
                    </span>
                </div>
            </div>
        </div>
    );
};

const AddEditInventoryItemModal: React.FC<{
    item?: InventoryItem;
    onClose: () => void;
    onSave: (item: Omit<InventoryItem, 'id'> | InventoryItem) => void;
    suppliers: Supplier[];
}> = ({ item, onClose, onSave, suppliers }) => {
    const { t } = useI18n();
    const { isDark } = useTheme();
    const [formData, setFormData] = useState<Omit<InventoryItem, 'id'> | InventoryItem>(
        item || { name: '', description: '', supplierId: '', currentStock: 0, unitCost: 0, minStockLevel: 5 }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'currentStock' || name === 'unitCost' || name === 'minStockLevel') {
            const parsedValue = parseFloat(value);
            setFormData({ ...formData, [name]: isNaN(parsedValue) ? 0 : parsedValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate required fields
        if (!formData.name || !formData.supplierId) {
            alert('Name and supplier are required');
            return;
        }
        // Validate numeric fields
        if (formData.currentStock < 0 || formData.unitCost < 0 || formData.minStockLevel < 0) {
            alert('Stock levels and costs cannot be negative');
            return;
        }
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-md`}>
                <header className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'} flex justify-between items-center`}>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>{item ? t('inventory.editItem') : t('inventory.addNewItem')}</h2>
                    <button onClick={onClose} className={`p-1 rounded-full ${isDark ? 'hover:bg-slate-700 focus:ring-slate-600' : 'hover:bg-slate-200 focus:ring-slate-300'} transition-colors focus:outline-none focus:ring-2`} aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <label htmlFor="item-name" className="sr-only">{t('inventory.itemName')}</label>
                    <input id="item-name" name="name" value={formData.name} onChange={handleChange} placeholder={t('inventory.itemName')} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-primary' : 'border-slate-300 focus:border-primary'} rounded-lg w-full focus:ring-primary`} required />
                    
                    <label htmlFor="item-description" className="sr-only">{t('inventory.description')}</label>
                    <textarea id="item-description" name="description" value={formData.description} onChange={handleChange} placeholder={t('inventory.descriptionPlaceholder')} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-primary' : 'border-slate-300 focus:border-primary'} rounded-lg w-full h-20 focus:ring-primary`} />
                    
                    <div>
                        <label htmlFor="item-supplier" className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-1`}>{t('inventory.supplier')}</label>
                        <select id="item-supplier" name="supplierId" value={formData.supplierId} onChange={handleChange} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-primary' : 'border-slate-300 focus:border-primary'} rounded-lg w-full focus:ring-primary`} required>
                            <option value="">{t('inventory.selectSupplier')}</option>
                            {suppliers.filter(s => s.type === 'Material Supplier').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="currentStock" className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-1`}>{t('inventory.currentStock')}</label>
                            <input id="currentStock" name="currentStock" type="number" value={formData.currentStock} onChange={handleChange} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-primary' : 'border-slate-300 focus:border-primary'} rounded-lg w-full focus:ring-primary`} required />
                        </div>
                        <div>
                            <label htmlFor="unitCost" className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-1`}>{t('inventory.unitCost')}</label>
                            <input id="unitCost" name="unitCost" type="number" step="0.01" value={formData.unitCost} onChange={handleChange} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-primary' : 'border-slate-300 focus:border-primary'} rounded-lg w-full focus:ring-primary`} required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="minStockLevel" className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-1`}>{t('inventory.minStockLevel')}</label>
                        <input id="minStockLevel" name="minStockLevel" type="number" value={formData.minStockLevel} onChange={handleChange} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-primary' : 'border-slate-300 focus:border-primary'} rounded-lg w-full focus:ring-primary`} required />
                    </div>
                    <div>
                        <label htmlFor="expiryDate" className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-1`}>{t('inventory.expiryDate')}</label>
                        <input id="expiryDate" name="expiryDate" type="date" value={formData.expiryDate || ''} onChange={handleChange} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-primary' : 'border-slate-300 focus:border-primary'} rounded-lg w-full focus:ring-primary`} />
                    </div>

                    <footer className="pt-2 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className={`px-4 py-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 focus:ring-slate-500 text-white' : 'bg-neutral-dark hover:bg-slate-300 focus:ring-slate-300'} rounded-lg focus:outline-none focus:ring-2`}>{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('common.save')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const InventoryManagement: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { inventoryItems, addInventoryItem, updateInventoryItem, suppliers } = clinicData;
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { isDark } = useTheme();
    const auth = useAuth();
    const hasPermission = (permission: Permission): boolean => {
        const checkFn = auth?.hasPermission || auth?.checkPermission;
        return checkFn ? checkFn(permission) : false;
    };
    
    const canAddInventory = hasPermission(Permission.INVENTORY_MANAGE);
    const canEditInventory = hasPermission(Permission.INVENTORY_MANAGE);
    const canDeleteInventory = hasPermission(Permission.INVENTORY_MANAGE);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
    const [isAddingPreset, setIsAddingPreset] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
    const [draftOrders, setDraftOrders] = useState<PurchaseOrder[]>([]);
    const [showDrafts, setShowDrafts] = useState(false);
    const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
    const [draftsNeedRefresh, setDraftsNeedRefresh] = useState(false);

    // Load draft orders from localStorage and remove duplicates
    useEffect(() => {
        const savedDrafts = localStorage.getItem('purchaseOrders_drafts');
        if (savedDrafts || draftsNeedRefresh) {
            try {
                const parsedDrafts = savedDrafts ? JSON.parse(savedDrafts) : [];
                // Remove duplicates based on ID
                const uniqueDrafts = parsedDrafts.filter((order: PurchaseOrder, index: number, self: PurchaseOrder[]) => 
                    index === self.findIndex((o) => o.id === order.id)
                );
                setDraftOrders(uniqueDrafts);
                // Save back to localStorage to clean up
                localStorage.setItem('purchaseOrders_drafts', JSON.stringify(uniqueDrafts));
                // Auto-show drafts when refreshed
                if (uniqueDrafts.length > 0) {
                    setShowDrafts(true);
                }
            } catch (e) {
                console.error('Failed to parse draft orders:', e);
            }
        }
        setDraftsNeedRefresh(false);
    }, [draftsNeedRefresh]);

    const categories = getMaterialCategories();

    // Category Dropdown Component
    const CategoryDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className={`flex items-center gap-2 p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-primary' : 'border-slate-300 bg-white focus:border-primary'} rounded-lg focus:ring-primary`}
                >
                    <span>{selectedCategory === 'all' ? t('inventory.allCategories') : (t(`inventory.category.${selectedCategory}`) || selectedCategory)}</span>
                    <ChevronDownIcon />
                </button>
                {isCategoryDropdownOpen && (
                    <div className={`absolute top-full left-0 mt-1 w-56 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'} border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto`}>
                        <button
                            onClick={() => { setSelectedCategory('all'); setIsCategoryDropdownOpen(false); onClose(); }}
                            className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100'} flex items-center justify-between`}
                        >

                            <span>{t('inventory.allCategories')}</span>
                        </button>
                        {categories.map(category => {
                            const categoryItems = filteredItems.filter(item => {
                                const presetMaterials = getMaterialsByCategory(category);
                                return presetMaterials.some(mat => mat.name.toLowerCase() === item.name.toLowerCase());
                            });
                            const count = categoryItems.length;
                            return (
                                <button
                                    key={category}
                                    onClick={() => { setSelectedCategory(category); setIsCategoryDropdownOpen(false); onClose(); }}
                                    className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100'} flex items-center justify-between`}
                                >

                                    <span>{t(`inventory.category.${category}`) || category}</span>
                                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({count})</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

    // Filter inventory items based on search term and category
    const filteredItems = useMemo(() => {
        return inventoryItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               item.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' ||
                                  categories.some(cat => {
                                      const categoryMaterials = getMaterialsByCategory(cat);
                                      return categoryMaterials.some(mat => mat.name.toLowerCase() === item.name.toLowerCase());
                                  });
            return matchesSearch && matchesCategory;
        });
    }, [inventoryItems, searchTerm, selectedCategory, categories]);

    const handleAddPresetMaterials = async () => {
        if (!confirm(t('inventory.confirmAddPresetMaterials'))) return;

        // Find a default material supplier
        const defaultSupplier = suppliers.find(s => s.type === 'Material Supplier');
        if (!defaultSupplier) {
            alert(t('inventory.noMaterialSupplier'));
            return;
        }

        setIsAddingPreset(true);
        let addedCount = 0;
        let skippedCount = 0;

        try {
            const allMaterials = getAllMaterials();

            for (const material of allMaterials) {
                // Check if material already exists
                const exists = inventoryItems.some(item =>
                    item.name.toLowerCase() === material.name.toLowerCase()
                );

                if (!exists) {
                    await addInventoryItem({
                        name: material.name,
                        description: material.description,
                        supplierId: defaultSupplier.id,
                        currentStock: 0,
                        unitCost: material.unitCost,
                        minStockLevel: material.minStockLevel,
                    });
                    addedCount++;
                } else {
                    skippedCount++;
                }
            }

            addNotification({
                message: t('inventory.presetMaterialsAdded', { added: addedCount, skipped: skippedCount }),
                type: NotificationType.SUCCESS
            });
        } catch (error) {
            console.error('Error adding preset materials:', error);
            addNotification({
                message: t('inventory.errorAddingPresetMaterials'),
                type: NotificationType.ERROR
            });
        } finally {
            setIsAddingPreset(false);
        }
    };

    const handleSaveItem = (item: Omit<InventoryItem, 'id'> | InventoryItem) => {
        if ('id' in item && item.id) {
            updateInventoryItem(item as InventoryItem);
            addNotification({
                message: t('notifications.inventoryItemUpdated'),
                type: NotificationType.SUCCESS
            });
        } else {
            addInventoryItem(item as Omit<InventoryItem, 'id'>);
            addNotification({
                message: t('notifications.inventoryItemAdded'),
                type: NotificationType.SUCCESS
            });
        }
        setEditingItem(undefined);
        setIsAddModalOpen(false);
    };

    const getStatus = (item: InventoryItem) => {
        if (item.currentStock <= 0) return { label: t('inventoryStatus.outOfStock'), class: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700' };
        if (item.currentStock <= item.minStockLevel) return { label: t('inventoryStatus.lowStock'), class: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700' };
        if (item.expiryDate) {
            const expiry = new Date(item.expiryDate);
            const now = new Date();
            const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000; // rough 3 months in ms
            if (expiry.getTime() < now.getTime()) return { label: t('inventoryStatus.expired'), class: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700' };
            if (expiry.getTime() - now.getTime() < threeMonths) return { label: t('inventoryStatus.expiresSoon'), class: isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700' };
        }
        return { label: t('inventoryStatus.ok'), class: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700' };
    };

    // Calculate stats
    const totalItems = inventoryItems.length;
    const totalValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
    const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minStockLevel && item.currentStock > 0).length;
    const outOfStockItems = inventoryItems.filter(item => item.currentStock <= 0).length;

    // Filter items
    const sortedAndFilteredItems = filteredItems;

    const handleQuickStockUpdate = async (item: InventoryItem, adjustment: number) => {
        const newStock = Math.max(0, item.currentStock + adjustment);
        await updateInventoryItem({ ...item, currentStock: newStock });
        addNotification({
            message: t('inventory.stockUpdated', { name: item.name, adjustment: adjustment > 0 ? `+${adjustment}` : adjustment }),
            type: NotificationType.SUCCESS
        });
    };

    const handleDeleteItem = async (item: InventoryItem) => {
        if (confirm(t('inventory.confirmDelete', { name: item.name }))) {
            try {
                await clinicData.deleteInventoryItem(item.id);
                addNotification({
                    message: t('inventory.itemDeleted', { name: item.name }),
                    type: NotificationType.SUCCESS
                });
            } catch (error) {
                console.error('Error deleting item:', error);
                addNotification({
                    message: t('inventory.errorDeletingItem'),
                    type: NotificationType.ERROR
                });
            }
        }
    };

    const getStockPercentage = (item: InventoryItem) => {
        const maxStock = Math.max(item.currentStock, item.minStockLevel * 3, 10);
        return Math.min(100, (item.currentStock / maxStock) * 100);
    };

    const getStockColor = (item: InventoryItem) => {
        if (item.currentStock <= 0) return 'bg-red-500';
        if (item.currentStock <= item.minStockLevel) return 'bg-amber-500';
        return 'bg-green-500';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Modern Header with Stats - Gold + Purple Theme */}
                <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-6 mb-6">
                    {/* Decorative gradient bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-purple-500 to-purple-700"></div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">{t('inventory.inventoryItems')}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('inventory.inventoryManagement')} - {totalItems} {t('inventory.items')}</p>
                            </div>
                        </div>
                        
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{t('inventory.totalItems')}</p>
                                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{totalItems}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/30 p-4 rounded-xl border border-amber-200 dark:border-amber-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="1" x2="12" y2="23" />
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{t('inventory.totalValue')}</p>
                                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">{currencyFormatter.format(totalValue)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/30 dark:to-rose-800/30 p-4 rounded-xl border border-rose-200 dark:border-rose-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" />
                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{t('inventory.lowStockItems')}</p>
                                        <p className="text-2xl font-bold text-rose-900 dark:text-rose-300">{lowStockItems}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Draft Orders Section */}
                {draftOrders.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-700 shadow-lg overflow-hidden">
                        <button
                            onClick={() => setShowDrafts(!showDrafts)}
                            className="w-full px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 flex justify-between items-center"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                        {t('purchaseOrder.draftOrders')}
                                    </h3>
                                    <p className="text-sm text-amber-600 dark:text-amber-500">
                                        {draftOrders.length} {t('purchaseOrder.draftOrders').toLowerCase()}
                                    </p>
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-amber-600 dark:text-amber-400 transition-transform ${showDrafts ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        {showDrafts && (
                            <div className="p-4 space-y-3 bg-white dark:bg-slate-800">
                                {draftOrders
                                    .filter((order, index, self) => 
                                        index === self.findIndex((o) => o.id === order.id)
                                    )
                                    .map((order) => {
                                    const supplier = suppliers.find(s => s.id === order.supplierId);
                                    return (
                                        <div key={order.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700 gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-amber-800 dark:text-amber-300 truncate">
                                                    {order.name || order.id.slice(-8).toUpperCase()}
                                                </p>
                                                <p className="text-sm text-amber-600 dark:text-amber-500">
                                                    {supplier?.name || t('common.unknownSupplier')} • {order.items.length} {t('purchaseOrder.orderItems').toLowerCase()}
                                                </p>
                                                <p className="text-xs text-amber-500 dark:text-amber-600">
                                                    {new Date(order.orderDate).toLocaleDateString('ar-EG')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                                    {new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }).format(order.totalAmount)}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setEditingOrder(order);
                                                        setIsPurchaseOrderModalOpen(true);
                                                    }}
                                                    className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
                                                    title={t('common.edit')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(t('purchaseOrder.confirmDeleteDraft'))) {
                                                            // Remove duplicates first, then filter
                                                            const uniqueDrafts = draftOrders.filter((d: PurchaseOrder, index: number, self: PurchaseOrder[]) => 
                                                                index === self.findIndex((o) => o.id === d.id)
                                                            );
                                                            const updatedDrafts = uniqueDrafts.filter((d: PurchaseOrder) => d.id !== order.id);
                                                            localStorage.setItem('purchaseOrders_drafts', JSON.stringify(updatedDrafts));
                                                            setDraftOrders(updatedDrafts);
                                                            addNotification({
                                                                message: t('purchaseOrder.draftDeleted'),
                                                                type: NotificationType.SUCCESS
                                                            });
                                                        }
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                                    title={t('purchaseOrder.deleteDraft')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Controls Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <div className={`absolute top-1/2 transform -translate-y-1/2 text-slate-400 ${locale === 'ar' ? 'left-3' : 'right-3'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder={t('inventory.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200 ${locale === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                            />
                        </div>
                        
                        {/* Action Buttons Group */}
                        <div className="flex flex-wrap gap-2 items-center">
                            {canAddInventory && (
                                <button
                                    onClick={() => { setEditingItem(undefined); setIsAddModalOpen(true); }}
                                    className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
                                >
                                    <AddIcon />
                                    <span className="text-sm font-medium">{t('inventory.addItem')}</span>
                                </button>
                            )}
                            
                            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            
                            <button
                                onClick={() => setIsPurchaseOrderModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm"
                                title={t('inventory.manualOrder')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </button>
                            
                            <button
                                onClick={() => setIsLowStockModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-sm"
                                title={t('inventory.lowStockPurchaseOrder')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </button>
                            
                            <button
                                onClick={handleAddPresetMaterials}
                                disabled={isAddingPreset}
                                className="flex items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
                            >
                                <DatabaseIcon />
                                <span className="text-sm font-medium">{isAddingPreset ? t('inventory.addingPresetMaterials') : t('inventory.addPresetMaterials')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            
            {/* Inventory Items Grid */}
            <div className="space-y-4">
                {sortedAndFilteredItems.length === 0 ? (
                    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm`}>
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'} mb-2`}>
                            {searchTerm || selectedCategory !== 'all' ? t('inventory.noItemsFound') : t('inventory.noItemsAdded')}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-4`}>
                            {searchTerm || selectedCategory !== 'all' ? t('inventory.tryDifferentSearch') : t('inventory.startAddingItems')}
                        </p>
                        {(!searchTerm && selectedCategory === 'all') && canAddInventory && (
                            <button
                                onClick={() => { setEditingItem(undefined); setIsAddModalOpen(true); }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                <AddIcon /> {t('inventory.addFirstItem')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Results count */}
                        <div className="flex justify-between items-center text-sm">
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {t('inventory.showingResults', { count: sortedAndFilteredItems.length, total: filteredItems.length })}
                            </p>
                        </div>
                    
                        {selectedCategory === 'all' ? (
                            // Show all items in enhanced cards
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {sortedAndFilteredItems.map(item => (
                                    <InventoryItemCard
                                        key={item.id}
                                        item={item}
                                        supplier={suppliers.find(s => s.id === item.supplierId)}
                                        status={getStatus(item)}
                                        onEdit={() => { setEditingItem(item); setIsAddModalOpen(true); }}
                                        onDelete={() => handleDeleteItem(item)}
                                        onQuickStockUpdate={handleQuickStockUpdate}
                                        getStockPercentage={getStockPercentage}
                                        getStockColor={getStockColor}
                                        canEdit={canEditInventory}
                                        canDelete={canDeleteInventory}
                                    />
                                ))}
                            </div>
                        ) : (
                            // Show items grouped by category
                            <div className="space-y-6">
                                {categories.map(category => {
                                    const categoryItems = sortedAndFilteredItems.filter(item => {
                                        const presetMaterials = getMaterialsByCategory(category);
                                        return presetMaterials.some(mat => mat.name.toLowerCase() === item.name.toLowerCase());
                                    });

                                    if (categoryItems.length === 0) return null;

                                    return (
                                        <div key={category} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                            <div className={`px-4 py-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                                <h4 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                                                    <span className="inline-flex items-center gap-2">
                                                        <span>{t(`inventory.category.${category}`) || category}</span>
                                                        <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                                            {categoryItems.length}
                                                        </span>
                                                    </span>
                                                </h4>
                                            </div>
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                {categoryItems.map(item => (
                                                    <InventoryItemCard
                                                        key={item.id}
                                                        item={item}
                                                        supplier={suppliers.find(s => s.id === item.supplierId)}
                                                        status={getStatus(item)}
                                                        onEdit={() => { setEditingItem(item); setIsAddModalOpen(true); }}
                                                        onDelete={() => handleDeleteItem(item)}
                                                        onQuickStockUpdate={handleQuickStockUpdate}
                                                        getStockPercentage={getStockPercentage}
                                                        getStockColor={getStockColor}
                                                        canEdit={canEditInventory}
                                                        canDelete={canDeleteInventory}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {isAddModalOpen && (
                <AddEditInventoryItemModal
                    item={editingItem}
                    onClose={() => { setIsAddModalOpen(false); setEditingItem(undefined); }}
                    onSave={handleSaveItem}
                    suppliers={suppliers}
                />
            )}
            
            {isLowStockModalOpen && (
                <LowStockPurchaseOrderModal
                    clinicData={clinicData}
                    onClose={() => setIsLowStockModalOpen(false)}
                    onDraftsSaved={() => setDraftsNeedRefresh(true)}
                />
            )}

            
            {isPurchaseOrderModalOpen && (
                <CreatePurchaseOrderModal
                    clinicData={clinicData}
                    onClose={() => {
                        setIsPurchaseOrderModalOpen(false);
                        setEditingOrder(null);
                        // Refresh draft orders from localStorage
                        const savedDrafts = localStorage.getItem('purchaseOrders_drafts');
                        if (savedDrafts) {
                            setDraftOrders(JSON.parse(savedDrafts));
                        }
                    }}
                    onOrderCreated={(order) => {
                        // Drafts are saved in the modal, just refresh the list
                        const savedDrafts = localStorage.getItem('purchaseOrders_drafts');
                        if (savedDrafts) {
                            setDraftOrders(JSON.parse(savedDrafts));
                        }
                    }}
                    editingOrder={editingOrder}
                />
            )}

            </div>
        </div>
    );
};

export default InventoryManagement;
