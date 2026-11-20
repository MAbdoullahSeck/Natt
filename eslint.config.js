// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    // Aucune couleur en dur : tout passe par src/theme (useCouleurs, creerStyles), y compris en mode sombre.
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message: 'Couleur en dur interdite : utiliser les jetons de src/theme (useCouleurs / creerStyles).',
        },
      ],
    },
  },
  {
    ignores: ['dist/*', 'coverage/*', 'src/lib/database.types.ts', 'supabase/functions/**', 'e2e/**', 'jest.setup.js'],
  },
]);
