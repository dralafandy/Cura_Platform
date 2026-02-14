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

// Get all reports-related keys
const reportsKeys = Object.keys(enTranslations).filter(key => key.startsWith('reports.'));

// Find missing keys in Arabic
const missingKeys = reportsKeys.filter(key => !arTranslations[key]);

console.log('Missing Arabic translation keys in reports section:');
console.log('---------------------------------------------');
missingKeys.forEach(key => {
    console.log(`- ${key}: "${enTranslations[key]}"`);
});
console.log('\nTotal missing keys:', missingKeys.length);

// Find all keys used in reports pages
const usedKeys = new Set();
const filesToCheck = [
    './components/reports/ReportsPage.tsx',
    './components/finance/ReportsDashboard.tsx',
    './components/finance/PatientReports.tsx',
    './components/finance/DoctorReports.tsx',
    './components/finance/FinancialReports.tsx',
    './components/finance/SupplierReports.tsx',
    './components/finance/TreatmentReports.tsx'
];

filesToCheck.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/t\(['"]([^'"]+)['"]\)/g);
    if (matches) {
        matches.forEach(match => {
            const key = match.match(/t\(['"]([^'"]+)['"]\)/)[1];
            usedKeys.add(key);
        });
    }
});

console.log('\nKeys used in reports pages:');
console.log('---------------------------');
Array.from(usedKeys).sort().forEach(key => {
    console.log(`- ${key}`);
});

// Find used keys that are missing in Arabic
const missingUsedKeys = Array.from(usedKeys).filter(key => !arTranslations[key]);

console.log('\nUsed keys missing in Arabic:');
console.log('---------------------------');
missingUsedKeys.forEach(key => {
    console.log(`- ${key}: "${enTranslations[key]}"`);
});
console.log('\nTotal used keys missing in Arabic:', missingUsedKeys.length);
