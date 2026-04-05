module.exports = {
  // This tells ESLint not to look in parent folders
  root: true,
  env: {
    browser: true,
    commonjs: true,
    node: true, // Added node for CommonJS support
    es2021: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "script", // Default for CommonJS
  },
  rules: {
    // Add specific rules if needed
  },
};
