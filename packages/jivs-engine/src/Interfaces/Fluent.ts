/**
 * This is the syntax to build the ValueHostConfig (with all of its children) quickly
 * and succinctly. It is a fluent syntax that allows the developer to chain operations.
 * 
 * These tools are used in the Builder API (ValidationManagerConfigBuilder class), 
 * which is what the developer creates with the ValidatorManagerConfig that they are constructing.
 * Similarly, these tools are used in the Modifier API (ValidationManagerConfigModifier class), 
 * which is what the developer uses to modify the configuration after ValidationManager is created.
 * Effectively ValidationManagerConfigBuilder and ValidationManagerConfigModifier are wrapper classes
 * around ValueHostsManagerStartFluent.
 * 
 * With the following, assume 'let builder = new ValidationManagerConfigBuilder(vmConfig)'.
 * 
 * The user will start the fluent syntax with builder.field(), 
 * builder.static(), or builder.calc().
 * Those will setup the configs for each type of ValueHost
 * taking advantage of intellisense to expose the available properties
 * of the config, which may be a subset of the original.
 * 
 * `builder.field('valueHostName').[chained validators]`
 * 
 * With optional parameters:
 * 
 * `builder.field('valueHostName', 'datatype lookup key', { label: 'label' }).[chained validators];`
 * 
 * With optional parameters:
 * 
 * `builder.static('valueHostName').[chained functions]`
 * 
 *  With optional parameters:
 * 
 * `builder.static('valueHostName', 'datatype lookup key', { label: 'label' }).[chained builder functions];`
 * 
 * `builder.calc('valueHostName', 'datatype lookup key', function callback).[chained builder functions];`
 * 
 * For example:
 * ```ts
 * let builder = new ValidationManagerConfigBuilder(services);
 * builder.static('productVisible', LookupKey.Boolean);
 * builder.field('productName', LookupKey.String, { label: 'Name' }).requireText().regExp('^\w[\s\w]*$')`;
 * builder.field('price', LookupKey.Currency, { label: 'Price' }).greaterThanOrEqualValue(0.0)`;
 * builder.calc('maxPrice', LookupKey.Currency, calcMaxPrice); // calcMaxPrice is a function declared elsewhere
 * let vm = new ValidationManager(builder);
 * 
 * let modifier = vm.startModifying();
 * modifier.field('price').requireText();   // add this validator
 * modifier.apply();
 * ```
 * 
 * ## How this system works
 * 
 * Each condition class will define its fluent method based on its ConditionType name ("requireText", "regExp", etc).
 * They will use some TypeScript Declaration Merging magic to make their
 * class appear to be part of FluentValidatorBuilder and FluentConditionBuilder, classes that connect
 * the conditions to the FieldValueHostConfig or EvaluateChildConditionResultsConfig.
 * 
 * - ValidationManagerStartFluent - Class that starts a fluent chain. Its methods start FieldValueHost (field()),
 *   StaticValueHost (static()), CalcValueHost (calc()) and a collection of Conditions (conditions()).
 *   ```ts
 *   let fluent = new ValueHostsManagerStartFluent(null);
 *   fluent.field('Field1').requireText().regExp('pattern').greaterThanOrEqualValue(0);
 *   fluent.calc('Field2', LookupKey.Number, calcFn);
 *   fluent.static('Field3');
 *   ```
 * - ValidationManagerConfigBuilder - Wrapper around ValidationManagerStartFluent 
 *   that is used to create a ValidationManagerConfig. 
 *   It is the main entry point for the developer to create a ValidationManagerConfig.
 *   It has wrapper functions around field(), static(), and calc() that call the underlying fluent functions.
 * 
 *   ```ts
 *   let builder = new ValidationManagerConfigBuilder();
 *   builder.field('Field1').requireText().regExp('pattern').greaterThanOrEqualValue(0);
 *   builder.calc('Field2', LookupKey.Number, calcFn);
 *   builder.static('Field3');
 *   ```
 * 
 * - FluentValidatorBuilder - Class that supplies Conditions and Validators
 *   to the preceding FieldValueHost. It is returned by fluent.field() and each chained object that follows.
 *   ```ts
 *   fluent.field(field name) -> FluentValidatorBuilder
 *   ```
 *   It exposes functions specific to each Condition class, like requireText(), regExp(), greaterThanOrEqualValue(), etc.
 *   ```ts
 *   fluent.field('Field1').requireText(), regExp(), etc
 *   ```
 *   Then the individual condition takes over the fluent chain, returning a FluentValidatorBuilder 
 *   for the next condition.
 * 
 * - StartConditionBuilder  - 
 *   Starts a fluent sequence to create child conditions for a parent condition or validator. 
 *   At this point, we need to specify the valueHostName used for the upcoming condition,
 *   similar to how we specify it in fluent.field().
 *   ```ts
 *   childbuilder.fieldValue(valueHostName).condition()
 *   childbuilder.parentValue().condition()
 *   ```
 *   Conditions that support child conditions (like when, not, all, any, etc.) will use these builders 
 *   to create their child conditions.
 *   ```ts
 *   childbuilder.field('Field1').all(
 *      childBuilder -> FluentMultiFieldConditionBuilder) -> FluentValidatorBuilder
 *   childbuilder.field('Field1').when(
 *      whenBuilder -> FluentSingleFieldConditionBuilder,
 *      thenBuilder -> FluentSingleFieldConditionBuilder) -> FluentValidatorBuilder
 *   ```
 *   ```ts
 *   builder.field('Field1').all(
 *     (allBuilder : FluentMultiFieldConditionBuilder) => [
 *         allBuilder.fieldValue('Field2').requireText(),
 *         allBuilder.fieldValue('Field3').requireText()
 *      ]);
 *   builder.field('Field1').when(
 *      (whenBuilder : FluentSingleFieldConditionBuilder) => 
 *          whenBuilder.fieldValue('Field2').regExp('pattern'),
 *     (thenBuilder : FluentSingleFieldConditionBuilder) =>
 *        thenBuilder.fieldValue('Field3').requireText());
 *   );
 *   ```
 * 
 * - ConditionBuilder - Returned by StartConditionBuilder.parentValue() and fieldValue().
 *   Specifies the condition to apply to the parentValue/fieldValue.
 *   It has all available conditions as functions, like requireText(), regExp(), greaterThanOrEqualValue(), etc.
 *   The ultimate result is the syntax reading left to right.
 *     ```ts
 *     builder.fieldValue('Field1').requireText()
 *     builder.parentValue().lessThanValue(100)
 *     ```
 * #Extending the Fluent System to support your conditions
 * 1. Subclass ConditionBuilder and add your condition functions.
 *    ```ts
 *    // Suppose that you created EmailAddressCondition with its companion configuration
 *    // object, YourEmailConditionConfig.
 *    export class YourConditionBuilder extends ConditionBuilder {

 *          public emailAddress(allowMultiple: boolean): void {
 *              let config: Partial<YourEmailConditionConfig> =
 *              {
 *                  conditionType: 'EmailAddress',
 *                  allowMultiple: allowMultiple
 *              };
 *              this.setConfig(config as any);
 *          }
 *    }
 *    ```
 * 2. Subclass FluentValidatorBuilder and add your validator functions. This requires 2 overloads
 *    as shown here:
 *     ```ts
 *      // again wiring up your custom condition, EmailAddressCondition.
 * 
 *     export class YourFluentValidatorBuilder extends FluentValidatorBuilder {
 *          public emailAddress(
 *              allowMultiple: boolean,
 *              errorMessage?: string | null, 
 *              summaryMessage?: string | null): IFluentValidatorBuilder;
 *          public emailAddress(
 *              allowMultiple: boolean,
 *              validatorParameters: FluentValidatorConfig): IFluentValidatorBuilder;
 *          public emailAddress(
 *              allowMultiple: boolean,
 *              arg2?: FluentValidatorConfig | string | null,
 *              arg3?: string | null): IFluentValidatorBuilder {
 *              let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
 *                  this.resolveOverloadArgs<EmailAddressConditionConfig>(arg2, arg3);
 *              let conditionBuilder = new YourConditionBuilder(this);
 *              conditionBuilder.emailAddress(allowMultiple);
 *              return this.finish(conditionBuilder,
 *                  errorMessage, summaryMessage, validatorParameters);
 *          }
 *     }
 *     ```
 * 3. Register your custom builders with the FluentFactory which is in ValidationServices.
 *      ```ts
 *      // within the createValidationServices function, this code already exists, 
 *      // only needing removing comments:
 *      // --- FluentFactory -------------------------------------------
 *      let ff = new FluentFactory();
 *      vs.fluentFactory = ff;
 *      // Adding custom conditions to FluentValidatorBuilder and ConditionBuilder
 *      ff.setFluentValidatorBuilderCreator((parentConfig: FieldValueHostConfig) => {
 *          return new YourFluentValidatorBuilder(parentConfig);
 *      });
 *      ff.setConditionBuilderCreator((parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) => {
 *          return new YourConditionBuilder(parentBuilder, completed);
 *      });
 *      ```
 * @module Builder/Fluent
 * ## Switching to a different condition library
 *  
 * Jivs is designed to allow a replacement to its own conditions. Thus the fluent system
 * allows replacing the FluentValidatorBuilder and FluentConditionBuilder classes with your own.
 * Just register it with fluentFactory.singleton.register().
 */

