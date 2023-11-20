module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser for TypeScript
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the TypeScript ESLint plugin
  ],
  parserOptions: {
    ecmaVersion: 2020, // Allows modern ECMAScript features
    sourceType: "module", // Allows using 'import'/'export'
  },
  rules: {
    // Any custom rules or overrides go here
  },
};
