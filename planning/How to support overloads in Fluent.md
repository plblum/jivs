Fluent extension methods are implemented through prototype assignment to support end-user extensibility, so practical TypeScript and VS Code overload support may be unavailable or limited.

This is not just a JavaScript limitation in the abstract. The fluent API is built by attaching one runtime function per method name onto the fluent builder prototypes. For example:

`FluentValidatorBuilder.prototype.dataTypeCheck = dataTypeCheck;`

That means there is only one JavaScript function named dataTypeCheck on the fluent builder at runtime.

The architectural reason for this design is important: it allows end users to add their own conditions and expose them through the builder in the same extensible pattern. If fluent methods were ordinary built-in TypeScript class methods, overload support and signature help would likely be easier, but end-user extensibility would be much harder or lost.

This creates a technical constraint behind several API-shape problems:

a single visible fluent method may need to carry multiple intended call shapes

the API cannot safely assume that overload-driven IntelliSense will rescue awkward signatures

some signatures may be more complex than ideal because they are absorbing cases that overloads might otherwise separate

This directly affects user experience in the IDE:

IntelliSense may show one main signature shape rather than a set of clear overload-style choices

parameter ordering becomes more important because the single visible signature has to teach the user how to call the method

natural-language reading becomes more important because later readers may not benefit from overload cues either

methods such as requireText(...), equalTo(...), and child-condition versions of those methods may therefore be carrying more burden than equivalent Builder methods


We have fixed this in a prototype using dataTypeCheck on the FluentValidatorBuilderExtensions.

1. Create overloads in the FluentValidatorBuilder in FluentValidatorBuilderExtensions.ts.
    ```ts
    declare module "./../ValueHosts/Fluent"
    {
        export interface FluentValidatorBuilder {
            /**
             * 
             * @param errorMessage 
             * The error message "template" that will appear on screen when the condition is NoMatch.
             * It can use tokens, which are resolved with current data at the time of validation.
             * If null, it will expect to be setup by one of several other sources including
             * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
             * @param validatorParameters 
             * Additional ways to customize the Validator, including localized error messages,
             * severity, and the enabler.
             */
            dataTypeCheck(
                errorMessage?: string | null,
                validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        // added this:
            dataTypeCheck(
                errorMessage: string): FluentValidatorBuilder;      
            dataTypeCheck(
                validatorParameters: FluentValidatorConfig): FluentValidatorBuilder;      
        }
    }                
    ```
2. Wire up the actual dataTypeCheck method to support those overloads in FluentValidatorBuilderExtensions.ts.
    ```ts
    function dataTypeCheck(errorMessage: string): FluentValidatorBuilder;
    function dataTypeCheck(validatorParameters: FluentValidatorConfig): FluentValidatorBuilder;
    function dataTypeCheck(
        errorMessage?: string | null,
        validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder

    function dataTypeCheck(
        arg1?: string | null | FluentValidatorConfig,
        arg2?: FluentValidatorConfig): FluentValidatorBuilder{
        // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty    
        let errorMessage: string | null | undefined;
        let validatorParameters: FluentValidatorConfig | undefined;
        if (typeof arg1 === 'string' || arg1 === null || arg1 === undefined) {
            errorMessage = arg1;
            validatorParameters = arg2;
        }
        else if (typeof arg1 === 'object') {
            errorMessage = undefined;
            validatorParameters = arg1;
        }

        return finishFluentValidatorBuilder(this,
            ConditionType.DataTypeCheck, _genCDDataTypeCheck(),
            errorMessage, validatorParameters);
    }
    ```
3. Write tests using VSCode intellisense to see if it takes the overloads into account.
    ```ts
    test('With only errorMessage creates ValidatorConfig with DataTypeCheckCondition with only type assigned and errorMessage assigned', () => {

        // original test case here
        let testItem = createFluent().field('Field1').dataTypeCheck('Error');
        TestFluentValidatorBuilder(testItem, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error'
        });
        //overloads
        let testItem2 = createFluent().field('Field1').dataTypeCheck({ errorMessage: 'Error' });
        let testItem3 = createFluent().field('Field1').dataTypeCheck(null, { errorMessage: 'Error' });
        let testItem4 = createFluent().field('Field1').dataTypeCheck();
        let testItem5 = createFluent().field('Field1').dataTypeCheck('Error', { summaryMessage: 'Summary' });

        TestFluentValidatorBuilder(testItem2, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error'
        });
        TestFluentValidatorBuilder(testItem3, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error'
        });
        TestFluentValidatorBuilder(testItem4, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            }
        });
        TestFluentValidatorBuilder(testItem5, <ValidatorConfig>{
            conditionConfig: <DataTypeCheckConditionConfig>{
                conditionType: ConditionType.DataTypeCheck
            },
            errorMessage: 'Error',
            summaryMessage: 'Summary'
        });        
    });
    ```    