declare let _extends: never[];
export { _extends as extends };
export declare let parser: string;
export declare namespace parserOptions {
    let ecmaVersion: number;
    let project: string[];
}
export declare let plugins: string[];
export declare namespace env {
    let es2016: boolean;
    let browser: boolean;
    let jest: boolean;
}
export declare let rules: {
    "@typescript-eslint/no-explicit-any": string;
    "@typescript-eslint/no-unused-vars": (string | {
        args: string;
    })[];
    "@typescript-eslint/naming-convention": (string | {
        selector: string;
        format: string[];
        leadingUnderscore: string;
        trailingUnderscore: string;
        modifiers?: undefined;
        prefix?: undefined;
    } | {
        selector: string;
        modifiers: string[];
        format: string[];
        leadingUnderscore: string;
        trailingUnderscore: string;
        prefix?: undefined;
    } | {
        selector: string;
        format: string[];
        prefix: string[];
        leadingUnderscore?: undefined;
        trailingUnderscore?: undefined;
        modifiers?: undefined;
    })[];
    "dot-notation": string;
    "@typescript-eslint/dot-notation": string;
    "consistent-return": string;
    "@typescript-eslint/consistent-return": string;
    "@typescript-eslint/consistent-type-assertions": (string | {
        assertionStyle: string;
        objectLiteralTypeAssertions: string;
    })[];
    "default-param-last": string;
    "@typescript-eslint/default-param-last": string;
    "@typescript-eslint/explicit-function-return-type": string;
    "@typescript-eslint/explicit-module-boundary-types": string;
    "@typescript-eslint/explicit-member-accessibility": (string | {
        accessibility: string;
        overrides: {
            constructors: string;
        };
    })[];
    "init-declarations": string;
    "@typescript-eslint/init-declarations": string;
    "@typescript-eslint/method-signature-style": string[];
    "no-array-constructor": string;
    "@typescript-eslint/no-array-constructor": string;
    "@typescript-eslint/no-array-delete": string;
    "@typescript-eslint/no-confusing-non-null-assertion": string;
    "@typescript-eslint/no-confusing-void-expression": string;
    "@typescript-eslint/no-duplicate-enum-values": string;
    "@typescript-eslint/no-duplicate-type-constituents": string;
    "@typescript-eslint/no-empty-interface": string;
    "@typescript-eslint/no-floating-promises": string;
    "@typescript-eslint/no-for-in-array": string;
    "@typescript-eslint/no-import-type-side-effects": string;
    "@typescript-eslint/no-inferrable-types": string;
    "@typescript-eslint/no-namespace": string;
    "@typescript-eslint/no-this-alias": string;
    "no-throw-literal": string;
    "@typescript-eslint/no-throw-literal": string;
    "@typescript-eslint/no-unnecessary-condition": string;
    "@typescript-eslint/no-unnecessary-type-constraint": string;
    "@typescript-eslint/no-unsafe-declaration-merging": string;
    "@typescript-eslint/no-unsafe-unary-minus": string;
    "@typescript-eslint/no-use-before-define": string;
    "@typescript-eslint/prefer-function-type": string;
    "prefer-promise-reject-errors": string;
    "@typescript-eslint/prefer-readonly": string;
    "@typescript-eslint/restrict-plus-operands": string;
    "@typescript-eslint/restrict-template-expressions": string;
    "@typescript-eslint/typedef": string;
    "@typescript-eslint/unbound-method": string;
    "@typescript-eslint/unified-signatures": string;
    semi: string;
    "no-extra-semi": string;
    "@typescript-eslint/no-extra-semi": string;
    "comma-dangle": string;
    "@typescript-eslint/comma-dangle": string;
    quotes: string;
    "@typescript-eslint/quotes": string[];
    "@typescript-eslint/member-delimiter-style": (string | {
        multiline: {
            delimiter: string;
            requireLast: boolean;
        };
        singleline: {
            delimiter: string;
            requireLast: boolean;
        };
        multilineDetection: string;
    })[];
};
