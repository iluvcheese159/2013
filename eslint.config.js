export default [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", ".kilo/**"]
  },
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        browser: true,
        es2021: true,
        node: true,
        React: true,
        JSX: true,
        document: true,
        window: true,
        localStorage: true,
        process: true,
        setTimeout: true
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn"
    }
  }
];
