const fs = require('fs');
const content = fs.readFileSync('./locales/ar.ts', 'utf8');

console.log('Testing direct string extraction:');
const financialReports = content.match(/"reports\.financialReports":\s*"([^"]+)"/);
const patientReports = content.match(/"reports\.patientReports":\s*"([^"]+)"/);
const doctorReports = content.match(/"reports\.doctorReports":\s*"([^"]+)"/);
const treatmentReports = content.match(/"reports\.treatmentReports":\s*"([^"]+)"/);
const supplierReports = content.match(/"reports\.supplierReports":\s*"([^"]+)"/);

console.log('reports.financialReports:', financialReports ? financialReports[1] : 'Not found');
console.log('reports.patientReports:', patientReports ? patientReports[1] : 'Not found');
console.log('reports.doctorReports:', doctorReports ? doctorReports[1] : 'Not found');
console.log('reports.treatmentReports:', treatmentReports ? treatmentReports[1] : 'Not found');
console.log('reports.supplierReports:', supplierReports ? supplierReports[1] : 'Not found');

// Also check the en.ts file
console.log('\nChecking English translations:');
const enContent = fs.readFileSync('./locales/en.ts', 'utf8');
const enFinancialReports = enContent.match(/"reports\.financialReports":\s*"([^"]+)"/);
console.log('reports.financialReports:', enFinancialReports ? enFinancialReports[1] : 'Not found');
