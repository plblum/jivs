import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

export default tseslint.config(

    // Ignores — replaces .eslintignore (flat config does not read that file)
    {
        ignores: [
            'node_modules/**',
            'packages/*/build/**',
            'packages/*/coverage/**',
            'packages/*/temp/**',
            'packages/*/tests/**',  
            'examples/**',
            'coverage/**',
            'starter_code/**',
            'typedoc/**',
            'docs/**',
            'typedoc_output/**',
            '**/*.js',
            '**/*.mjs',
        ],
    },

    {
        files: ['**/*.ts'],

        plugins: {
            '@typescript-eslint': tseslint.plugin,
            // @stylistic/eslint-plugin covers member-delimiter-style, which was
            // removed from @typescript-eslint in v6 and has no core ESLint equivalent.
            '@stylistic': stylistic,
        },

        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                // List both tsconfig variants so ESLint covers src/ (tsconfig.json)
                // AND tests/ (tsconfig_with_tests.json) in every package.
                // project: true only finds tsconfig.json, which explicitly excludes tests/.
                project: [
                    'packages/*/tsconfig.json'
                ],
                ecmaVersion: 2022,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest,
                ...globals.es2016,
            },
        },

        rules: {

            // ── Naming ─────────────────────────────────────────────────────────
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'function',
                    format: ['camelCase'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                    filter: {
                        regex: '_',
                        match: false
                    }  
                },
                {
                    selector: 'method',
                    format: ['camelCase'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                    filter: {
                        regex: '_',
                        match: false
                    }                    
                },
                {
                    selector: 'interface',
                    format: ['PascalCase'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    selector: 'class',
                    format: ['PascalCase'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    // private field — leading underscore required
                    selector: 'classProperty',
                    modifiers: ['private'],
                    format: ['camelCase'],
                    leadingUnderscore: 'require',
                    trailingUnderscore: 'forbid',
                },
                {
                    selector: 'classProperty',
                    modifiers: ['public', 'protected'],
                    format: ['camelCase'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    // public property member of interface and class
                    selector: 'typeProperty',
                    format: ['camelCase'],
                    modifiers: ['public'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    // public static accessors
                    selector: 'classicAccessor',
                    format: ['PascalCase'],
                    modifiers: ['public', 'static'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    // public accessors
                    selector: 'classicAccessor',
                    format: ['camelCase'],
                    modifiers: ['public'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    // protected accessors
                    selector: 'classicAccessor',
                    format: ['camelCase'],
                    modifiers: ['protected'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    selector: 'parameter',
                    format: ['camelCase'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    // global const — PascalCase
                    selector: 'variable',
                    modifiers: ['const', 'global'],
                    format: ['PascalCase'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    selector: 'typeParameter',
                    format: ['PascalCase'],
                    prefix: ['T'],
                },
                {
                    selector: 'enum',
                    format: ['PascalCase'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
                {
                    selector: 'objectLiteralMethod',
                    format: ['camelCase'],
                    leadingUnderscore: 'forbid',
                    trailingUnderscore: 'forbid',
                },
            ],

            // ── Type-aware rules ───────────────────────────────────────────────
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],

            'dot-notation': 'off',
            '@typescript-eslint/dot-notation': 'error',

            'consistent-return': 'off',
            '@typescript-eslint/consistent-return': 'error',

            '@typescript-eslint/consistent-type-assertions': [
                'error',
                { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow' },
            ],

            'default-param-last': 'off',
            '@typescript-eslint/default-param-last': 'error',

            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'off',

            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: { constructors: 'off' },
                },
            ],

            'init-declarations': 'off',
            '@typescript-eslint/init-declarations': 'warn',

            '@typescript-eslint/method-signature-style': ['off', 'method'],

            'no-array-constructor': 'off',
            '@typescript-eslint/no-array-constructor': 'error',

            '@typescript-eslint/no-array-delete': 'error',
            '@typescript-eslint/no-confusing-non-null-assertion': 'error',
            '@typescript-eslint/no-confusing-void-expression': 'error',
            '@typescript-eslint/no-duplicate-enum-values': 'error',
            '@typescript-eslint/no-duplicate-type-constituents': 'error',

            // no-empty-interface was deprecated in v7; replaced by no-empty-object-type.
            // Original was "off" — preserve that intent.
            '@typescript-eslint/no-empty-object-type': 'off',

            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-for-in-array': 'error',
            '@typescript-eslint/no-import-type-side-effects': 'error',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-namespace': 'error',
            '@typescript-eslint/no-this-alias': 'off',

            // no-throw-literal was renamed to only-throw-error in v6.
            'no-throw-literal': 'off',
            '@typescript-eslint/only-throw-error': 'error',

            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/no-unnecessary-type-constraint': 'error',
            '@typescript-eslint/no-unsafe-declaration-merging': 'error',
            '@typescript-eslint/no-unsafe-unary-minus': 'error',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/prefer-function-type': 'error',

            'prefer-promise-reject-errors': 'off',
            '@typescript-eslint/prefer-readonly': 'error',

            '@typescript-eslint/restrict-plus-operands': 'error',
            '@typescript-eslint/restrict-template-expressions': 'error',
            '@typescript-eslint/typedef': 'error',
            '@typescript-eslint/unbound-method': 'error',
            '@typescript-eslint/unified-signatures': 'warn',

            // ── Stylistic rules ────────────────────────────────────────────────
            // The @typescript-eslint versions of these were deprecated in v6 and
            // removed in v8. Core ESLint equivalents apply correctly to TS files
            // when the TypeScript parser is active.
            'semi': 'error',
            'no-extra-semi': 'off',                 // base rule off; @stylistic handles it
            'comma-dangle': 'error',                // was @typescript-eslint/comma-dangle
            'quotes': ['error', 'single'],          // was @typescript-eslint/quotes

            // member-delimiter-style has no core ESLint equivalent; lives in @stylistic.
            '@stylistic/member-delimiter-style': [
                'error',
                {
                    multiline: { delimiter: 'semi', requireLast: true },
                    singleline: { delimiter: 'semi', requireLast: false },
                    multilineDetection: 'brackets',
                },
            ],
        },
    },
);
