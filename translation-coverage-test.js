// Translation Coverage Test
import fs from 'fs';

// Function to get all keys from a nested object
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Read translation files
const enTranslations = JSON.parse(fs.readFileSync('/workspaces/VeloFlux/src/locales/en/translation.json', 'utf8'));
const ptTranslations = JSON.parse(fs.readFileSync('/workspaces/VeloFlux/src/locales/pt-BR/translation.json', 'utf8'));

// Get all keys from both files
const enKeys = getAllKeys(enTranslations);
const ptKeys = getAllKeys(ptTranslations);

console.log('=== Translation Coverage Report ===');
console.log(`English keys: ${enKeys.length}`);
console.log(`Portuguese keys: ${ptKeys.length}`);

// Find missing keys in pt-BR
const missingInPT = enKeys.filter(key => !ptKeys.includes(key));
const missingInEN = ptKeys.filter(key => !enKeys.includes(key));

console.log('\n=== Missing in Portuguese (pt-BR) ===');
if (missingInPT.length === 0) {
  console.log('✅ All English keys are present in Portuguese!');
} else {
  console.log(`❌ Missing ${missingInPT.length} keys:`);
  missingInPT.forEach(key => console.log(`  - ${key}`));
}

console.log('\n=== Missing in English ===');
if (missingInEN.length === 0) {
  console.log('✅ All Portuguese keys are present in English!');
} else {
  console.log(`❌ Missing ${missingInEN.length} keys:`);
  missingInEN.forEach(key => console.log(`  - ${key}`));
}

console.log('\n=== Summary ===');
const totalUnique = new Set([...enKeys, ...ptKeys]).size;
console.log(`Total unique keys: ${totalUnique}`);
console.log(`Coverage: ${((totalUnique - missingInPT.length) / totalUnique * 100).toFixed(1)}%`);

if (missingInPT.length === 0 && missingInEN.length === 0) {
  console.log('🎉 Perfect translation coverage!');
} else {
  console.log('📝 Translation files need synchronization.');
}
