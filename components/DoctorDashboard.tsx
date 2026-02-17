import React, { useMemo } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { View } from '../types';
import { useI18n } from '../hooks/useI18n';

interface DoctorDashboardProps {
  clinicData: ClinicData;
  doctorId: string;
  setCurrentView: (view: View) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ clinicData, doctorId, setCurrentView }) => {
  const { locale } = useI18n();
  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const doctor = useMemo(
    () => clinicData.dentists.find(d => d.id === doctorId),
    [clinicData.dentists, doctorId]
  );

  const doctorAppointments = useMemo(
    () => clinicData.appointments.filter(a => a.dentistId === doctorId),
    [clinicData.appointments, doctorId]
  );

  const doctorTreatments = useMemo(
    () => clinicData.treatmentRecords.filter(tr => tr.dentistId === doctorId),
    [clinicData.treatmentRecords, doctorId]
  );

  const doctorPrescriptions = useMemo(
    () => clinicData.prescriptions.filter(p => p.dentistId === doctorId),
    [clinicData.prescriptions, doctorId]
  );

  const doctorPayments = useMemo(
    () => clinicData.doctorPayments.filter(p => p.dentistId === doctorId),
    [clinicData.doctorPayments, doctorId]
  );

  const treatedPatientIds = useMemo(
    () => Array.from(new Set(doctorTreatments.map(tr => tr.patientId))),
    [doctorTreatments]
  );

  const now = new Date();
  const upcomingAppointments = useMemo(
    () =>
      doctorAppointments
        .filter(a => a.startTime > now)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [doctorAppointments, now]
  );

  const totalEarnings = useMemo(
    () => doctorTreatments.reduce((sum, tr) => sum + (Number(tr.doctorShare) || 0), 0),
    [doctorTreatments]
  );

  const totalPaid = useMemo(
    () => doctorPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [doctorPayments]
  );

  const netBalance = totalEarnings - totalPaid;

  if (!doctor) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-5">
        No linked doctor record found. Ask admin to link your account to a doctor profile.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{doctor.name}</h2>
            <p className="text-slate-600 dark:text-slate-300">{doctor.specialty}</p>
          </div>
          <button
            onClick={() => setCurrentView('doctor-details')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Full Doctor Details
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat title="Appointments" value={doctorAppointments.length} />
        <Stat title="Upcoming" value={upcomingAppointments.length} />
        <Stat title="Treated Patients" value={treatedPatientIds.length} />
        <Stat title="Treatments" value={doctorTreatments.length} />
        <Stat title="Prescriptions" value={doctorPrescriptions.length} />
        <Stat title="Doctor Earnings" value={currencyFormatter.format(totalEarnings)} />
        <Stat title="Paid To Doctor" value={currencyFormatter.format(totalPaid)} />
        <Stat title="Net Balance" value={currencyFormatter.format(netBalance)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Next Appointments</h3>
          {upcomingAppointments.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">No upcoming appointments.</p>
          )}
          <div className="space-y-2">
            {upcomingAppointments.slice(0, 8).map(apt => {
              const patient = clinicData.patients.find(p => p.id === apt.patientId);
              return (
                <div key={apt.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                  <p className="font-medium text-slate-900 dark:text-white">{patient?.name || 'Unknown Patient'}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{dateTimeFormatter.format(apt.startTime)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{apt.reason}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Latest Treatments</h3>
          {doctorTreatments.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">No treatment records yet.</p>
          )}
          <div className="space-y-2">
            {doctorTreatments
              .slice()
              .sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime())
              .slice(0, 8)
              .map(record => {
                const patient = clinicData.patients.find(p => p.id === record.patientId);
                const treatment = clinicData.treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
                return (
                  <div key={record.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                    <p className="font-medium text-slate-900 dark:text-white">{patient?.name || 'Unknown Patient'}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{treatment?.name || 'Treatment'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {record.treatmentDate} | {currencyFormatter.format(record.doctorShare)}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
    <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
  </div>
);

export default DoctorDashboard;
