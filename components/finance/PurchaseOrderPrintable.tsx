import React from 'react';
import { PurchaseOrder, Supplier } from '../../types';
import { ClinicInfo } from '../../hooks/useClinicData';

interface PurchaseOrderPrintableProps {
    order: PurchaseOrder;
    supplier: Supplier;
    clinic: ClinicInfo;
    items: Array<{
        itemName: string;
        quantity: number;
        unitCost: number;
        totalCost: number;
    }>;
}

const PurchaseOrderPrintable: React.FC<PurchaseOrderPrintableProps> = ({ order, supplier, clinic, items }) => {
    const currencyFormatter = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat('ar-EG', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return (
        <div className="p-8 max-w-4xl mx-auto bg-white text-right" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="text-right">
                    <h1 className="text-3xl font-bold text-purple-700 mb-2">طلبية شراء</h1>
                    <p className="text-xl font-semibold text-gray-700">Purchase Order</p>
                </div>
                <div className="text-left">
                    <h2 className="text-xl font-bold text-purple-700">{clinic?.name || 'عيادة CureSoft'}</h2>
                    <p className="text-gray-600">{clinic?.address || ''}</p>
                    <p className="text-gray-600">{clinic?.phone || ''}</p>
                </div>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-4 rounded-lg">
                <div>
                    <h3 className="font-bold text-purple-700 mb-2">المورد / Supplier</h3>
                    <p className="text-lg font-semibold">{supplier.name}</p>
                    <p className="text-gray-600">{supplier.contact_person}</p>
                    <p className="text-gray-600">{supplier.phone}</p>
                    <p className="text-gray-600">{supplier.email}</p>
                </div>
                <div className="text-left">
                    <p className="text-gray-600"><span className="font-bold">رقم الطلبية:</span> {order.name || order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-gray-600"><span className="font-bold">التاريخ:</span> {dateFormatter.format(new Date(order.orderDate))}</p>
                    <p className="text-gray-600"><span className="font-bold">الحالة:</span> {
                        order.status === 'draft' ? 'مسودة' :
                        order.status === 'sent' ? 'أُرسلت' :
                        order.status === 'received' ? 'استُلمت' : 'ملغاة'
                    }</p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8 border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-purple-700 text-white">
                        <th className="border border-gray-300 p-3 text-right">#</th>
                        <th className="border border-gray-300 p-3 text-right">الصنف / Item</th>
                        <th className="border border-gray-300 p-3 text-center">الكمية / Qty</th>
                        <th className="border border-gray-300 p-3 text-center">سعر الوحدة / Unit Price</th>
                        <th className="border border-gray-300 p-3 text-left">الإجمالي / Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="border border-gray-300 p-3 text-center">{index + 1}</td>
                            <td className="border border-gray-300 p-3">{item.itemName}</td>
                            <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                            <td className="border border-gray-300 p-3 text-center">{currencyFormatter.format(item.unitCost)}</td>
                            <td className="border border-gray-300 p-3 text-left">{currencyFormatter.format(item.totalCost)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100">
                        <td colSpan={4} className="border border-gray-300 p-3 text-left font-bold">المجموع الكلي / Grand Total</td>
                        <td className="border border-gray-300 p-3 text-left font-bold text-purple-700">
                            {currencyFormatter.format(order.totalAmount)}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Notes */}
            {order.notes && (
                <div className="mb-8">
                    <h3 className="font-bold text-purple-700 mb-2">ملاحظات / Notes</h3>
                    <p className="text-gray-600 p-3 bg-gray-50 rounded-lg">{order.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-between mt-12 pt-8 border-t border-gray-300">
                <div className="text-center">
                    <p className="font-bold text-purple-700 mb-8">توقيع المورد</p>
                    <p className="text-sm text-gray-500">Supplier Signature</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-purple-700 mb-8">توقيع المستلم</p>
                    <p className="text-sm text-gray-500">Received By</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-purple-700 mb-8">توقيع المُصدر</p>
                    <p className="text-sm text-gray-500">Prepared By</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body { margin: 0; padding: 20px; }
                    .no-print { display: none; }
                }
            `}</style>
        </div>
    );
};

export default PurchaseOrderPrintable;
