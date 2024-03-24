module.exports = {
  extends: [
//    "eslint:recommended"
  ],  
  // ignore patterns are in separate eslintignore file
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2016
  },
  plugins: ["@typescript-eslint"],
  env: {
    es2016: true,
    browser: true,
    jest: true
  },  
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    semi: "error",
    "comma-dangle": "off",
    "@typescript-eslint/comma-dangle": "error",
    "@typescript-eslint/member-delimiter-style": ["error", {
      "multiline": {
        "delimiter": "semi",
        "requireLast": true
      },
      "singleline": {
        "delimiter": "semi",
        "requireLast": false
      },
      "multilineDetection": "brackets"
    }]

  }
};