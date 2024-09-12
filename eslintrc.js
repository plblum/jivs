module.exports = {
  extends: [
    //    "eslint:recommended"
  ],
  // ignore patterns are in separate eslintignore file
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2016,
    project: ["./tsconfig.json"],
  },
  plugins: ["@typescript-eslint"],
  env: {
    es2016: true,
    browser: true,
    jest: true
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
    "@typescript-eslint/naming-convention": [
      "error",
      // {
      //   "selector": "default",
      //   "format": ["camelCase"]
      // },      
      {
        selector: "function",
        format: ["camelCase"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },
      {
        selector: "method",
        format: ["camelCase"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },
      {
        selector: "interface",
        format: ["PascalCase"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },
      {
        selector: "class",
        format: ["PascalCase"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },
      {
        // this means a field in Peter's lingo.
        selector: "classProperty",
        modifiers: ["private"],
        format: ["camelCase"],
        leadingUnderscore: "require",
        trailingUnderscore: "forbid",
      },
      {
        selector: "classProperty",
        modifiers: ["public", "protected"],
        format: ["camelCase"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },      
      { // property member of interface and class
        selector: "typeProperty",
        format: ["camelCase"],
        modifiers: ["public"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },
      { // get and set property names
        selector: "classicAccessor",
        format: ["PascalCase"],
        modifiers: ["public", "static"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },            
      { // get and set property names
        selector: "classicAccessor",
        format: ["camelCase"],
        modifiers: ["public"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },      
      { // get and set property names
        selector: "classicAccessor",
        format: ["camelCase"],
        modifiers: ["protected"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },
      {
        selector: "parameter",
        format: ["camelCase"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },

      // { // let and var variables
      //   selector: 'variable',
      //   format: ['camelCase'],
      //   leadingUnderscore: 'forbid',
      //   trailingUnderscore: 'forbid',
      // },
      {
        // global const
        selector: "variable",
        modifiers: ["const", "global"],
        format: ["PascalCase"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },
      {
        "selector": "typeParameter",
        "format": ["PascalCase"],
        "prefix": ["T"]
      },
      {
        selector: "enum",
        format: ["PascalCase"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },      
      {
        selector: "objectLiteralMethod",
        format: ["camelCase"],
        leadingUnderscore: "forbid",
        trailingUnderscore: "forbid",
      },
    ],

    "dot-notation": "off",
    "@typescript-eslint/dot-notation": "error",
    "consistent-return": "off",
    "@typescript-eslint/consistent-return": "error",
    "@typescript-eslint/consistent-type-assertions": [
      "error",
      { assertionStyle: "as", objectLiteralTypeAssertions: "allow" },
    ],
    "default-param-last": "off",
    "@typescript-eslint/default-param-last": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off", // because we use 'any'
    "@typescript-eslint/explicit-member-accessibility": [
      "error",
      {
        accessibility: "explicit",
        overrides: {
          constructors: 'off'
        }
      },
    ],
    "init-declarations": "off",
    "@typescript-eslint/init-declarations": "error",
    "@typescript-eslint/method-signature-style": ["off", "method"],
    "no-array-constructor": "off",
    "@typescript-eslint/no-array-constructor": "error",
    "@typescript-eslint/no-array-delete": "error",
    "@typescript-eslint/no-confusing-non-null-assertion": "error",
    "@typescript-eslint/no-confusing-void-expression": "error",
    "@typescript-eslint/no-duplicate-enum-values": "error",
    "@typescript-eslint/no-duplicate-type-constituents": "error",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-for-in-array": "error",
    "@typescript-eslint/no-import-type-side-effects": "error",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-namespace": "error",
    "@typescript-eslint/no-this-alias": "off",
    "no-throw-literal": "off",
    "@typescript-eslint/no-throw-literal": "error",
    "@typescript-eslint/no-unnecessary-condition": "off",
    "@typescript-eslint/no-unnecessary-type-constraint": "error",
    "@typescript-eslint/no-unsafe-declaration-merging": "error",
    "@typescript-eslint/no-unsafe-unary-minus": "error",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/prefer-function-type": "error",
    "prefer-promise-reject-errors": "off",
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/restrict-plus-operands": "error",
    "@typescript-eslint/restrict-template-expressions": "error",
    "@typescript-eslint/typedef": "error",
    "@typescript-eslint/unbound-method": "error",
    "@typescript-eslint/unified-signatures": "error",

    // deprecated style rules
    semi: "error",
    "no-extra-semi": "off",
    "@typescript-eslint/no-extra-semi": "error",
    "comma-dangle": "off",
    "@typescript-eslint/comma-dangle": "error",
    quotes: "off",
    "@typescript-eslint/quotes": ["error", "single"],
    "@typescript-eslint/member-delimiter-style": [
      "error",
      {
        multiline: {
          delimiter: "semi",
          requireLast: true,
        },
        singleline: {
          delimiter: "semi",
          requireLast: false,
        },
        multilineDetection: "brackets",
      },
    ],
  },
};
