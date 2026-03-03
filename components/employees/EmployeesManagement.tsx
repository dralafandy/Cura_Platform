import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../hooks/useI18n';

type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
type CompensationType = 'SALARY' | 'BONUS' | 'PENALTY' | 'ADVANCE';
type Dentist = { id: string; name: string };

type Employee = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  position_title: string | null;
  base_salary: number;
  status: EmployeeStatus;
  dentist_id?: string | null;
};

type Attendance = {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: AttendanceStatus;
  notes: string | null;
};

type Compensation = {
  id: string;
  employee_id: string;
  entry_date: string;
  entry_type: CompensationType;
  amount: number;
  notes: string | null;
};

const today = new Date().toISOString().slice(0, 10);
const monthNow = today.slice(0, 7);

const EmployeesManagement: React.FC = () => {
  const { user, currentClinic, accessibleClinics } = useAuth();
  const { locale, direction } = useI18n();
  const isAr = locale === 'ar';
  const tr = (ar: string, en: string) => (isAr ? ar : en);
  const align = direction === 'rtl' ? 'text-right' : 'text-left';
  const activeClinicId = useMemo(
    () => currentClinic?.id || accessibleClinics.find((c) => c.isDefault)?.clinicId || accessibleClinics[0]?.clinicId || null,
    [currentClinic, accessibleClinics]
  );

  const [tab, setTab] = useState<'employees' | 'attendance' | 'compensation'>('employees');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [compensations, setCompensations] = useState<Compensation[]>([]);

  const [monthFilter, setMonthFilter] = useState(monthNow);
  const [dayFilter, setDayFilter] = useState(today);
  const [search, setSearch] = useState('');

  const [employeeForm, setEmployeeForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    position_title: '',
    base_salary: '',
    status: 'ACTIVE' as EmployeeStatus,
    dentist_id: '',
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  const [attendanceForm, setAttendanceForm] = useState({
    employee_id: '',
    attendance_date: today,
    check_in_time: '',
    check_out_time: '',
    status: 'PRESENT' as AttendanceStatus,
    notes: '',
  });

  const [compForm, setCompForm] = useState({
    employee_id: '',
    entry_date: today,
    entry_type: 'SALARY' as CompensationType,
    amount: '',
    notes: '',
  });

  const toMoney = (v: number) =>
    new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v || 0);

  const load = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [e, d, a, c] = await Promise.all([
      supabase.from('employees').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('dentists').select('id,name').eq('user_id', user.id).order('name', { ascending: true }),
      supabase.from('employee_attendance').select('*').eq('user_id', user.id).order('attendance_date', { ascending: false }),
      supabase.from('employee_compensations').select('*').eq('user_id', user.id).order('entry_date', { ascending: false }),
    ]);
    if (e.error || d.error || a.error || c.error) {
      setError(e.error?.message || d.error?.message || a.error?.message || c.error?.message || tr('فشل تحميل البيانات.', 'Failed to load data.'));
      setLoading(false);
      return;
    }
    setEmployees((e.data || []) as Employee[]);
    setDentists((d.data || []) as Dentist[]);
    setAttendance((a.data || []) as Attendance[]);
    setCompensations((c.data || []) as Compensation[]);
    setLoading(false);
  }, [user, isAr]);

  useEffect(() => {
    load();
  }, [load]);

  const employeeName = useMemo(() => new Map(employees.map((e) => [e.id, e.full_name])), [employees]);
  const dentistName = useMemo(() => new Map(dentists.map((d) => [d.id, d.name])), [dentists]);

  const monthComp = useMemo(() => compensations.filter((x) => x.entry_date.startsWith(monthFilter)), [compensations, monthFilter]);
  const dayAttendance = useMemo(() => attendance.filter((x) => x.attendance_date === dayFilter), [attendance, dayFilter]);
  const monthAttendance = useMemo(() => attendance.filter((x) => x.attendance_date.startsWith(monthFilter)), [attendance, monthFilter]);
  const attendanceSummary = useMemo(() => {
    const present = dayAttendance.filter((x) => x.status === 'PRESENT').length;
    const late = dayAttendance.filter((x) => x.status === 'LATE').length;
    const absent = dayAttendance.filter((x) => x.status === 'ABSENT').length;
    const leave = dayAttendance.filter((x) => x.status === 'LEAVE').length;
    const checkedOut = dayAttendance.filter((x) => !!x.check_out_time).length;
    const openShifts = dayAttendance.length - checkedOut;
    return { total: dayAttendance.length, present, late, absent, leave, checkedOut, openShifts };
  }, [dayAttendance]);
  const attendanceMonthlySummary = useMemo(() => {
    const present = monthAttendance.filter((x) => x.status === 'PRESENT').length;
    const late = monthAttendance.filter((x) => x.status === 'LATE').length;
    const absent = monthAttendance.filter((x) => x.status === 'ABSENT').length;
    const leave = monthAttendance.filter((x) => x.status === 'LEAVE').length;
    const checkedOut = monthAttendance.filter((x) => !!x.check_out_time).length;
    const openShifts = monthAttendance.length - checkedOut;
    return { total: monthAttendance.length, present, late, absent, leave, checkedOut, openShifts };
  }, [monthAttendance]);
  const monthlyAttendanceByEmployee = useMemo(() => {
    const map = new Map<
      string,
      { employee_id: string; present: number; late: number; absent: number; leave: number; checkedOut: number; openShifts: number }
    >();
    monthAttendance.forEach((x) => {
      const c = map.get(x.employee_id) || {
        employee_id: x.employee_id,
        present: 0,
        late: 0,
        absent: 0,
        leave: 0,
        checkedOut: 0,
        openShifts: 0,
      };
      if (x.status === 'PRESENT') c.present += 1;
      if (x.status === 'LATE') c.late += 1;
      if (x.status === 'ABSENT') c.absent += 1;
      if (x.status === 'LEAVE') c.leave += 1;
      if (x.check_out_time) c.checkedOut += 1;
      else c.openShifts += 1;
      map.set(x.employee_id, c);
    });
    return Array.from(map.values()).sort((a, b) => (employeeName.get(a.employee_id) || '').localeCompare(employeeName.get(b.employee_id) || ''));
  }, [monthAttendance, employeeName]);

  const payroll = useMemo(() => {
    const agg = new Map<string, { salary: number; bonus: number; penalty: number; advance: number }>();
    monthComp.forEach((x) => {
      const t = agg.get(x.employee_id) || { salary: 0, bonus: 0, penalty: 0, advance: 0 };
      if (x.entry_type === 'SALARY') t.salary += Number(x.amount || 0);
      if (x.entry_type === 'BONUS') t.bonus += Number(x.amount || 0);
      if (x.entry_type === 'PENALTY') t.penalty += Number(x.amount || 0);
      if (x.entry_type === 'ADVANCE') t.advance += Number(x.amount || 0);
      agg.set(x.employee_id, t);
    });
    return employees.map((e) => {
      const t = agg.get(e.id) || { salary: 0, bonus: 0, penalty: 0, advance: 0 };
      const net = t.salary + t.bonus - t.penalty - t.advance;
      return { employeeId: e.id, employeeName: e.full_name, ...t, net };
    });
  }, [employees, monthComp]);

  const statusText = (s: string) =>
    ({
      ACTIVE: tr('نشط', 'Active'),
      INACTIVE: tr('غير نشط', 'Inactive'),
      PRESENT: tr('حضور', 'Present'),
      ABSENT: tr('غياب', 'Absent'),
      LATE: tr('متأخر', 'Late'),
      LEAVE: tr('إجازة', 'Leave'),
      SALARY: tr('مرتب', 'Salary'),
      BONUS: tr('مكافأة', 'Bonus'),
      PENALTY: tr('جزاء', 'Penalty'),
      ADVANCE: tr('سلفة', 'Advance'),
    } as Record<string, string>)[s] || s;

  const saveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeClinicId || !employeeForm.full_name.trim()) return;
    const payload = {
      ...employeeForm,
      base_salary: Number(employeeForm.base_salary || 0),
      phone: employeeForm.phone || null,
      email: employeeForm.email || null,
      position_title: employeeForm.position_title || null,
      dentist_id: employeeForm.dentist_id || null,
      user_id: user.id,
      clinic_id: activeClinicId,
    };
    const { error: err } = editingEmployeeId
      ? await supabase.from('employees').update(payload).eq('id', editingEmployeeId)
      : await supabase.from('employees').insert(payload);
    if (err) return setError(err.message);
    setEmployeeForm({ full_name: '', phone: '', email: '', position_title: '', base_salary: '', status: 'ACTIVE', dentist_id: '' });
    setEditingEmployeeId(null);
    setNote(editingEmployeeId ? tr('تم تحديث بيانات الموظف.', 'Employee updated.') : tr('تمت إضافة الموظف.', 'Employee added.'));
    await load();
  };

  const editEmployee = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setEmployeeForm({
      full_name: employee.full_name || '',
      phone: employee.phone || '',
      email: employee.email || '',
      position_title: employee.position_title || '',
      base_salary: String(employee.base_salary ?? ''),
      status: employee.status,
      dentist_id: employee.dentist_id || '',
    });
  };

  const cancelEmployeeEdit = () => {
    setEditingEmployeeId(null);
    setEmployeeForm({ full_name: '', phone: '', email: '', position_title: '', base_salary: '', status: 'ACTIVE', dentist_id: '' });
  };

  const addAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeClinicId || !attendanceForm.employee_id) return;
    const status = attendanceForm.status === 'PRESENT' && attendanceForm.check_in_time && attendanceForm.check_in_time > '09:15' ? 'LATE' : attendanceForm.status;
    const { error: err } = await supabase.from('employee_attendance').upsert(
      {
        ...attendanceForm,
        status,
        user_id: user.id,
        clinic_id: activeClinicId,
        check_in_time: attendanceForm.check_in_time || null,
        check_out_time: attendanceForm.check_out_time || null,
        notes: attendanceForm.notes || null,
      },
      { onConflict: 'employee_id,attendance_date' }
    );
    if (err) return setError(err.message);
    setAttendanceForm({ employee_id: '', attendance_date: today, check_in_time: '', check_out_time: '', status: 'PRESENT', notes: '' });
    setNote(tr('تم حفظ الحضور.', 'Attendance saved.'));
    await load();
  };

  const addCompensation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeClinicId || !compForm.employee_id || !compForm.amount) return;
    const { error: err } = await supabase.from('employee_compensations').insert({
      ...compForm,
      amount: Number(compForm.amount),
      notes: compForm.notes || null,
      user_id: user.id,
      clinic_id: activeClinicId,
    });
    if (err) return setError(err.message);
    setCompForm({ employee_id: '', entry_date: today, entry_type: 'SALARY', amount: '', notes: '' });
    setNote(tr('تم حفظ البند المالي.', 'Compensation saved.'));
    await load();
  };

  const deleteRow = async (table: 'employees' | 'employee_attendance' | 'employee_compensations', id: string) => {
    const ok = window.confirm(tr('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete this record?'));
    if (!ok) return;
    const { error: err } = await supabase.from(table).delete().eq('id', id);
    if (err) return setError(err.message);
    setNote(tr('تم حذف السجل بنجاح.', 'Record deleted successfully.'));
    await load();
  };

  const generateSalaries = async () => {
    if (!user) return;
    setWorking(true);
    setError(null);

    const { data, error: err } = await supabase.rpc('generate_monthly_salaries', { p_user_id: user.id, p_month: `${monthFilter}-01` });
    if (!err) {
      setNote(tr(`تم توليد ${Number(data || 0)} راتب.`, `Generated ${Number(data || 0)} salaries.`));
      setWorking(false);
      await load();
      return;
    }

    const missingRpcError =
      err.code === 'PGRST202' || /Could not find the function public\.generate_monthly_salaries/i.test(err.message || '');

    if (!missingRpcError) {
      setError(`${tr('فشل أتمتة الرواتب', 'Salary automation failed')}: ${err.message}`);
      setWorking(false);
      return;
    }

    const [yearStr, monthStr] = monthFilter.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) {
      setError(tr('صيغة الشهر غير صحيحة.', 'Invalid month format.'));
      setWorking(false);
      return;
    }

    const monthStart = `${monthFilter}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthEnd = `${monthFilter}-${String(daysInMonth).padStart(2, '0')}`;
    const nextMonthStart =
      month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const { data: activeEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('id,base_salary,clinic_id')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE');

    if (employeesError) {
      setError(`${tr('فشل أتمتة الرواتب', 'Salary automation failed')}: ${employeesError.message}`);
      setWorking(false);
      return;
    }

    const { data: existingSalaries, error: existingError } = await supabase
      .from('employee_compensations')
      .select('employee_id')
      .eq('user_id', user.id)
      .eq('entry_type', 'SALARY')
      .gte('entry_date', monthStart)
      .lt('entry_date', nextMonthStart);

    if (existingError) {
      setError(`${tr('فشل أتمتة الرواتب', 'Salary automation failed')}: ${existingError.message}`);
      setWorking(false);
      return;
    }

    const existingEmployeeIds = new Set((existingSalaries || []).map((r) => r.employee_id));
    const rows = (activeEmployees || [])
      .filter((e) => !existingEmployeeIds.has(e.id))
      .map((e) => ({
        employee_id: e.id,
        entry_date: monthEnd,
        entry_type: 'SALARY' as CompensationType,
        amount: Number(e.base_salary || 0),
        notes: `Auto salary generated for month ${monthFilter}`,
        user_id: user.id,
        clinic_id: e.clinic_id || activeClinicId || null,
      }));

    if (!rows.length) {
      setNote(tr('لا توجد رواتب جديدة للتوليد.', 'No new salaries to generate.'));
      setWorking(false);
      await load();
      return;
    }

    const { error: insertError } = await supabase.from('employee_compensations').insert(rows);
    if (insertError) {
      setError(`${tr('فشل أتمتة الرواتب', 'Salary automation failed')}: ${insertError.message}`);
      setWorking(false);
      return;
    }

    setNote(tr(`تم توليد ${rows.length} راتب.`, `Generated ${rows.length} salaries.`));
    setWorking(false);
    await load();
  };

  const autoMarkPresent = async () => {
    if (!user || !activeClinicId) return;
    setWorking(true);
    setError(null);

    const alreadyMarked = new Set(attendance.filter((a) => a.attendance_date === dayFilter).map((a) => a.employee_id));
    const nowTime = new Date().toTimeString().slice(0, 5);
    const rows = employees
      .filter((e) => e.status === 'ACTIVE' && !alreadyMarked.has(e.id))
      .map((e) => ({
        employee_id: e.id,
        attendance_date: dayFilter,
        check_in_time: nowTime,
        check_out_time: null,
        status: 'PRESENT' as AttendanceStatus,
        notes: tr('تسجيل تلقائي', 'Auto marked'),
        user_id: user.id,
        clinic_id: activeClinicId,
      }));

    if (!rows.length) {
      setNote(tr('لا يوجد موظفون جدد لتسجيل حضورهم.', 'No new employees to mark as present.'));
      setWorking(false);
      return;
    }

    const { error: err } = await supabase.from('employee_attendance').insert(rows);
    if (err) {
      setError(err.message);
      setWorking(false);
      return;
    }

    setNote(tr(`تم تسجيل حضور ${rows.length} موظف تلقائيا.`, `Auto-marked ${rows.length} employees.`));
    setWorking(false);
    await load();
  };

  const autoCheckout = async () => {
    if (!user) return;
    setWorking(true);
    setError(null);

    const openIds = attendance.filter((a) => a.attendance_date === dayFilter && !a.check_out_time).map((a) => a.id);
    if (!openIds.length) {
      setNote(tr('لا توجد سجلات حضور مفتوحة لهذا اليوم.', 'No open attendance records for this date.'));
      setWorking(false);
      return;
    }

    const outTime = new Date().toTimeString().slice(0, 5);
    const { error: err } = await supabase.from('employee_attendance').update({ check_out_time: outTime }).in('id', openIds);
    if (err) {
      setError(err.message);
      setWorking(false);
      return;
    }

    setNote(tr(`تم تسجيل الانصراف تلقائيا لعدد ${openIds.length} سجل.`, `Auto checked-out ${openIds.length} records.`));
    setWorking(false);
    await load();
  };

  const printPayrollReport = () => {
    const popup = window.open('', '_blank', 'width=1100,height=800');
    if (!popup) return;

    const totalNet = payroll.reduce((sum, r) => sum + r.net, 0);
    const totalAdd = payroll.reduce((sum, r) => sum + r.salary + r.bonus, 0);
    const totalDed = payroll.reduce((sum, r) => sum + r.penalty + r.advance, 0);
    const now = new Date().toLocaleString(isAr ? 'ar-EG' : 'en-US');

    const rows = payroll
      .map(
        (r) => `
      <tr>
        <td class="name">${r.employeeName}</td>
        <td>${toMoney(r.salary)}</td>
        <td class="pos">${toMoney(r.bonus)}</td>
        <td class="neg">${toMoney(r.penalty + r.advance)}</td>
        <td class="net">${toMoney(r.net)}</td>
      </tr>`
      )
      .join('');

    const html = `
      <html>
      <head>
        <title>${tr('جدول مفصل بيرول الشهر', 'Detailed Monthly Payroll Sheet')}</title>
        <style>
          @page{size:A4 landscape;margin:12mm}
          body{font-family:Segoe UI,Tahoma,Arial,sans-serif;direction:${direction};margin:0;color:#0f172a}
          .wrap{border:1px solid #cbd5e1;border-radius:12px;overflow:hidden}
          .head{padding:18px 20px;background:linear-gradient(135deg,#f0fdfa,#fff);border-bottom:1px solid #cbd5e1}
          .head h1{margin:0;color:#0f766e;font-size:24px}
          .sub{font-size:13px;color:#475569;margin-top:6px}
          .chips{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.chip{border:1px solid #cbd5e1;border-radius:999px;padding:4px 10px;font-size:12px}
          .cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:14px 20px 8px}
          .c{border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px}.l{font-size:11px;color:#475569}.v{font-size:18px;font-weight:800}
          .tbl{padding:12px 20px 10px}table{width:100%;border-collapse:collapse;font-size:12.5px}
          th,td{border:1px solid #e2e8f0;padding:8px;text-align:${direction === 'rtl' ? 'right' : 'left'}}thead th{background:#f8fafc}
          tbody tr:nth-child(even) td{background:#f8fafc}.name{font-weight:700}.pos{color:#047857;font-weight:700}.neg{color:#b91c1c;font-weight:700}.net{font-weight:800}
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="head">
            <h1>${tr('جدول مفصل بيرول الشهر', 'Detailed Monthly Payroll Sheet')}</h1>
            <div class="sub">${tr('تقرير شهري مفصل للمرتبات والاستحقاقات', 'Monthly detailed payroll report')}</div>
            <div class="chips"><div class="chip">${tr('الشهر', 'Month')}: <strong>${monthFilter}</strong></div><div class="chip">${tr('تاريخ الطباعة', 'Generated At')}: <strong>${now}</strong></div></div>
          </div>
          <div class="cards">
            <div class="c"><div class="l">${tr('إجمالي الإضافات', 'Total Additions')}</div><div class="v">${toMoney(totalAdd)}</div></div>
            <div class="c"><div class="l">${tr('إجمالي الخصومات', 'Total Deductions')}</div><div class="v">${toMoney(totalDed)}</div></div>
            <div class="c"><div class="l">${tr('صافي البيرول', 'Payroll Net')}</div><div class="v">${toMoney(totalNet)}</div></div>
            <div class="c"><div class="l">${tr('عدد الموظفين', 'Employees')}</div><div class="v">${payroll.length}</div></div>
          </div>
          <div class="tbl">
            <table>
              <thead><tr><th>${tr('الموظف', 'Employee')}</th><th>${tr('المرتب', 'Salary')}</th><th>${tr('المكافآت', 'Bonus')}</th><th>${tr('الخصومات', 'Deductions')}</th><th>${tr('الصافي', 'Net')}</th></tr></thead>
              <tbody>${rows || `<tr><td colspan='5'>${tr('لا توجد بيانات لهذا الشهر.', 'No data for this month.')}</td></tr>`}</tbody>
            </table>
          </div>
        </div>
        <script>window.onload=()=>window.print();</script>
      </body>
      </html>`;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  };

  const filteredEmployees = employees.filter((e) => `${e.full_name} ${e.phone || ''} ${e.position_title || ''}`.toLowerCase().includes(search.toLowerCase()));

  const field = 'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white';
  const card = 'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4';

  return (
    <div className="space-y-6" dir={direction}>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${align}`}>{tr('قائمة الموظفين', 'Employees List')}</h1>
            <p className={`text-sm text-slate-500 dark:text-slate-400 ${align}`}>{tr('عرض وإدارة بيانات الموظفين والحضور والرواتب والمكافآت والجزاءات.', 'View and manage employee data, attendance, payroll, bonuses, and penalties.')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={field} />
            <button onClick={generateSalaries} disabled={working} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">{tr('توليد رواتب الشهر', 'Generate Monthly Salaries')}</button>
            <button onClick={printPayrollReport} className="px-4 py-2 rounded-lg bg-indigo-700 text-white">{tr('طباعة تقرير البيرول', 'Print Payroll Report')}</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab('employees')} className={`px-4 py-2 rounded-lg ${tab === 'employees' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 dark:text-slate-100'}`}>{tr('الموظفون', 'Employees')}</button>
        <button onClick={() => setTab('attendance')} className={`px-4 py-2 rounded-lg ${tab === 'attendance' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 dark:text-slate-100'}`}>{tr('الحضور', 'Attendance')}</button>
        <button onClick={() => setTab('compensation')} className={`px-4 py-2 rounded-lg ${tab === 'compensation' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 dark:text-slate-100'}`}>{tr('المرتبات', 'Compensation')}</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr('بحث بالاسم أو الهاتف أو الوظيفة...', 'Search by name / phone / position...')} className={field} />
        <input type="date" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} className={field} />
        <button onClick={autoMarkPresent} disabled={working} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">{tr('تسجيل حضور تلقائي', 'Auto Mark Present')}</button>
        <button onClick={autoCheckout} disabled={working} className="px-4 py-2 rounded-lg bg-orange-600 text-white">{tr('تسجيل انصراف تلقائي', 'Auto Check-out')}</button>
      </div>

      {error && <div className={`rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 ${align}`}>{error}</div>}
      {note && <div className={`rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 px-4 py-3 ${align}`}>{note}</div>}
      {loading && <div className={align}>Loading...</div>}

      {!loading && tab === 'employees' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <form onSubmit={saveEmployee} className={`${card} space-y-3`}>
            <h2 className={`font-semibold ${align}`}>{editingEmployeeId ? tr('تعديل موظف', 'Edit Employee') : tr('إضافة موظف', 'Add Employee')}</h2>
            <input value={employeeForm.full_name} onChange={(e) => setEmployeeForm((p) => ({ ...p, full_name: e.target.value }))} className={field} placeholder={tr('الاسم الكامل', 'Full name')} required />
            <input value={employeeForm.position_title} onChange={(e) => setEmployeeForm((p) => ({ ...p, position_title: e.target.value }))} className={field} placeholder={tr('المسمى الوظيفي', 'Position')} />
            <input value={employeeForm.phone} onChange={(e) => setEmployeeForm((p) => ({ ...p, phone: e.target.value }))} className={field} placeholder={tr('الهاتف', 'Phone')} />
            <input value={employeeForm.email} onChange={(e) => setEmployeeForm((p) => ({ ...p, email: e.target.value }))} className={field} placeholder={tr('البريد الإلكتروني', 'Email')} />
            <input type="number" value={employeeForm.base_salary} onChange={(e) => setEmployeeForm((p) => ({ ...p, base_salary: e.target.value }))} className={field} placeholder={tr('الراتب الأساسي', 'Base salary')} />
            <select value={employeeForm.dentist_id} onChange={(e) => setEmployeeForm((p) => ({ ...p, dentist_id: e.target.value }))} className={field}>
              <option value="">{tr('بدون ربط طبيب', 'No linked doctor')}</option>
              {dentists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={employeeForm.status} onChange={(e) => setEmployeeForm((p) => ({ ...p, status: e.target.value as EmployeeStatus }))} className={field}><option value="ACTIVE">{tr('نشط', 'Active')}</option><option value="INACTIVE">{tr('غير نشط', 'Inactive')}</option></select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white">{editingEmployeeId ? tr('تحديث الموظف', 'Update Employee') : tr('حفظ الموظف', 'Save Employee')}</button>
              {editingEmployeeId && (
                <button type="button" onClick={cancelEmployeeEdit} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 dark:text-slate-100">
                  {tr('إلغاء', 'Cancel')}
                </button>
              )}
            </div>
          </form>
          <div className={`${card} xl:col-span-2 overflow-auto`}>
            <table className="min-w-full text-sm">
              <thead><tr><th className={`p-2 ${align}`}>{tr('الاسم', 'Name')}</th><th className={`p-2 ${align}`}>{tr('الوظيفة', 'Position')}</th><th className={`p-2 ${align}`}>{tr('الطبيب المرتبط', 'Linked Doctor')}</th><th className={`p-2 ${align}`}>{tr('الهاتف', 'Phone')}</th><th className={`p-2 ${align}`}>{tr('الراتب', 'Salary')}</th><th className={`p-2 ${align}`}>{tr('الحالة', 'Status')}</th><th className={`p-2 ${align}`}>{tr('إجراء', 'Action')}</th></tr></thead>
              <tbody>{filteredEmployees.map((r) => <tr key={r.id} className="border-t border-slate-200 dark:border-slate-700"><td className={`p-2 ${align}`}>{r.full_name}</td><td className={`p-2 ${align}`}>{r.position_title || '-'}</td><td className={`p-2 ${align}`}>{r.dentist_id ? (dentistName.get(r.dentist_id) || '-') : '-'}</td><td className={`p-2 ${align}`}>{r.phone || '-'}</td><td className={`p-2 ${align}`}>{toMoney(Number(r.base_salary || 0))}</td><td className={`p-2 ${align}`}>{statusText(r.status)}</td><td className={`p-2 ${align}`}><div className="flex gap-2"><button onClick={() => editEmployee(r)} className="text-blue-600 hover:underline">{tr('تعديل', 'Edit')}</button><button onClick={() => deleteRow('employees', r.id)} className="text-rose-600 hover:underline">{tr('حذف', 'Delete')}</button></div></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'attendance' && (
        <div className="space-y-4">
          <div className={card}>
            <h3 className={`font-semibold mb-3 ${align}`}>{tr('ملخص شهري للحضور والانصراف', 'Monthly Attendance Summary')}</h3>
            <div className="grid grid-cols-2 xl:grid-cols-7 gap-3">
              <div><p className={`text-xs text-slate-500 ${align}`}>{tr('إجمالي السجلات', 'Total Records')}</p><p className={`text-xl font-bold ${align}`}>{attendanceMonthlySummary.total}</p></div>
              <div><p className={`text-xs text-slate-500 ${align}`}>{tr('حضور', 'Present')}</p><p className={`text-xl font-bold text-emerald-600 ${align}`}>{attendanceMonthlySummary.present}</p></div>
              <div><p className={`text-xs text-slate-500 ${align}`}>{tr('تأخير', 'Late')}</p><p className={`text-xl font-bold text-amber-600 ${align}`}>{attendanceMonthlySummary.late}</p></div>
              <div><p className={`text-xs text-slate-500 ${align}`}>{tr('غياب', 'Absent')}</p><p className={`text-xl font-bold text-rose-600 ${align}`}>{attendanceMonthlySummary.absent}</p></div>
              <div><p className={`text-xs text-slate-500 ${align}`}>{tr('إجازة', 'Leave')}</p><p className={`text-xl font-bold text-indigo-600 ${align}`}>{attendanceMonthlySummary.leave}</p></div>
              <div><p className={`text-xs text-slate-500 ${align}`}>{tr('تم الانصراف', 'Checked Out')}</p><p className={`text-xl font-bold text-sky-600 ${align}`}>{attendanceMonthlySummary.checkedOut}</p></div>
              <div><p className={`text-xs text-slate-500 ${align}`}>{tr('انصراف غير مكتمل', 'Open Shifts')}</p><p className={`text-xl font-bold text-orange-600 ${align}`}>{attendanceMonthlySummary.openShifts}</p></div>
            </div>
          </div>

          <div className={`${card} overflow-auto`}>
            <h3 className={`font-semibold mb-3 ${align}`}>{tr('تفصيل شهري لكل موظف', 'Monthly Details Per Employee')}</h3>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className={`p-2 ${align}`}>{tr('الموظف', 'Employee')}</th>
                  <th className={`p-2 ${align}`}>{tr('حضور', 'Present')}</th>
                  <th className={`p-2 ${align}`}>{tr('تأخير', 'Late')}</th>
                  <th className={`p-2 ${align}`}>{tr('غياب', 'Absent')}</th>
                  <th className={`p-2 ${align}`}>{tr('إجازة', 'Leave')}</th>
                  <th className={`p-2 ${align}`}>{tr('تم الانصراف', 'Checked Out')}</th>
                  <th className={`p-2 ${align}`}>{tr('انصراف غير مكتمل', 'Open Shifts')}</th>
                </tr>
              </thead>
              <tbody>
                {monthlyAttendanceByEmployee.length === 0 && (
                  <tr>
                    <td className={`p-3 ${align}`} colSpan={7}>
                      {tr('لا توجد سجلات حضور لهذا الشهر.', 'No attendance records for this month.')}
                    </td>
                  </tr>
                )}
                {monthlyAttendanceByEmployee.map((r) => (
                  <tr key={r.employee_id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className={`p-2 ${align}`}>{employeeName.get(r.employee_id) || '-'}</td>
                    <td className={`p-2 ${align}`}>{r.present}</td>
                    <td className={`p-2 ${align}`}>{r.late}</td>
                    <td className={`p-2 ${align}`}>{r.absent}</td>
                    <td className={`p-2 ${align}`}>{r.leave}</td>
                    <td className={`p-2 ${align}`}>{r.checkedOut}</td>
                    <td className={`p-2 ${align}`}>{r.openShifts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={card}>
            <h3 className={`font-semibold mb-3 ${align}`}>{tr('ملخص يومي للحضور والانصراف', 'Daily Attendance Summary')}</h3>
          <div className="grid grid-cols-2 xl:grid-cols-7 gap-3">
            <div className={card}><p className={`text-xs text-slate-500 ${align}`}>{tr('إجمالي السجلات', 'Total Records')}</p><p className={`text-xl font-bold ${align}`}>{attendanceSummary.total}</p></div>
            <div className={card}><p className={`text-xs text-slate-500 ${align}`}>{tr('حضور', 'Present')}</p><p className={`text-xl font-bold text-emerald-600 ${align}`}>{attendanceSummary.present}</p></div>
            <div className={card}><p className={`text-xs text-slate-500 ${align}`}>{tr('تأخير', 'Late')}</p><p className={`text-xl font-bold text-amber-600 ${align}`}>{attendanceSummary.late}</p></div>
            <div className={card}><p className={`text-xs text-slate-500 ${align}`}>{tr('غياب', 'Absent')}</p><p className={`text-xl font-bold text-rose-600 ${align}`}>{attendanceSummary.absent}</p></div>
            <div className={card}><p className={`text-xs text-slate-500 ${align}`}>{tr('إجازة', 'Leave')}</p><p className={`text-xl font-bold text-indigo-600 ${align}`}>{attendanceSummary.leave}</p></div>
            <div className={card}><p className={`text-xs text-slate-500 ${align}`}>{tr('تم الانصراف', 'Checked Out')}</p><p className={`text-xl font-bold text-sky-600 ${align}`}>{attendanceSummary.checkedOut}</p></div>
            <div className={card}><p className={`text-xs text-slate-500 ${align}`}>{tr('انصراف غير مكتمل', 'Open Shifts')}</p><p className={`text-xl font-bold text-orange-600 ${align}`}>{attendanceSummary.openShifts}</p></div>
          </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <form onSubmit={addAttendance} className={`${card} space-y-3`}>
              <h2 className={`font-semibold ${align}`}>{tr('تسجيل حضور/انصراف', 'Log Attendance')}</h2>
              <select value={attendanceForm.employee_id} onChange={(e) => setAttendanceForm((p) => ({ ...p, employee_id: e.target.value }))} className={field} required><option value="">{tr('اختر موظف', 'Select employee')}</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
              <input type="date" value={attendanceForm.attendance_date} onChange={(e) => setAttendanceForm((p) => ({ ...p, attendance_date: e.target.value }))} className={field} />
              <input type="time" value={attendanceForm.check_in_time} onChange={(e) => setAttendanceForm((p) => ({ ...p, check_in_time: e.target.value }))} className={field} />
              <input type="time" value={attendanceForm.check_out_time} onChange={(e) => setAttendanceForm((p) => ({ ...p, check_out_time: e.target.value }))} className={field} />
              <select value={attendanceForm.status} onChange={(e) => setAttendanceForm((p) => ({ ...p, status: e.target.value as AttendanceStatus }))} className={field}><option value="PRESENT">{statusText('PRESENT')}</option><option value="LATE">{statusText('LATE')}</option><option value="ABSENT">{statusText('ABSENT')}</option><option value="LEAVE">{statusText('LEAVE')}</option></select>
              <textarea value={attendanceForm.notes} onChange={(e) => setAttendanceForm((p) => ({ ...p, notes: e.target.value }))} className={field} rows={3} placeholder={tr('ملاحظات', 'Notes')} />
              <button type="submit" className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white">{tr('حفظ الحضور', 'Save Attendance')}</button>
            </form>
            <div className={`${card} xl:col-span-2 overflow-auto`}>
              <table className="min-w-full text-sm"><thead><tr><th className={`p-2 ${align}`}>{tr('الموظف', 'Employee')}</th><th className={`p-2 ${align}`}>{tr('التاريخ', 'Date')}</th><th className={`p-2 ${align}`}>{tr('دخول', 'In')}</th><th className={`p-2 ${align}`}>{tr('خروج', 'Out')}</th><th className={`p-2 ${align}`}>{tr('الحالة', 'Status')}</th><th className={`p-2 ${align}`}>{tr('إجراء', 'Action')}</th></tr></thead><tbody>{dayAttendance.map((r) => <tr key={r.id} className="border-t border-slate-200 dark:border-slate-700"><td className={`p-2 ${align}`}>{employeeName.get(r.employee_id) || '-'}</td><td className={`p-2 ${align}`}>{r.attendance_date}</td><td className={`p-2 ${align}`}>{r.check_in_time || '-'}</td><td className={`p-2 ${align}`}>{r.check_out_time || '-'}</td><td className={`p-2 ${align}`}>{statusText(r.status)}</td><td className={`p-2 ${align}`}><button onClick={() => deleteRow('employee_attendance', r.id)} className="text-rose-600 hover:underline">{tr('حذف', 'Delete')}</button></td></tr>)}</tbody></table>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'compensation' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <form onSubmit={addCompensation} className={`${card} space-y-3`}>
            <h2 className={`font-semibold ${align}`}>{tr('إضافة بند مالي', 'Add Compensation')}</h2>
            <select value={compForm.employee_id} onChange={(e) => setCompForm((p) => ({ ...p, employee_id: e.target.value }))} className={field} required><option value="">{tr('اختر موظف', 'Select employee')}</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
            <input type="date" value={compForm.entry_date} onChange={(e) => setCompForm((p) => ({ ...p, entry_date: e.target.value }))} className={field} />
            <select value={compForm.entry_type} onChange={(e) => setCompForm((p) => ({ ...p, entry_type: e.target.value as CompensationType }))} className={field}><option value="SALARY">{statusText('SALARY')}</option><option value="BONUS">{statusText('BONUS')}</option><option value="PENALTY">{statusText('PENALTY')}</option><option value="ADVANCE">{statusText('ADVANCE')}</option></select>
            <input type="number" step="0.01" value={compForm.amount} onChange={(e) => setCompForm((p) => ({ ...p, amount: e.target.value }))} className={field} placeholder={tr('المبلغ', 'Amount')} required />
            <textarea value={compForm.notes} onChange={(e) => setCompForm((p) => ({ ...p, notes: e.target.value }))} className={field} rows={3} placeholder={tr('ملاحظات', 'Notes')} />
            <button type="submit" className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white">{tr('حفظ البند', 'Save Entry')}</button>
          </form>
          <div className={`${card} xl:col-span-2 overflow-auto`}>
            <table className="min-w-full text-sm"><thead><tr><th className={`p-2 ${align}`}>{tr('الموظف', 'Employee')}</th><th className={`p-2 ${align}`}>{tr('التاريخ', 'Date')}</th><th className={`p-2 ${align}`}>{tr('النوع', 'Type')}</th><th className={`p-2 ${align}`}>{tr('المبلغ', 'Amount')}</th><th className={`p-2 ${align}`}>{tr('إجراء', 'Action')}</th></tr></thead><tbody>{monthComp.map((r) => <tr key={r.id} className="border-t border-slate-200 dark:border-slate-700"><td className={`p-2 ${align}`}>{employeeName.get(r.employee_id) || '-'}</td><td className={`p-2 ${align}`}>{r.entry_date}</td><td className={`p-2 ${align}`}>{statusText(r.entry_type)}</td><td className={`p-2 ${align}`}>{toMoney(Number(r.amount || 0))}</td><td className={`p-2 ${align}`}><button onClick={() => deleteRow('employee_compensations', r.id)} className="text-rose-600 hover:underline">{tr('حذف', 'Delete')}</button></td></tr>)}</tbody></table>
          </div>
          <div className={`${card} xl:col-span-3 overflow-auto`}>
            <h3 className={`font-semibold mb-2 ${align}`}>{tr('ملخص الرواتب الشهرية', 'Monthly Payroll Summary')}</h3>
            <table className="min-w-full text-sm"><thead><tr><th className={`p-2 ${align}`}>{tr('الموظف', 'Employee')}</th><th className={`p-2 ${align}`}>{tr('المرتب', 'Salary')}</th><th className={`p-2 ${align}`}>{tr('المكافآت', 'Bonus')}</th><th className={`p-2 ${align}`}>{tr('الجزاءات', 'Penalty')}</th><th className={`p-2 ${align}`}>{tr('السلف', 'Advance')}</th><th className={`p-2 ${align}`}>{tr('الصافي', 'Net')}</th></tr></thead><tbody>{payroll.map((r) => <tr key={r.employeeId} className="border-t border-slate-200 dark:border-slate-700"><td className={`p-2 ${align}`}>{r.employeeName}</td><td className={`p-2 ${align}`}>{toMoney(r.salary)}</td><td className={`p-2 ${align}`}>{toMoney(r.bonus)}</td><td className={`p-2 ${align}`}>{toMoney(r.penalty)}</td><td className={`p-2 ${align}`}>{toMoney(r.advance)}</td><td className={`p-2 font-semibold ${align}`}>{toMoney(r.net)}</td></tr>)}</tbody></table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesManagement;
