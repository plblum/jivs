import eslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    plugins: {
      eslintPlugin
    },
    files: [
      "src/**/*.ts",
      "tests/**/*.ts"],
    languageOptions: {
      ecmaVersion: 6,
      parser: tsParser,      
    }, 
    rules: {
        semi: "error",
    }
  }
];