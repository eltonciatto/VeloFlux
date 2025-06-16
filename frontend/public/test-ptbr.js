// Test script para simular usuário brasileiro
console.log('🇧🇷 Simulando usuário brasileiro...');

// Limpar qualquer configuração anterior
localStorage.clear();

// Simular linguagem pt-BR no browser
Object.defineProperty(navigator, 'language', {
  writable: true,
  value: 'pt-BR'
});

Object.defineProperty(navigator, 'languages', {
  writable: true,
  value: ['pt-BR', 'pt', 'en']
});

console.log('Browser language set to:', navigator.language);
console.log('Available languages:', navigator.languages);

// Recarregar página
setTimeout(() => {
  console.log('Reloading page to test pt-BR detection...');
  window.location.reload();
}, 1000);
