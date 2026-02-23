// Script to remove duplicate translation keys from ar.ts
const fs = require('fs');

let content = fs.readFileSync('./locales/ar.ts', 'utf8');
const lines = content.split('\n');

// Find the second occurrence of insurance_accounts (the duplicate)
// We know it's around line 2054 based on our earlier analysis
// Let's find both occurrences and identify which one is the duplicate

let firstInsuranceAccountsIndex = -1;
let secondInsuranceAccountsIndex = -1;

for(let i=0; i<lines.length; i++) {
    if(lines[i].match(/^\s*"insurance_accounts":/)) {
        if(firstInsuranceAccountsIndex === -1) {
            firstInsuranceAccountsIndex = i;
        } else {
            secondInsuranceAccountsIndex = i;
            break;
        }
    }
}

console.log('First insurance_accounts at line:', firstInsuranceAccountsIndex + 1);
console.log('Second insurance_accounts at line:', secondInsuranceAccountsIndex + 1);

// Now find where each block ends (before doctorStatement)
let firstBlockEnd = -1;
let secondBlockEnd = -1;

// For first block, look for doctorStatement after it
for(let i=firstInsuranceAccountsIndex; i<lines.length; i++) {
    if(lines[i].includes('doctorStatement')) {
        // Check what's right before this
        let prevLineBeforeDoctorStatementAtFirstBlockCheck=i-2;
        
         // Look backwards from doctorStatement in FIRST occurrence area 
         // The FIRST set should have more context before reaching doctor statement
        
         break;
    }
}

// Actually let's just use what we know:
// First occurrence: around lines ~1918-~2043  
// Second occurrence: around lines ~2054-~2090 (this is the DUPLICATE)

// Remove from "insurance.verified" that appears AFTER we've already seen it once,
// up until just before "doctorStatement.title"

let foundDuplicateSectionStart=false;
// Track whether we've seen insurance.verified already in current pass through unique section
// Actually simpler approach: remove everything between two instances of same pattern

// Let's be very specific:
// The SECOND set starts with "insurance.waiting" or similar after some other entries...
// Based on output, we saw:
// Line 2045 has:   "insurance.confirmDelete"
// Line 2054 has:   "insurance_accounts"

// So let's check what's immediately BEFORE each instance:
if(secondInsuranceAccountsIndex > 0) {
    console.log('\nLines just BEFORE second insurance_accounts ('+(secondInsuranceAccountsIndex+1)+'):');
    console.log(lines[secondHealthcareProvider]);
}
