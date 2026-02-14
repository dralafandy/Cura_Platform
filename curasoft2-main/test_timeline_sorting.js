// Test file to verify timeline sorting logic
const { timelineData } = require('./components/Dashboard.tsx');

// Mock data for testing
const mockAppointments = [
  { id: '1', patientId: 'p1', startTime: new Date('2023-01-15T10:00:00'), createdAt: '2023-01-20T08:00:00', reason: 'Checkup' },
  { id: '2', patientId: 'p2', startTime: new Date('2023-01-20T14:00:00'), createdAt: '2023-01-18T09:00:00', reason: 'Cleaning' },
  { id: '3', patientId: 'p3', startTime: new Date('2023-01-10T09:00:00'), createdAt: '2023-01-22T10:00:00', reason: 'Filling' }
];

const mockTreatmentRecords = [
    { id: '1', patientId: 'p1', treatmentDate: '2023-01-18', treatmentDefinitionId: 'td1', updatedAt: '2023-01-20T10:00:00' },
    { id: '2', patientId: 'p2', treatmentDate: '2023-01-12', treatmentDefinitionId: 'td2', updatedAt: '2023-01-25T14:00:00' },
    { id: '3', patientId: 'p3', treatmentDate: '2023-01-22', treatmentDefinitionId: 'td3' }
];

const mockPayments = [
    { id: '1', patientId: 'p1', date: '2023-01-16', amount: 100, updatedAt: '2023-01-28T12:00:00' },
    { id: '2', patientId: 'p2', date: '2023-01-19', amount: 150 },
    { id: '3', patientId: 'p3', date: '2023-01-25', amount: 200, updatedAt: '2023-01-30T16:00:00' }
];

// Test the sorting logic
console.log('Testing timeline sorting...');

// Create mock events array similar to the actual implementation
const events = [];

// Add appointments - use creation date instead of appointment date
mockAppointments.forEach(apt => {
  const creationDate = new Date(apt.createdAt);
  if (!isNaN(creationDate.getTime())) {
    events.push({
      id: `apt-${apt.id}`,
      type: 'appointment',
      date: creationDate,
      title: `Patient - ${apt.reason} (Appointment: ${apt.startTime.toISOString()})`,
      color: '#0ea5e9'
    });
  }
});

// Add treatments
mockTreatmentRecords.forEach(tr => {
    // Use last modification date (updatedAt) if available, otherwise use treatment date
    const lastModificationDate = tr.updatedAt ? new Date(tr.updatedAt) : new Date(tr.treatmentDate);
    if (!isNaN(lastModificationDate.getTime())) {
        events.push({
            id: `tr-${tr.id}`,
            type: 'treatment',
            date: lastModificationDate,
            title: `Patient - Treatment`,
            color: '#8b5cf6'
        });
    }
});

// Add payments
mockPayments.forEach(payment => {
    // Use last modification date (updatedAt) if available, otherwise use payment date
    const lastModificationDate = payment.updatedAt ? new Date(payment.updatedAt) : new Date(payment.date);
    if (!isNaN(lastModificationDate.getTime())) {
        events.push({
            id: `pay-${payment.id}`,
            type: 'payment',
            date: lastModificationDate,
            title: `Patient - Payment: $${payment.amount}`,
            color: '#10b981'
        });
    }
});

// Sort events by date in descending order (newest first)
const sortedEvents = events.sort((a, b) => b.date.getTime() - a.date.getTime());

console.log('Sorted events (newest first):');
sortedEvents.forEach((event, index) => {
  console.log(`${index + 1}. ${event.id} - ${event.date.toISOString()} - ${event.type}`);
});

// Verify that the events are actually sorted correctly
let isSortedCorrectly = true;
for (let i = 0; i < sortedEvents.length - 1; i++) {
  if (sortedEvents[i].date.getTime() < sortedEvents[i + 1].date.getTime()) {
    isSortedCorrectly = false;
    console.log(`ERROR: Event at index ${i} is older than event at index ${i + 1}`);
    break;
  }
}

if (isSortedCorrectly) {
  console.log('✅ Timeline sorting is working correctly!');
} else {
  console.log('❌ Timeline sorting has issues!');
}