import { CalcValueHostConfig } from './CalcValueHost';
import { FieldValueHostConfig } from "./FieldValueHost";
import { StaticValueHostConfig } from "./StaticValueHost";
import { ValidatorConfig } from './Validator';
import { ValidatorsValueHostBaseConfig } from './ValidatorsValueHostBase';
import { ValueHostConfig } from './ValueHost';


export type FluentStaticValueConfig = Omit<StaticValueHostConfig, 'valueHostType' | 'conditionType' | 'enablerConfig' >;
export type FluentStaticParameters = Omit<FluentStaticValueConfig, 'name' | 'dataType'>;

/**
 * For fluent field() function.
 */
export type FluentFieldValueConfig = Omit<FieldValueHostConfig, 'valueHostType' | 'conditionType' | 'validatorConfigs' | 'enablerConfig'>;
export type FluentFieldParameters = Omit<FluentFieldValueConfig, 'name' | 'dataType'>;

/**
 * For fluent calc() function.
 */
export type FluentCalcValueConfig = Omit<CalcValueHostConfig, 'valueHostType' | 'conditionType' | 'initialValue' | 'label' | 'labell10n' | 'enablerConfig'>;

/**
 * For fluent withoutValidators() function.
 */
export type FluentAnyValueHostConfig<T extends ValueHostConfig> = Omit<T, 'valueHostType' | 'conditionType' | 'validatorConfigs' | 'enablerConfig'>;
export type FluentAnyValueHostParameters<T extends ValueHostConfig> = Omit<FluentAnyValueHostConfig<T>, 'name' | 'dataType' >;

/**
 * for fluent withValidators() function.
 */
export type FluentValidatorsValueHostConfig<T extends ValidatorsValueHostBaseConfig> = Omit<T, 'valueHostType' | 'conditionType' | 'validatorConfigs' | 'enablerConfig'>;
export type FluentValidatorsValueHostParameters<T extends ValidatorsValueHostBaseConfig> = Omit<FluentValidatorsValueHostConfig<T>, 'name' | 'dataType'>;

/**
 * Targets fluent functions for conditions as their second parameter, hosting most of the 
 * properties needed for ValidatorConfig
 */
export type FluentValidatorConfig = Omit<ValidatorConfig, 'conditionConfig' | 'conditionCreator'>;

