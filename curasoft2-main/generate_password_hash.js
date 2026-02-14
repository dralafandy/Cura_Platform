// Simple script to generate bcrypt password hash
// Run: node generate_password_hash.js "your_password"

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node generate_password_hash.js "your_password"');
  console.log('Password must be at least 6 characters with at least one letter and one number');
  process.exit(1);
}

if (password.length < 6) {
  console.log('Error: Password must be at least 6 characters');
  process.exit(1);
}

if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
  console.log('Error: Password must contain at least one letter and one number');
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('Password hash:', hash);
console.log('');
console.log('Copy this hash and update your user in Supabase:');
console.log(`UPDATE user_profiles SET password_hash = '${hash}' WHERE username = 'your_username';`);
