const fs = require('fs');

// Read and parse the English translation file
const readEnglishTranslations = () => {
    const content = fs.readFileSync('./locales/en.ts', 'utf8');
    return content;
};

// Read and parse the Arabic translation file
const readArabicTranslations = () => {
    const content = fs.readFileSync('./locales/ar.ts', 'utf8');
    return content;
};

// Extract all keys from a translation file content
const extractKeys = (content) => {
    const keys = [];
    const keyRegex = /"([^"]+)":/g;
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
        keys.push(match[1]);
    }
    return keys;
};

// Extract all keys used in reports files
const extractUsedKeys = () => {
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

    return Array.from(usedKeys).sort();
};

// Get all translation keys and used keys
const enContent = readEnglishTranslations();
const arContent = readArabicTranslations();
const enKeys = extractKeys(enContent);
const arKeys = extractKeys(arContent);
const usedKeys = extractUsedKeys();

// Find keys that are used in reports but missing in Arabic
const missingKeys = usedKeys.filter(key => !arKeys.includes(key));

// Create a list of translation key-value pairs from English
const getTranslationValue = (key, content) => {
    const regex = new RegExp(`"${key}":\\s*"([^"]*)"`, 'g');
    const match = regex.exec(content);
    return match ? match[1] : null;
};

console.log('Keys used in reports pages but missing in Arabic translation:');
console.log('-----------------------------------------------------------');
console.log('');

const missingTranslations = {};
missingKeys.forEach(key => {
    const enValue = getTranslationValue(key, enContent);
    if (enValue) {
        missingTranslations[key] = enValue;
    }
});

console.log(JSON.stringify(missingTranslations, null, 2));
console.log('');
console.log(`Total missing keys: ${Object.keys(missingTranslations).length}`);
