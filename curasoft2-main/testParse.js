const fs = require('fs');
const content = fs.readFileSync('./locales/ar.ts', 'utf8');
console.log('File content snippet (lines 980-1000):');
console.log(content.split('\n').slice(980, 1000).join('\n'));

// Try to parse just the reports section
const reportsSection = content.match(/("reports\.[^"]+": "[^"]+",?\s*)+/g);
console.log('\nReports section found:');
console.log(reportsSection);
