/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // La condition « react-native » pointe vers un build ESM (.mjs) ; en test on prend le build CommonJS.
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/e2e/'],
};
