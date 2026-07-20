/**
 * This is the syntax to build the ValueHostConfig (with all of its children) quickly
 * and succinctly. It is a fluent syntax that allows the developer to chain operations.
 * 
 * These tools are used in the Builder API (ValidationManagerConfigBuilder class), 
 * which is what the developer creates with the ValidatorManagerConfig that they are constructing.
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
 * ```
 * 
 * ## How this system works
 * 
 * Each condition class will define its fluent method based on its ConditionType name ("requireText", "regExp", etc).
 * They will use some TypeScript Declaration Merging magic to make their
 * class appear to be part of ValidatorBuilder and FluentConditionBuilder, classes that connect
 * the conditions to the FieldValueHostConfig or EvaluateChildConditionResultsConfig.
 * 
 * - ValidationManagerConfigBuilder - Class that starts a fluent chain. Its methods start FieldValueHost (field()),
 *   StaticValueHost (static()), CalcValueHost (calc()) and a collection of Conditions (conditions()).
 *   ```ts
 *   let builder = new ValueHostConfigBuilder(services);
 *   builder.field('Field1').requireText().regExp('pattern').greaterThanOrEqualValue(0);
 *   builder.calc('Field2', LookupKey.Number, calcFn);
 *   builder.static('Field3');
 *   ```
 * 
 * - ValidatorBuilder - Class that supplies Conditions and Validators
 *   to the preceding FieldValueHost. It is returned by builder.field() and each chained object that follows.
 *   ```ts
 *   builder.field(field name) -> ValidatorBuilder
 *   ```
 *   It exposes functions specific to each Condition class, like requireText(), regExp(), greaterThanOrEqualValue(), etc.
 *   ```ts
 *   builder.field('Field1').requireText(), regExp(), etc
 *   ```
 *   Then the individual condition takes over the fluent chain, returning a ValidatorBuilder 
 *   for the next condition.
 * 
 * - StartConditionBuilder  - 
 *   Starts a fluent sequence to create child conditions for a parent condition or validator. 
 *   At this point, we need to specify the valueHostName used for the upcoming condition,
 *   similar to how we specify it in builder.field().
 *   ```ts
 *   childbuilder.fieldValue(valueHostName).condition()
 *   childbuilder.parentValue().condition()
 *   ```
 *   Conditions that support child conditions (like when, not, all, any, etc.) will use these builders 
 *   to create their child conditions.
 *   ```ts
 *   childbuilder.field('Field1').all(
 *      childBuilder -> StartConditionWithChildrenBuilder) -> ValidatorBuilder
 *   childbuilder.field('Field1').when(
 *      whenBuilder -> StartConditionWithOneChildBuilder,
 *      thenBuilder -> StartConditionWithOneChildBuilder) -> ValidatorBuilder
 *   ```
 *   ```ts
 *   builder.field('Field1').all(
 *     (allBuilder : StartConditionWithChildrenBuilder) => [
 *         allBuilder.fieldValue('Field2').requireText(),
 *         allBuilder.fieldValue('Field3').requireText()
 *      ]);
 *   builder.field('Field1').when(
 *      (whenBuilder : StartConditionWithOneChildBuilder) => 
 *          whenBuilder.fieldValue('Field2').regExp('pattern'),
 *     (thenBuilder : StartConditionWithOneChildBuilder) =>
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
 * 2. Subclass ValidatorBuilder and add your validator functions. This requires 2 overloads
 *    as shown here:
 *     ```ts
 *      // again wiring up your custom condition, EmailAddressCondition.
 * 
 *     export class YourValidatorBuilder extends ValidatorBuilder {
 *          public emailAddress(
 *              allowMultiple: boolean,
 *              errorMessage?: string | null, 
 *              summaryMessage?: string | null): IValidatorBuilder;
 *          public emailAddress(
 *              allowMultiple: boolean,
 *              validatorParameters: FluentValidatorConfig): IValidatorBuilder;
 *          public emailAddress(
 *              allowMultiple: boolean,
 *              arg2?: FluentValidatorConfig | string | null,
 *              arg3?: string | null): IValidatorBuilder {
 *              let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
 *                  this.resolveOverloadArgs<EmailAddressConditionConfig>(arg2, arg3);
 *              let conditionBuilder = new YourConditionBuilder(this);
 *              conditionBuilder.emailAddress(allowMultiple);
 *              return this.finish(conditionBuilder,
 *                  errorMessage, summaryMessage, validatorParameters);
 *          }
 *     }
 *     ```
 * 3. Register your custom builders with the BuildersFactory which is in ValidationServices.
 *      ```ts
 *      // within the createValidationServices function, this code already exists, 
 *      // only needing removing comments:
 *      // --- BuildersFactory -------------------------------------------
 *      let ff = new BuildersFactory();
 *      vs.builderFactory = ff;
 *      // Adding custom conditions to ValidatorBuilder and ConditionBuilder
 *      ff.setValidatorBuilderCreator((parentConfig: FieldValueHostConfig) => {
 *          return new YourValidatorBuilder(parentConfig);
 *      });
 *      ff.setConditionBuilderCreator((parentBuilder: IBuilderConfigHost<object>, completed?: CompleteConfigBuilderHandler<any>) => {
 *          return new YourConditionBuilder(parentBuilder, completed);
 *      });
 *      ```
 * @module Builder/Fluent
 * ## Switching to a different condition library
 *  
 * Jivs is designed to allow a replacement to its own conditions. Thus the fluent system
 * allows replacing the ValidatorBuilder and ConditionBuilder classes with your own.
 * Just register them within the BuilderFactory in ValidationServices.
 */

import { CalcValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/CalcValueHost';
import { FieldValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { StaticValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/StaticValueHost";
import { ValidatorConfig } from '@plblum/jivs-engine/build/Interfaces/Validator';
import { ValidatorsValueHostBaseConfig } from '@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase';
import { ValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHost';


export type FluentStaticValueConfig = Omit<StaticValueHostConfig, 'valueHostType' | 'enablerConfig' | 'initialEnabled' >;
export type FluentStaticParameters = Omit<FluentStaticValueConfig, 'name' | 'dataType'>;

/**
 * For fluent field() function.
 */
export type FluentFieldValueConfig = Omit<FieldValueHostConfig, 'valueHostType' | 'validatorConfigs' | 'enablerConfig'>;
export type FluentFieldParameters = Omit<FluentFieldValueConfig, 'name' | 'dataType'>;

/**
 * For fluent calc() function.
 */
export type FluentCalcValueConfig = Omit<CalcValueHostConfig, 'valueHostType' | 'initialValue' | 'label' | 'labell10n' | 'enablerConfig' | 'initialEnabled'>;

/**
 * For fluent withoutValidators() function.
 */
export type FluentAnyValueHostConfig<T extends ValueHostConfig> = Omit<T, 'valueHostType' | 'validatorConfigs' | 'enablerConfig'>;
export type FluentAnyValueHostParameters<T extends ValueHostConfig> = Omit<FluentAnyValueHostConfig<T>, 'name' | 'dataType' >;

/**
 * for fluent withValidators() function.
 */
export type FluentValidatorsValueHostConfig<T extends ValidatorsValueHostBaseConfig> = Omit<T, 'valueHostType' |  'validatorConfigs' | 'enablerConfig'>;
export type FluentValidatorsValueHostParameters<T extends ValidatorsValueHostBaseConfig> = Omit<FluentValidatorsValueHostConfig<T>, 'name' | 'dataType'>;

/**
 * Targets fluent functions for conditions as their second parameter, hosting most of the 
 * properties needed for ValidatorConfig
 */
export type FluentValidatorConfig = Omit<ValidatorConfig, 'conditionConfig' | 'conditionCreator'>;

