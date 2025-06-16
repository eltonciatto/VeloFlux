// Simple test to check i18n configuration
console.log('Current language:', navigator.language);
console.log('Available languages:', navigator.languages);

// Test language detection logic
const detectedLanguage = navigator.language || navigator.languages?.[0];
console.log('Detected language:', detectedLanguage);

if (detectedLanguage?.startsWith('pt')) {
  console.log('Portuguese detected - should use pt-BR');
} else {
  console.log('Non-Portuguese language - should use EN');
}

// Check localStorage for saved language
console.log('Stored language:', localStorage.getItem('i18nextLng'));
