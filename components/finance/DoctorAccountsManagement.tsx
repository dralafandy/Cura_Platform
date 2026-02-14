import React, { useState, useRef } from 'react';
import { useClinicData } from '../../hooks/useClinicData';
import { DoctorPayment, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { DOCTOR_PERMISSIONS } from '../../utils/permissions';
import AddDoctorPaymentModal from './AddDoctorPaymentModal';
import PrintableDoctorStatement from './PrintableDoctorStatement';

const DoctorAccountsManagement: React.FC<{}> = () => {
   const { t } = useI18n();
   const { userProfile } = useAuth();
   const clinicData = useClinicData();
   const { doctorPayments, dentists, addDoctorPayment, updateDoctorPayment, deleteDoctorPayment } = clinicData;
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingPayment, setEditingPayment] = useState<DoctorPayment | null>(null);
   const [selectedDentistId, setSelectedDentistId] = useState<string>('');
   const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
   const [showPrintDialog, setShowPrintDialog] = useState(false);
   const printRef = useRef<HTMLDivElement>(null);

   const resetForm = () => {
     setSelectedDentistId('');
     setEditingPayment(null);
   };

   const handleAddPayment = (payment: Omit<DoctorPayment, 'id'>) => {
     addDoctorPayment(payment);
     setIsModalOpen(false);
     resetForm();
   };

   const handleEdit = (payment: DoctorPayment) => {
     setEditingPayment(payment);
     setSelectedDentistId(payment.dentistId);
     setIsModalOpen(true);
   };

   const handleDelete = async (id: string) => {
     if (window.confirm(t('common.confirmDelete'))) {
       try {
         await deleteDoctorPayment(id);
       } catch (error) {
         console.error('Error deleting doctor payment:', error);
       }
     }
   };

   const handlePrintStatement = (dentist: Dentist) => {
     setSelectedDentist(dentist);
     setShowPrintDialog(true);
   };

   const handlePrintClick = () => {
     window.print();
   };

   const getDentistName = (dentistId: string) => {
     const dentist = dentists.find(d => d.id === dentistId);
     return dentist ? dentist.name : t('common.unknown');
   };

   if (!userProfile?.permissions?.includes(DOCTOR_PERMISSIONS.VIEW_DOCTOR_ACCOUNTS)) {
     return <div className="text-center py-8">{t('common.accessDenied')}</div>;
   }

   return (
     <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800">{t('doctorAccounts.title')}</h2>
       </div>

       <div className="bg-white rounded-lg shadow overflow-hidden">
         <table className="min-w-full divide-y divide-slate-200">
           <thead className="bg-slate-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                 {t('doctorAccounts.doctor')}
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                 {t('doctorAccounts.amount')}
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                 {t('doctorAccounts.date')}
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                 {t('doctorAccounts.notes')}
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                 {t('doctorAccounts.actions')}
               </th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-slate-200">
             {doctorPayments.map((payment) => (
               <tr key={payment.id}>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                   {getDentistName(payment.dentistId)}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                   ${payment.amount.toFixed(2)}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                   {new Date(payment.date).toLocaleDateString()}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                   {payment.notes || '-'}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                   <button
                     onClick={() => handleEdit(payment)}
                     className="text-primary hover:text-primary-dark mr-4"
                   >
                     {t('common.edit')}
                   </button>
                   <button
                     onClick={() => handleDelete(payment.id)}
                     className="text-red-600 hover:text-red-900"
                   >
                     {t('common.delete')}
                   </button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
         {doctorPayments.length === 0 && (
           <div className="text-center py-8 text-slate-500">
             {t('doctorAccounts.noPayments')}
           </div>
         )}
       </div>

       {/* Doctors List with Print Option */}
       <div className="bg-white rounded-lg shadow overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-200">
           <h3 className="text-lg font-medium text-slate-800">{t('doctorStatement.treatments')}</h3>
         </div>
         <table className="min-w-full divide-y divide-slate-200">
           <thead className="bg-slate-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                 {t('doctors.name')}
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                 {t('doctors.specialization')}
               </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                 {t('common.actions')}
               </th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-slate-200">
             {dentists.map((dentist) => (
               <tr key={dentist.id}>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                   {dentist.name}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                   {dentist.specialty || '-'}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                   <button
                     onClick={() => handlePrintStatement(dentist)}
                     className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                     </svg>
                     {t('common.print')}
                   </button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>

       {isModalOpen && (
         <AddDoctorPaymentModal
           dentistId={selectedDentistId}
           onClose={() => setIsModalOpen(false)}
           onAdd={handleAddPayment}
           doctorPayments={doctorPayments}
         />
       )}

       {/* Print Dialog */}
       {showPrintDialog && selectedDentist && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
               <h3 className="text-lg font-medium text-slate-800">
                 {t('doctorStatement.title')} - {selectedDentist.name}
               </h3>
               <div className="flex gap-2">
                 <button
                   onClick={handlePrintClick}
                   className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                   </svg>
                   {t('common.print')}
                 </button>
                 <button
                   onClick={() => setShowPrintDialog(false)}
                   className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300"
                 >
                   {t('common.close')}
                 </button>
               </div>
             </div>
             <div className="p-6">
               <div ref={printRef}>
                 <PrintableDoctorStatement
                   dentist={selectedDentist}
                   clinicData={clinicData}
                 />
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
};

export default DoctorAccountsManagement;
