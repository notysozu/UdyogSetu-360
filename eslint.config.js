const globals = require('globals');

module.exports = [
  {
    files: ['**/*.js'],
    ignores: ['**/node_modules/**', 'ai-service/**', 'services/ai-service/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.node
      }
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: ['error', 2],
      'comma-dangle': ['error', 'never'],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  }
];
