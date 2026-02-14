import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { View, Appointment, LabCaseStatus } from '../types';
import { useI18n } from '../hooks/useI18n';
import sgMail from '@sendgrid/mail';

const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a2 2 0 10-4 0v.083A6 6 0 004 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const WhatsAppIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.062 17.498a9.423 9.423 0 0 1-4.71-1.392l-5.13.84 1.09-4.992a9.423 9.423 0 0 1-1.282-5.024C2.03 3.018 6.54-1.5 12 .002c5.46 1.5 8.97 7.018 7.47 12.478a9.423 9.423 0 0 1-7.408 5.02z"/></svg>);
const InventoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const LabCaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;

type NotificationItem = {
    id: string;
    type: 'appointment' | 'inventory' | 'lab' | 'overdue_payment' | 'low_stock';
    title: string;
    description: string;
    action?: () => void;
    actionLabel?: string;
    data: any;
    priority?: 'low' | 'medium' | 'high';
    escalationLevel?: number;
    date: Date;
};

interface NotificationBellProps {
    clinicData: ClinicData;
    setCurrentView: (view: View) => void;
    isFloating?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ clinicData, setCurrentView, isFloating = true }) => {
    const { t, locale } = useI18n();
    const { patients, appointments, updateAppointment, inventoryItems, labCases, payments, treatmentRecords } = clinicData;
    const [isOpen, setIsOpen] = useState(false);
    const [notificationMetrics, setNotificationMetrics] = useState({
        sent: 0,
        opened: 0,
        responded: 0
    });

    // Drag functionality
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const bellRef = useRef<HTMLDivElement>(null);

    // Load saved position from localStorage
    useEffect(() => {
        const savedPosition = localStorage.getItem('notificationBellPosition');
        console.log('Loading bell position:', savedPosition);
        if (savedPosition) {
            try {
                const parsed = JSON.parse(savedPosition);
                console.log('Parsed position:', parsed);
                // Validate position is within viewport bounds
                const maxX = window.innerWidth - 60;
                const maxY = window.innerHeight - 60;
                const validPosition = {
                    x: Math.max(20, Math.min(parsed.x || window.innerWidth - 100, maxX)),
                    y: Math.max(20, Math.min(parsed.y || window.innerHeight - 100, maxY))
                };
                console.log('Setting valid position:', validPosition);
                setPosition(validPosition);
            } catch (error) {
                console.error('Failed to parse saved position:', error);
                // Set default position to bottom right (movable)
                const defaultPos = { x: window.innerWidth - 100, y: window.innerHeight - 100 };
                console.log('Setting default position:', defaultPos);
                setPosition(defaultPos);
            }
        } else {
            // Set default position to bottom right (movable)
            const defaultPos = { x: window.innerWidth - 100, y: window.innerHeight - 100 };
            console.log('Setting default position (no saved):', defaultPos);
            setPosition(defaultPos);
        }
    }, []);

    // Save position to localStorage
    const savePosition = (newPosition: { x: number; y: number }) => {
        localStorage.setItem('notificationBellPosition', JSON.stringify(newPosition));
    };

    // Handle touch start for dragging (mobile support)
    const handleTouchStart = (e: React.TouchEvent) => {
        if (bellRef.current) {
            const touch = e.touches[0];
            const rect = bellRef.current.getBoundingClientRect();
            setDragOffset({
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            });
            setIsDragging(true);
        }
    };

    // Handle mouse down for dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (bellRef.current) {
            const rect = bellRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
            setIsDragging(true);
        }
    };

    // Handle touch move for dragging
    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                const touch = e.touches[0];
                const newX = touch.clientX - dragOffset.x;
                const newY = touch.clientY - dragOffset.y;

                // Constrain to viewport
                const maxX = window.innerWidth - 60; // Bell width
                const maxY = window.innerHeight - 60; // Bell height

                const constrainedPosition = {
                    x: Math.max(0, Math.min(newX, maxX)),
                    y: Math.max(0, Math.min(newY, maxY))
                };

                setPosition(constrainedPosition);
            }
        };

        const handleTouchEnd = () => {
            if (isDragging) {
                setIsDragging(false);
                savePosition(position);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;

                // Constrain to viewport
                const maxX = window.innerWidth - 60; // Bell width
                const maxY = window.innerHeight - 60; // Bell height

                const constrainedPosition = {
                    x: Math.max(0, Math.min(newX, maxX)),
                    y: Math.max(0, Math.min(newY, maxY))
                };

                setPosition(constrainedPosition);
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                savePosition(position);
            }
        };

        if (isDragging) {
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, position]);

    // Calculate dropdown direction based on bell position (reversed)
    const dropdownDirection = useMemo(() => {
        const bellCenterX = position.x + 30; // Bell is ~60px wide
        const bellCenterY = position.y + 30; // Bell is ~60px high
        const menuWidth = 288; // w-72 = 18rem = 288px
        const menuHeight = 200; // Approximate max height

        const openDown = bellCenterY < window.innerHeight / 2;
        const openRight = bellCenterX < window.innerWidth / 2;

        return {
            vertical: openDown ? 'up' : 'down',
            horizontal: openRight ? 'left' : 'right'
        };
    }, [position]);

    const notifications = useMemo(() => {
        const allNotifications: NotificationItem[] = [];
        const now = new Date();
        const lowStockThreshold = 10;
        const labCaseDueThresholdDays = 3;
        const overduePaymentThresholdDays = 30;

        // 1. Appointment Reminders
        appointments.forEach(apt => {
            if (apt.reminderSent || apt.reminderTime === 'none' || apt.startTime < now) return;

            const aptTime = apt.startTime.getTime();
            let reminderThreshold = 0;
            if (apt.reminderTime === '1_hour_before') reminderThreshold = 60 * 60 * 1000;
            else if (apt.reminderTime === '2_hours_before') reminderThreshold = 2 * 60 * 60 * 1000;
            else if (apt.reminderTime === '1_day_before') reminderThreshold = 24 * 60 * 60 * 1000;

            if ((aptTime - now.getTime()) <= reminderThreshold) {
                const patient = patients.find(p => p.id === apt.patientId);
                allNotifications.push({
                    id: `apt_${apt.id}`,
                    type: 'appointment',
                    title: patient?.name || t('common.unknownPatient'),
                    description: `${apt.reason} at ${new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(apt.startTime)}`,
                    actionLabel: t('reminders.sendReminder'),
                    action: () => handleSendReminder(apt),
                    data: apt,
                    priority: 'high',
                    date: apt.startTime
                });
            }
        });

        // 2. Low Inventory Alerts with Escalation
        inventoryItems.forEach(item => {
            if (item.currentStock <= lowStockThreshold) {
                const escalationLevel = item.currentStock <= 5 ? 2 : item.currentStock <= 8 ? 1 : 0;
                allNotifications.push({
                    id: `inv_${item.id}`,
                    type: 'low_stock',
                    title: t('notifications.lowStockAlert'),
                    description: t('notifications.lowStockMessage', {itemName: item.name, count: item.currentStock}),
                    actionLabel: t('sidebar.inventory'),
                    action: () => { setCurrentView('inventory'); setIsOpen(false); },
                    data: item,
                    priority: item.currentStock <= 5 ? 'high' : 'medium',
                    escalationLevel,
                    date: now
                });
            }
        });

        // 3. Lab Cases Due
        labCases.forEach(lc => {
             if ([LabCaseStatus.FITTED_TO_PATIENT, LabCaseStatus.CANCELLED].includes(lc.status)) return;
             const dueDate = new Date(lc.dueDate);
             const diffDays = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
             if(diffDays <= labCaseDueThresholdDays) {
                const patient = patients.find(p => p.id === lc.patientId);
                allNotifications.push({
                    id: `lab_${lc.id}`,
                    type: 'lab',
                    title: t('notifications.labCaseDueAlert'),
                    description: t('notifications.labCaseDueMessage', { caseType: lc.caseType, patientName: patient?.name || '', date: new Intl.DateTimeFormat(locale).format(dueDate)}),
                    actionLabel: t('sidebar.labCases'),
                    action: () => { setCurrentView('labCases'); setIsOpen(false); },
                    data: lc,
                    priority: diffDays <= 1 ? 'high' : 'medium',
                    date: dueDate
                });
             }
        });

        // 4. Overdue Payment Alerts
        treatmentRecords.forEach(tr => {
            const totalPaid = payments
                .filter(p => p.treatmentRecordId === tr.id)
                .reduce((sum, p) => sum + p.amount, 0);

            if (totalPaid < tr.totalTreatmentCost) {
                const treatmentDate = new Date(tr.treatmentDate);
                const daysSinceTreatment = (now.getTime() - treatmentDate.getTime()) / (1000 * 60 * 60 * 24);

                if (daysSinceTreatment > overduePaymentThresholdDays) {
                    const patient = patients.find(p => p.id === tr.patientId);
                    const outstandingAmount = tr.totalTreatmentCost - totalPaid;

                    allNotifications.push({
                        id: `overdue_${tr.id}`,
                        type: 'overdue_payment',
                        title: `Overdue Payment - ${patient?.name || 'Unknown Patient'}`,
                        description: `Outstanding balance: EGP ${outstandingAmount.toFixed(2)} (${Math.floor(daysSinceTreatment)} days overdue)`,
                        actionLabel: 'View Patient',
                        action: () => { setCurrentView('patients'); setIsOpen(false); },
                        data: { treatmentRecord: tr, patient, outstandingAmount },
                        priority: daysSinceTreatment > 60 ? 'high' : 'medium',
                        escalationLevel: Math.floor(daysSinceTreatment / 30),
                        date: treatmentDate
                    });
                }
            }
        });

        // Sort by type (appointments first), then by date (earliest first), then by priority
        return allNotifications.sort((a, b) => {
            // First prioritize appointment reminders above all else
            if (a.type === 'appointment' && b.type !== 'appointment') return -1;
            if (b.type === 'appointment' && a.type !== 'appointment') return 1;

            // Then sort by date (earliest first)
            const dateDiff = a.date.getTime() - b.date.getTime();
            if (dateDiff !== 0) return dateDiff;

            // Finally sort by priority and escalation level
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority || 'low'];
            const bPriority = priorityOrder[b.priority || 'low'];

            if (aPriority !== bPriority) return bPriority - aPriority;
            return (b.escalationLevel || 0) - (a.escalationLevel || 0);
        });
    }, [appointments, inventoryItems, labCases, patients, payments, treatmentRecords, setCurrentView, t, locale]);


    const handleSendReminder = async (appointment: Appointment, method: 'whatsapp' | 'email' | 'sms' = 'whatsapp') => {
        const patient = patients.find(p => p.id === appointment.patientId);
        const dentist = clinicData.dentists.find(d => d.id === appointment.dentistId);
        if (!patient) return;

        const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
        const timeFormatter = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });

        const message = clinicData.reminderMessageTemplate
            .replace(/\{patientName\}/g, patient.name)
            .replace(/\{doctorName\}/g, dentist?.name || '')
            .replace(/\{clinicName\}/g, clinicData.clinicInfo.name || 'عيادة كيوراسوف')
            .replace(/\{appointmentDate\}/g, dateFormatter.format(appointment.startTime))
            .replace(/\{appointmentTime\}/g, timeFormatter.format(appointment.startTime))
            .replace(/\{clinicAddress\}/g, clinicData.clinicInfo.address || '')
            .replace(/\{clinicPhone\}/g, clinicData.clinicInfo.phone || '');

        try {
            if (method === 'whatsapp') {
                let phoneNumber = patient.phone.replace(/[^0-9]/g, '');
                if (phoneNumber.startsWith('0')) {
                    phoneNumber = phoneNumber.substring(1);
                }
                const internationalPhoneNumber = `20${phoneNumber}`;
                const url = `https://wa.me/${internationalPhoneNumber}?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
            } else if (method === 'email' && patient.email) {
                // SendGrid integration (API key would be set in environment variables)
                sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
                await sgMail.send({
                    to: patient.email,
                    from: 'noreply@curasof.com',
                    subject: `Appointment Reminder - ${clinicData.clinicInfo.name}`,
                    text: message,
                    html: `<p>${message.replace(/\n/g, '<br>')}</p>`
                });
            } else if (method === 'sms' && patient.phone) {
                // SMS functionality disabled - Twilio removed
                console.log('SMS functionality is currently disabled');
                // Fallback to WhatsApp
                handleSendReminder(appointment, 'whatsapp');
            }

            // Update notification metrics
            setNotificationMetrics(prev => ({
                ...prev,
                sent: prev.sent + 1
            }));

            updateAppointment({ ...appointment, reminderSent: true });
            if (notifications.length <= 1) {
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Failed to send reminder:', error);
            // Fallback to WhatsApp if other methods fail
            if (method !== 'whatsapp') {
                handleSendReminder(appointment, 'whatsapp');
            }
        }
    };


    const renderNotificationContent = (item: NotificationItem) => {
        const priorityColors = {
            high: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/40 focus:ring-red-300 dark:focus:ring-red-600',
            medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 focus:ring-yellow-300 dark:focus:ring-yellow-600',
            low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40 focus:ring-blue-300 dark:focus:ring-blue-600'
        };

        switch(item.type) {
            case 'appointment':
                return (
                    <div className="mt-2 space-y-2">
                        <button
                            onClick={() => handleSendReminder(item.data, 'whatsapp')}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/40 focus:ring-green-300 dark:focus:ring-green-600"
                        >
                            <WhatsAppIcon /> WhatsApp
                        </button>
                         <div className="flex gap-1">
                            <button
                                onClick={() => handleSendReminder(item.data, 'email')}
                                className="flex-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-slate-600"
                                disabled={!item.data.patientId || !patients.find(p => p.id === item.data.patientId)?.email}
                            >
                                Email
                            </button>
                            <button
                                onClick={() => handleSendReminder(item.data, 'sms')}
                                className="flex-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-slate-600"
                                disabled={!item.data.patientId || !patients.find(p => p.id === item.data.patientId)?.phone}
                            >
                                SMS
                            </button>
                        </div>
                    </div>
                );
            case 'inventory':
            case 'lab':
            case 'low_stock':
            case 'overdue_payment':
                  return (
                    <button
                        onClick={item.action}
                        className={`mt-2 w-full flex items-center justify-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 ${priorityColors[item.priority || 'low']}`}
                    >
                        {item.type === 'inventory' || item.type === 'low_stock' ? <InventoryIcon/> : item.type === 'lab' ? <LabCaseIcon /> : '💰'} {item.actionLabel}
                    </button>
                );
            default:
                return null;
        }
    }

    if (isFloating) {
        return (
            <div
                ref={bellRef}
                className="fixed z-50 cursor-move select-none"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    userSelect: 'none',
                    touchAction: 'none'
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(prev => !prev);
                        }}
                        className={`relative p-3 rounded-full shadow-lg border-2 transition-all duration-200 ${
                            isDragging
                                ? 'bg-blue-500 border-blue-600 scale-110'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105'
                        }`}
                        aria-label={t('reminders.toggleNotifications')}
                    >
                        <BellIcon />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -end-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white dark:ring-slate-800 animate-pulse">
                                {notifications.length}
                            </span>
                        )}
                    </button>
                    {isOpen && (
                        <div className={`absolute w-72 max-w-[85vw] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-30 max-h-[50vh] overflow-hidden ${
                            dropdownDirection.vertical === 'up' ? 'top-full mt-2' : 'bottom-full mb-2'
                        } ${
                            dropdownDirection.horizontal === 'left' ? 'left-0' : 'right-0'
                        }`}>
                            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{t('reminders.pendingReminders')}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            Sent: {notificationMetrics.sent} | Opened: {notificationMetrics.opened}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsOpen(false);
                                            }}
                                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                                            aria-label="Close notifications"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {notifications.length > 0 ? (
                                <ul className="max-h-[60vh] overflow-y-auto">
                                    {notifications.map(item => (
                                        <li key={item.id} className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${
                                            item.priority === 'high' ? 'border-l-4 border-l-red-400 bg-red-50/30 dark:bg-red-900/20' :
                                            item.priority === 'medium' ? 'border-l-4 border-l-yellow-400 bg-yellow-50/30 dark:bg-yellow-900/20' :
                                            'border-l-4 border-l-blue-400 bg-blue-50/30 dark:bg-blue-900/20'
                                        }`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.title}</p>
                                                {item.escalationLevel && item.escalationLevel > 0 && (
                                                    <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                                                        Level {item.escalationLevel}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                                            {renderNotificationContent(item)}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">{t('reminders.noPendingReminders')}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    } else {
        return (
            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(prev => !prev);
                    }}
                    className="relative p-2 rounded-xl transition-all duration-300 group hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95"
                    aria-label={t('reminders.toggleNotifications')}
                >
                    {/* Modern bell with gradient effect */}
                    <div className="relative">
                        <div className={`p-1.5 rounded-lg transition-all duration-300 ${notifications.length > 0 ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20' : ''} group-hover:from-blue-500/20 group-hover:to-purple-500/20`}>
                            <BellIcon />
                            <div className={`absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-10 blur-sm transition-opacity duration-300`}></div>
                        </div>
                        
                        {/* Animated notification badge */}
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/30 ring-2 ring-white dark:ring-slate-800">
                                <span className="animate-pulse absolute inset-0 rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative">{notifications.length > 9 ? '9+' : notifications.length}</span>
                            </span>
                        )}
                    </div>
                </button>
                
                {isOpen && (
                    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 z-50 max-h-[70vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">


                        {/* Header with gradient */}
                        <div className="relative px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-white/20">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a2 2 0 10-4 0v.083A6 6 0 004 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{t('reminders.pendingReminders')}</h4>
                                        <p className="text-[10px] text-white/70">Sent: {notificationMetrics.sent} | Opened: {notificationMetrics.opened}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsOpen(false);
                                    }}
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                                    aria-label="Close notifications"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        {notifications.length > 0 ? (
                            <ul className="max-h-[50vh] overflow-y-auto">
                                {notifications.map((item, index) => (
                                    <li 
                                        key={item.id} 
                                        className={`relative p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 transition-all duration-200 group
                                            ${item.priority === 'high' ? 'bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/10' : ''}
                                            ${item.priority === 'medium' ? 'bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10' : ''}
                                            ${item.priority === 'low' ? 'bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10' : ''}
                                        `}
                                    >
                                        {/* Priority indicator line */}
                                        <div className={`absolute right-0 top-0 bottom-0 w-1 rounded-l-full ${
                                            item.priority === 'high' ? 'bg-gradient-to-b from-red-500 to-pink-500' :
                                            item.priority === 'medium' ? 'bg-gradient-to-b from-amber-500 to-orange-500' :
                                            'bg-gradient-to-b from-blue-500 to-cyan-500'
                                        }`}></div>
                                        
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="flex items-center gap-2">
                                                {/* Type icon */}
                                                <div className={`p-1.5 rounded-lg ${
                                                    item.type === 'appointment' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                                    item.type === 'low_stock' || item.type === 'inventory' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                                    item.type === 'lab' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                                                    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                }`}>
                                                    {item.type === 'appointment' && <WhatsAppIcon />}
                                                    {item.type === 'low_stock' || item.type === 'inventory' ? <InventoryIcon /> : null}
                                                    {item.type === 'lab' ? <LabCaseIcon /> : null}
                                                    {item.type === 'overdue_payment' && <span className="text-sm">💰</span>}
                                                </div>
                                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.title}</p>
                                            </div>
                                            {item.escalationLevel && item.escalationLevel > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                                    </svg>
                                                    Level {item.escalationLevel}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 pr-4">{item.description}</p>
                                        {renderNotificationContent(item)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a2 2 0 10-4 0v.083A6 6 0 004 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('reminders.noPendingReminders')}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">All caught up! 🎉</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
};

export default NotificationBell;
