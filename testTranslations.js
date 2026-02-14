const fs = require('fs');

// Read and parse the translation files
const readTranslations = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/export const [a-zA-Z]+Translations = ({[\\s\\S]*?});/);
    if (match) {
        return eval('(' + match[1] + ')');
    }
    return {};
};

const enTranslations = readTranslations('./locales/en.ts');
const arTranslations = readTranslations('./locales/ar.ts');

// Test the specific keys
console.log('Testing Arabic translations:');
console.log('reports.financialReports:', arTranslations['reports.financialReports']);
console.log('reports.patientReports:', arTranslations['reports.patientReports']);
console.log('reports.doctorReports:', arTranslations['reports.doctorReports']);
console.log('reports.treatmentReports:', arTranslations['reports.treatmentReports']);
console.log('reports.supplierReports:', arTranslations['reports.supplierReports']);

// Check all reports keys
console.log('\nAll reports keys in Arabic:');
const reportsKeys = Object.keys(arTranslations).filter(key => key.startsWith('reports.'));
reportsKeys.sort().forEach(key => {
    console.log(`${key}: ${arTranslations[key]}`);
});
