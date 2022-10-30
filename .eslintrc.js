module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['standard', 'eslint:recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint', // For TypeScript.
  ],
  overrides: [
    // Use `overrides` so ESLint can check both JS and TS files.
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
    },
  ],
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    quotes: ['error', 'double'], // Use double quotes.
    semi: ['error', 'always'], // Always add a semicolon at the end statements.
    indent: ['error', 2], // Indentation is two spaces.
    'no-console': 'error', // Avoid using methods on `console` in the code.
  },
};
