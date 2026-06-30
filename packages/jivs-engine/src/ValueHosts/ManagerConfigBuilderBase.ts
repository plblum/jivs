/**
 * @inheritDoc ValueHosts/AbstractClasses/ManagerConfigBuilderBase!ManagerConfigBuilderBase:class
 * @module ValueHosts/AbstractClasses/ManagerConfigBuilderBase
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ValueHostConfig } from '../Interfaces/ValueHost';
import {
    FluentAnyValueHostConfig,
    FluentAnyValueHostParameters, FluentConditionBuilder, FluentStaticParameters, FluentValidatorBuilder, FluentValidatorsValueHostConfig, FluentValidatorsValueHostParameters, ValidationManagerStartFluent, ValueHostsManagerStartFluent
} from './Fluent';
import { StaticValueHostConfig } from '../Interfaces/StaticValueHost';
import { CalcValueHostConfig, CalculationHandler } from '../Interfaces/CalcValueHost';
import { IValueHostsServices } from '../Interfaces/ValueHostsServices';

import { ValueHostsManagerConfig } from '../Interfaces/ValueHostsManager';
import { toIServices, toIServicesAccessor } from '../Interfaces/Services';
import { CodingError, assertNotNull } from '../Utilities/ErrorHandling';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { deepClone, isPlainObject } from '../Utilities/Utilities';
import { ValidatorsValueHostBaseConfig } from '../Interfaces/ValidatorsValueHostBase';
import { IManagerConfigBuilder } from '../Interfaces/ManagerConfigBuilder';
import { ConditionConfig } from '../Interfaces/Conditions';
import { resolveErrorCode } from '../Utilities/Validation';
import { LoggingLevel } from '../Interfaces/LoggerService';
import { ValidatorConfig } from '../Interfaces/Validator';
import { ValueHostsManager } from './ValueHostsManager';
import { LoggerFacade } from '../Utilities/LoggerFacade';


/**
 * The ValueHostConfig object configures one ValueHost and its validators. 
 * That object isn't ideal for typing in configurations
 * (although its great if you have to write conversion between your own business logic
 * and Jivs).
 * 
 * The Builder and Modifier classes provide a fluent API to create the ValueHostConfig objects and add them to the ValidationManagerConfig.
 * ManagerConfigBuilderBase is the base class for both the Builder and Modifier classes.
 * 
 * The ManagerConfigBuilderBase provides a way to configure through meaningful code.
 * There are actually 2 of these, the builder and the modifier. ValueHostsManagerConfigBuilder is used for
 * the initial configuration passed into ValueHostManager/ValidationManager.
 * ValueHostsManagerConfigModifier is used to modify the configuration in an existing ValueHostManager.
 * 
 * Here are two ways to use it. 
 * 1) Wrapped in a ModelRulesBase subclass, so that your model has a single source of truth for its validation rules.
 * 2) Stand-alone.
 * 
  * ## Using ModelRulesBase
  * Let's assume that you have a Model with 3 fields, firstname, lastname, and birthdate. 
  * You want to require that first and last name are not empty, and that the birthdate is a valid date.
 * ```ts
 * export class PersonModelRules extends ModelRulesBase {
 *  protected configureRules(builder: ValidationManagerConfigBuilder, options?: RulesConfigOptions): void {
 *      builder.field('firstname', LookupKey.String).requireText({ errorMessage: 'Requires a value'});
 *      builder.field('lastname', LookupKey.String).requireText({ errorMessage: 'Requires a value'});
 *      builder.field('birthdate', LookupKey.Date);
 *   }
 * }
 * ```
 * The Form can consume the same rules, and can add its own. It must subclass the Model's own rules class
 * and implement the IAdaptModelRulesToForm interface, again using the Builder.
 * ```ts
 * export class PersonEditFormRules extends PersonModelRules implements IAdaptModelRulesToForm {
 *   adaptToForm(builder: ValidationManagerConfigBuilder, options?: RulesConfigOptions): void {
 *      builder.field('birthDate', null, { label: 'Birth date' })
 *        .lessThan('today');
 *      builder.static('today', LookupKey.Date, { initialValue: new Date() });
 *   }
 * }
 * ```
 * Once the ValidationManager is created, you can modify it later using the Modifier.
 * ```ts
 * let services = createValidatorServices();
 * let rules = new PersonEditFormRules(services);
 * let config = rules.configure();
 * let vm = new ValidationManager(config);
 * // later when you need to modify vm:
 * // in this example, the user's language is changed to French.
 * let modifier = vm.startModifying();
 * modifier.field('birthDate', null, { label: 'date de naissance'});   // let's disable the existing validator
 * modifier.apply(); // consider modifier disposed at this point
 * ```
 * ## Without the ModelRulesBase, using the Builder directly.
 * The code is very similar to that above, except you explicitly create the Builder and add the ValueHostConfigs to it.
 * In this case, you are likely to be working only on the UI, and can declare all fields at once.
 * ```ts
 * let services = createValidatorServices();
 * let builder = build(services);
 * builder.field('firstname', LookupKey.String).requireText({ errorMessage: 'Requires a value'});
 * builder.field('lastname', LookupKey.String).requireText({ errorMessage: 'Requires a value'});
 * builder.field('birthdate', LookupKey.Date, { label: 'Birth date' })
 *        .lessThan('today');
 * builder.static('today', LookupKey.Date, { initialValue: new Date() }
 * let vm = new ValidationManager(builder); // consider builder disposed at this point
 * // later when you need to modify vm:
 * // in this example, the user's language is changed to French.
 * let modifier = vm.startModifying();
 * modifier.field('birthDate', null, { label: 'date de naissance'});   // let's disable the existing validator
 * modifier.apply(); // consider modifier disposed at this point
 * ```
 * 
 * ## Combining a condition from the UI with the conditions from the business logic
 * This common use case is where the UI wants to add a condition to a Validator 
 * that was created by the business logic. Use the combineWithRule() 
 * and replaceConditionWith() functions.
 * 
 * The goal is to preserve the condition from the business logic by using it together with 
 * the UI's condition in one of these ways:
 * - Make the business logic's condition optional by wrapping it in a WhenCondition.
 *   ```ts
 *   // business logic
 *   builder.field('Field1', LookupKey.String).notNull();
 *   // UI wants it to look like this:
 *   builder.field('Field1', LookupKey.String)
 *      .when(
 *          (enablerBuilder)=> enablerBuilder.equalToValue('YES', 'Field2'),
 *          (childBuilder)=> childBuilder.notNull()
 *    );
 *   // using the combineConditionWith() function
 *   builder.field('Field1').combineConditionWith(
 *      ConditionType.NotNull, // error code
 *      CombineUsingCondition.When,
 *      (combiningBuilder)=> combiningBuilder.equalToValue('YES', 'Field2'));
 *   ```
 * - All conditions must evaluate as a match using the AllCondition
 *   ```ts
 *   // business logic
 *   builder.field('Field1', LookupKey.String).regexp(/^[A-Z]+$/i);
 *   // UI wants it to look like this:
 *   builder.field('Field1', LookupKey.String)
 *     .all((childrenBuilder)=> childrenBuilder.regexp(/^[A-Z]+$/i).stringLength(10));
 * 
 *   // using the combineWithRule() function
 *   builder.field('Field1').combineWithRule(
 *      ConditionType.NotNull, // error code
 *      CombineUsingCondition.All,
 *      (combiningBuilder)=> combiningBuilder.stringLength(10));
 *   ```
 * - Either condition can evaluate as a match using the AnyCondition
 * - The UI's condition is a complete replacement for the business logic's condition.
 *   // business logic
 *   builder.field('Field1', LookupKey.String).notNull();
 *   // UI wants it to look like this:
 *   builder.field('Field1', LookupKey.String)
 *     .all((childrenBuilder)=> childrenBuilder.requireText());   // because requireText() includes notNull() 
 * 
 *   // using the replaceConditionWith() function
 *   builder.field('Field1').replaceConditionWith(
 *      ConditionType.NotNull, // error code
 *      (replacementBuilder)=> replacementBuilder.requireText());
 *  ```
 */
export abstract class ManagerConfigBuilderBase<T extends ValueHostsManagerConfig>
    implements IManagerConfigBuilder<T> {

    constructor(services: IValueHostsServices)
    constructor(config: T)
    constructor(state: BuilderState<T>)
    constructor(arg1: IValueHostsServices | T | BuilderState<T>) {
        assertNotNull(arg1);
        if (arg1 instanceof BuilderState)
        {
            this._state = arg1;
            return;
        }
        let services = toIServices(arg1) as IValueHostsServices;
        if (services) {
            this._state = new BuilderState<T>({
                services: services,
                valueHostConfigs: []
            } as unknown as T);
        }
        else if (toIServicesAccessor(arg1) && // ensures we have the required 'services' property
            'valueHostConfigs' in arg1) {
            let baseConfig = arg1 as T;
            if (baseConfig.valueHostConfigs == null)  // null or undefined
                baseConfig.valueHostConfigs = [];
            this._state = new BuilderState<T>(baseConfig);
        }
        else
            throw new CodingError('Unexpected parameter value');
    }
    public dispose(): void {
        this._state = undefined!;
    }
    protected get state(): BuilderState<T> {
        return this._state;
    }
    private _state!: BuilderState<T>;

    /**
     * The state is not intended to be used directly. However, 
     * it is exposed to allow sharing it with other Builder or Modifier instances, 
     * so that they can edit the same configuration.
     * This member is not part of the IManagerConfigBuilder interface, and is not intended to be used directly.
     * @returns 
     */
    public handOffState(): BuilderState<T> {
        return this.state;
    }

    public get services(): IValueHostsServices {
        return this.baseConfig.services;
    }
    
    //#region logging

    /**
     * Provides an API for logging, sending entries to the loggerService.
     */
    protected get logger(): LoggerFacade
    {
        return this.state?.logger ?? undefined;
    }

    //#endregion logging

    /**
     * The initial setup from the constructor and assigned ValueHostConfigs
     * until an OverrideConfig is added.
     * It always retains the official services and callbacks.
     * Merging overrides updates this object.
     */
    protected get baseConfig(): T {     
        return this.state?.baseConfig ?? undefined;
    }

    /**
     * A ValueHostManagerConfig that is getting overridden ValueHost configurations.
     * Each are created by the addOverride() function.
     * They retain a reference to services.
     */
    protected get overriddenValueHostConfigs(): Array<Array<ValueHostConfig>> {
        return this.state?.overriddenValueHostConfigs ?? [];
    }

    protected assertNotDisposed(): void {
        if (this._state === undefined)
            throw new CodingError('Object disposed. Call before complete()');
    }

    /**
     * Starts a new ValueHostConfig array to collect ValueHostConfigs.
     * They will be merged into baseConfig at getValueHostsConfig();
     */
    protected addOverride(): void {
        let valueHostConfigs: Array<ValueHostConfig> = [];
        this.overriddenValueHostConfigs.push(valueHostConfigs);
    }

    /**
     * Exposes the ValueHostsConfig currently capturing content.
     * @returns 
     */
    protected destinationValueHostConfigs(): Array<ValueHostConfig> {
        if (this.overriddenValueHostConfigs.length)
            return this.overriddenValueHostConfigs[this.overriddenValueHostConfigs.length - 1];
        return this.baseConfig.valueHostConfigs;
    }

    /**
     * Delivers a complete ValueHostConfig and shuts down this instance.
     * You cannot use the instance after this point.
     * @returns 
     */
    public complete(): T {
        let vhms = this.baseConfig.services.valueHostConfigMergeService;

        // merge overrides into baseConfig
        let destination = this.baseConfig;
        this.overriddenValueHostConfigs.forEach((o) => {
            o.forEach((sourceConfig) => {
                let destinationConfig = vhms.identifyValueHostConflict(sourceConfig, destination.valueHostConfigs);
                if (destinationConfig) {
                    vhms.merge(sourceConfig, destinationConfig);    // changes destinationConfig directly
                }
                else
                    destination.valueHostConfigs.push(sourceConfig);

            });
        });
        this.dispose(); // every property will be undefined, including _baseConfig

        return destination;
    }

    /**
     * Creates the same output as complete() but does not modify the baseConfig
     * allowing it to be called multiple times.
     */
    public snapshot(): T {
        this.assertNotDisposed();
        
        let destination = ValueHostsManager.safeConfigClone(this.baseConfig) as T;
        let vhms = destination.services.valueHostConfigMergeService;

        this.overriddenValueHostConfigs.forEach((o) => {
            o.forEach((sourceConfig) => {
                sourceConfig = deepClone(sourceConfig); // don't change the original
                let destinationConfig = vhms.identifyValueHostConflict(sourceConfig, destination.valueHostConfigs);
                if (destinationConfig) {
                    vhms.merge(sourceConfig, destinationConfig);    // changes destinationConfig directly
                }
                else
                    destination.valueHostConfigs.push(sourceConfig);

            });
        });
        return destination;
    }
    
    /**
     * Track a new ValueHostConfig in the destinationConfig.
     * @param config 
     */
    protected applyConfig(config: ValueHostConfig): void {
        if (this.destinationValueHostConfigs().find((item) => item.name === config.name))
            throw new CodingError(`ValueHost name "${config.name}" already defined`);
        this.destinationValueHostConfigs().push(config);
    }

    /**
     * Supplies the ValidationManagerStartFluent object, already setup
     */
    protected abstract createFluent(): ValueHostsManagerStartFluent;

    /**
     * Gets a ValueHostConfig with matching name by looking in previous overrides and the baseConfig.
     * Goal is to find a ValueHostConfig that existed prior to creating the Modifier or using addOverride().
     * @param valueHostName - case sensitive match against existing
     * @param throwWhenNotFound 
     * @returns 
     */
    protected getExistingValueHostConfig(valueHostName: string, throwWhenNotFound: boolean): ValueHostConfig | null {

        let result: ValueHostConfig | null = null;

        if (this.overriddenValueHostConfigs.length > 0) // don't search baseConfig unless it has been overridden
        {
            for (let i = this.overriddenValueHostConfigs.length - 1; i >= 0; i--) {
                result = this.overriddenValueHostConfigs[i].find((item) => item.name === valueHostName) ?? null;
                if (result)
                    return result;
            }
            result = this.baseConfig.valueHostConfigs.find((item) => item.name === valueHostName) ?? null;
            if (result)
                return result;
        }

        if (throwWhenNotFound)
            throw new CodingError(`ValueHost name "${valueHostName}" is not defined.`);
        // istanbul ignore next   // currently no code passes in false for throwWhenNotFound
        return null;
    }


    //#region fluent for creating ValueHosts
    /**
     * Utility to use the Fluent system to add a ValueHostConfig to the ValueHostsManagerConfig.
     * @param valueHostType 
     * @param arg1 
     * @param arg2 
     * @param arg3 
     * @returns 
     */
    protected addValueHost<TVHConfig extends ValueHostConfig>(
        valueHostType: ValueHostType,
        arg1: ValueHostName | Partial<TVHConfig>,
        arg2?: Partial<TVHConfig> | string | null,
        arg3?: Partial<TVHConfig>): ManagerConfigBuilderBase<T> {
        assertNotNull(arg1, 'arg1');
        let fluent = this.createFluent();
        let vhConfig = fluent.withoutValidators<TVHConfig>(valueHostType,
            arg1 as FluentAnyValueHostConfig<TVHConfig> | ValueHostName,
            arg2 as FluentAnyValueHostParameters<TVHConfig> | string | null,
            arg3 as FluentAnyValueHostParameters<TVHConfig>);
        this.applyConfig(vhConfig);
        return this;
    }

    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a StaticValueHostConfig.
     * @returns Same instance for chaining.
     */
    public static(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentStaticParameters): ManagerConfigBuilderBase<T>;

    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a StaticValueHostConfig.
     * @returns Same instance for chaining.
     */
    public static(valueHostName: ValueHostName, parameters: FluentStaticParameters): ManagerConfigBuilderBase<T>;
    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire StaticValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns Same instance for chaining.
     */
    public static(config: Omit<StaticValueHostConfig, 'valueHostType' | 'enablerConfig'>): ManagerConfigBuilderBase<T>;
    // overload resolution
    public static(arg1: ValueHostName | StaticValueHostConfig, arg2?: FluentStaticParameters | string | null, arg3?: FluentStaticParameters): ManagerConfigBuilderBase<T> {
        this.assertNotDisposed();
        assertNotNull(arg1, 'arg1');
        return this.addValueHost<StaticValueHostConfig>(ValueHostType.Static, arg1, arg2, arg3);
    }

    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param dataType - can be null. The value for ValueHost.dataType.
     * @param calcFn - required. Function callback.
     * @returns Same instance for chaining.
     */
    public calc(valueHostName: ValueHostName, dataType: string | null | undefined, calcFn: CalculationHandler): ManagerConfigBuilderBase<T>;
    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire CalcValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns Same instance for chaining.
     */
    public calc(config: Omit<CalcValueHostConfig, 'valueHostType'>): ManagerConfigBuilderBase<T>;
    // overload resolution
    public calc(arg1: ValueHostName | CalcValueHostConfig, dataType?: string | null, calcFn?: CalculationHandler): ManagerConfigBuilderBase<T> {
        this.assertNotDisposed();
        assertNotNull(arg1, 'arg1');
        let fluent = this.createFluent();
        let vhConfig: CalcValueHostConfig;

        if (isPlainObject(arg1)) {
            vhConfig = fluent.calc(arg1 as CalcValueHostConfig);
        }
        else if (typeof arg1 === 'string') {
            vhConfig = fluent.calc(arg1, dataType ?? null, calcFn!);
        }
        else
            throw new TypeError('Must pass valuehost name or CalcValueHostConfig');
        this.applyConfig(vhConfig);
        return this;
    }

    //#endregion fluent for creating ValueHosts
    protected assertValueHostType(valueHostConfig: ValueHostConfig | null, expectedType: ValueHostType): void {
        assertNotNull(valueHostConfig, 'valueHostConfig');
        let valueHostType = valueHostConfig!.valueHostType;
        // istanbul ignore next  // currently not possible to test valueHostType === null
        if (valueHostType == null) // null or undefined
            if ((valueHostConfig! as ValidatorsValueHostBaseConfig).validatorConfigs == null) // null or undefined
                valueHostType = ValueHostType.Static;
            else
                valueHostType = ValueHostType.Field;

        if (valueHostType !== expectedType)
            throw new CodingError(`ValueHost name "${valueHostConfig!.name}" is not type=${expectedType}.`);

    }

    /**
     * Attaches an enabler Condition to a ValueHost. The Enabler Condition is actually a ConditionConfig object used
     * to create the Condition. This is used to enable or disable the ValueHost based on the condition.
     * If called on a ValueHost already with an enabler, it will replace the existing enabler.
     * @param valueHostName 
     * @param conditionConfig - An actual conditionConfig
     */
    public enabler(valueHostName: ValueHostName, conditionConfig: ConditionConfig): ManagerConfigBuilderBase<T> 
    /**
     * Using the Builder API
     * @param valueHostName 
     * @param builderFn - A function that will build the conditionConfig with the Builder API
     */
    public enabler(valueHostName: ValueHostName, builderFn: ((enablerBuilder: FluentConditionBuilder) => void)): ManagerConfigBuilderBase<T>

    public enabler(valueHostName: ValueHostName, sourceOfConditionConfig: ConditionConfig | ((enablerBuilder: FluentConditionBuilder) => void)): ManagerConfigBuilderBase<T> {
        function getValueHostConfig(): ValueHostConfig
        {
            // replace condition in existing ValueHostConfig if in destinationValueHostConfigs.
            let vhToModify = self.destinationValueHostConfigs().find((item) => item.name === valueHostName) as ValidatorsValueHostBaseConfig | undefined;
            if (vhToModify) {
                return vhToModify;
            }
            // find in earlier arrays. Clone the ValueHostConfig and add it to the current array, replacing the validator's condition
            let vhToClone = self.getExistingValueHostConfig(valueHostName, false) as ValidatorsValueHostBaseConfig;
            if (vhToClone) {
                let clonedVH = deepClone(vhToClone) as ValidatorsValueHostBaseConfig;
                self.destinationValueHostConfigs().push(clonedVH);
                return vhToClone;
            }
            let error = new CodingError(`ValueHost name "${valueHostName}" is not defined.`);
            self.logger.error(error);
            throw error;
        }
        function attachEnablerCondition(vhConfig: ValueHostConfig, enabler: ConditionConfig): void {
            let replace = vhConfig.enablerConfig != null;   // null or undefined
            vhConfig.enablerConfig = enabler;
            self.logger.message(LoggingLevel.Info, () => (replace ? 'Replacing enabler on' : 'Adding enabler to') + ` ValueHost "${valueHostName}"`);

        }   
        let self = this;
        this.assertNotDisposed();
        assertNotNull(valueHostName, 'valueHostName');
        assertNotNull(sourceOfConditionConfig, 'sourceOfConditionConfig');
        this.logger.message(LoggingLevel.Debug, () => `enabler("${valueHostName}")`);
        
        if (typeof sourceOfConditionConfig === 'function') {
            let vhConfig = getValueHostConfig();
            let builder = new FluentConditionBuilder(null);
            sourceOfConditionConfig(builder);
            if (this.confirmConfigWasAdded(builder.parentConfig.conditionConfigs))
                attachEnablerCondition(vhConfig, builder.parentConfig.conditionConfigs[0]);
        }
        else if (isPlainObject(sourceOfConditionConfig)) {
            let vhConfig = getValueHostConfig();
            attachEnablerCondition(vhConfig, sourceOfConditionConfig as ConditionConfig);
        }
        else
        {
            let error = new CodingError('Invalid parameters');
            this.logger.error(error);
            throw error;
        }
        return this;

    }
    //#region utilities for ValidationManager-based subclasses
    // These utilities should all be protected. The ValidationManager subclass will create a public version of it.
    /**
     * Fluent format to create any ValueHostConfig based upon ValidatorsValueHostBaseConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * Protected because ValueHostManager does not support FieldValueHost. 
     * ValidationManager offers a public interface.
     * @param valueHostType - the ValueHostType to configure
     * @param arg1 - either the ValueHost name for a multiparameter use or ValidatorsValueHostBaseConfig for a single parameter use.
     * @param arg2 - optional and can be null. The value for ValueHost.dataType or FieldValueHostConfig.
     * @param arg3 - optional. Any additional properties of a FieldValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
     */
    protected addValidatorsValueHost<TVHConfig extends ValidatorsValueHostBaseConfig>(
        valueHostType: ValueHostType | string,
        arg1: Partial<TVHConfig> | ValueHostName,
        arg2?: Partial<TVHConfig> | string | null,
        arg3?: Partial<TVHConfig>): FluentValidatorBuilder {
        this.assertNotDisposed();
        assertNotNull(arg1, 'arg1');
        let fluent = this.createFluent() as ValidationManagerStartFluent;
        let builder = fluent.withValidators(valueHostType,
            arg1 as FluentValidatorsValueHostConfig<TVHConfig> | ValueHostName,
            arg2 as FluentValidatorsValueHostParameters<TVHConfig> | string | null,
            arg3 as FluentValidatorsValueHostParameters<TVHConfig>);

        this.applyConfig(builder.parentConfig);
        return builder;
    }

    /**
     * Combines a condition with a ValidatorConfig's condition
     * using a rule supplied or callback to let you create a conditionConfig.
     *
     * The resulting ValidatorConfig's errorCode will not have changed from the original 
     * to ensure it aligns with everything depending on the original error code.
     * @param destinationOfCondition - the conditionConfig that you want to combine with the new condition.
     * @param arg2 Either of these:
     *  - Use a function to create a conditionConfig that will replace the existing. You are
     *    passed the Builder object, where you can build your new conditions, and the existing conditionConfig,
     *    which can be added to a Builder object with the conditionConfig() function.
     * - a CombineUsingCondition enum value that specifies how to combine the conditions.
     * @param arg3 - create the condition that you want to combine with the existing condition.
     */
    protected combineWithValidatorConfig(
        destinationOfCondition: ValidatorConfig,
        arg2: CombineUsingCondition | ((combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => void),
        arg3?: (combiningBuilder: FluentConditionBuilder) => void): void {
        this.assertNotDisposed();
        assertNotNull(destinationOfCondition, 'destinationOfCondition');
        assertNotNull(arg2);

        let errorCode = resolveErrorCode(destinationOfCondition);
        const missingConditionMsg = `Builder function did not create a conditionConfig for error code "${errorCode}". Existing condition remains.`;

        let builder = new FluentConditionBuilder(null);
        let fn: ((combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => void) | null = null;

        if (typeof arg2 === 'function') {
            fn = arg2;
        }

        else if (typeof arg3 === 'function' && typeof arg2 === 'number') {
            let newConfigBuilder = new FluentConditionBuilder(null);
            arg3(newConfigBuilder);
            if (!this.confirmConfigWasAdded(newConfigBuilder.parentConfig.conditionConfigs))
                return;
            
            let newConditionConfig = newConfigBuilder.parentConfig.conditionConfigs[0];

            switch (arg2 as CombineUsingCondition) {
                case CombineUsingCondition.When:
                    fn = (replacementBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                        replacementBuilder.when(
                            (enablerBuilder) => enablerBuilder.conditionConfig(newConditionConfig),
                            (existingConfigBuilder) => existingConfigBuilder.conditionConfig(existingConditionConfig));
                    };
                    break;
                case CombineUsingCondition.All:
                    fn = (replacementBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                        replacementBuilder.all(
                            (childrenBuilder) => childrenBuilder
                                .conditionConfig(existingConditionConfig)
                                .conditionConfig(newConditionConfig));
                    };
                    break;
                case CombineUsingCondition.Any:
                    fn = (replacementBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => {
                        replacementBuilder.any(
                            (childrenBuilder) => childrenBuilder
                                .conditionConfig(existingConditionConfig)
                                .conditionConfig(newConditionConfig));
                    };
                    break;

            }
        }
        if (fn) {
            
            fn(builder, destinationOfCondition.conditionConfig!);
            if (this.confirmConfigWasAdded(builder.parentConfig.conditionConfigs)) {
                destinationOfCondition.conditionConfig = builder.parentConfig.conditionConfigs[0];
                destinationOfCondition.errorCode = errorCode;
                (destinationOfCondition as any)[conditionReplacedSymbol] = true;
                return;
            }

            return;
        }
        let error = new CodingError('Invalid parameters.');
        this.logger.error(error);
        throw error;
    }

    protected confirmConfigWasAdded(configs: Array<ConditionConfig>): boolean
    {
        if (configs.length === 0) {
            this.logger.message(LoggingLevel.Warn, ()=> `Builder function did not create a conditionConfig`);
            return false;
        }
        return true;
    }

    /**
     * Updates the conditionConfig property of destinationOfCondition where the replacement
     * is either a conditionConfig or using a Builder object.
     * 
     * If it finds the validator with the errorcode specified, it will replace the condition with the existing condition.
     * If not, it logs and throws an error.
     * If the ValueHost is on an earlier override or baseConfig, a new entry is made in the current override,
     * reflecting the same data as earlier, but now with a modified validator.
     * If the ValueHost is on the current override, the existing entry is modified.
     *
     * The resulting ValidatorConfig's errorCode will not have changed from the original 
     * to ensure it aligns with everything depending on the original error code.
     * @param destinationOfCondition 
     * @param sourceOfConditionConfig Either of these:
     * - use a function to create a conditionConfig that will replace the existing. You are
     *   passed the builder, where you can build your new conditions.
     * - provide a complete ConditionConfig as the replacement
     */
    protected replaceConditionWith(destinationOfCondition: ValidatorConfig, sourceOfConditionConfig: ConditionConfig | ((replacementBuilder: FluentConditionBuilder) => void)): void {
        this.assertNotDisposed();
        assertNotNull(destinationOfCondition, 'destinationOfCondition');
        assertNotNull(sourceOfConditionConfig, 'sourceOfConditionConfig');  

        if (typeof sourceOfConditionConfig === 'function') {
            this.combineWithValidatorConfig(destinationOfCondition,
                (replacementBuilder, existingConditionConfig) => {
                    sourceOfConditionConfig(replacementBuilder);
                });
        }
        else if (isPlainObject(sourceOfConditionConfig)) {
            this.combineWithValidatorConfig(destinationOfCondition,
                (replacementBuilder, existingConditionConfig) => {
                    replacementBuilder.conditionConfig(sourceOfConditionConfig as ConditionConfig)
                });
        }

        else {
            let error = new CodingError('Invalid parameters');
            this.logger.error(error);
            throw error;
        }

    }
    /**
     * Returns a ValueHostConfig that is already in the destinationValueHostConfigs with the desired
     * validatorConfig. If it cannot match both valueHostName and errorCode, it will throw an error.
     * @param valueHostName 
     * @param errorCode 
     * @returns 
     */
    protected setupValueHostToCombine(valueHostName: ValueHostName, errorCode: string): {
        vhc: ValidatorsValueHostBaseConfig,
        vc: ValidatorConfig
    } {
        this.assertNotDisposed();
        assertNotNull(valueHostName, 'valueHostName');
        assertNotNull(errorCode, 'errorCode');
        // replace condition in existing ValueHostConfig if in destinationValueHostConfigs.
        let vhToModify = this.destinationValueHostConfigs().find((item) => item.name === valueHostName) as ValidatorsValueHostBaseConfig | undefined;
        if (vhToModify && vhToModify.validatorConfigs) {
            let validatorConfig = vhToModify.validatorConfigs.find((item) => resolveErrorCode(item) === errorCode);
            if (validatorConfig) {
                return { vhc: vhToModify, vc: validatorConfig };
            }
        }
        // find in earlier arrays. Clone the ValueHostConfig and add it to the current array, replacing the validator's condition
        let vhToClone = this.getExistingValueHostConfig(valueHostName, false) as ValidatorsValueHostBaseConfig;
        if (vhToClone && vhToClone.validatorConfigs) {
            let validatorConfig = vhToClone.validatorConfigs.find((item) => resolveErrorCode(item) === errorCode);
            if (validatorConfig) {
                let clonedVH = deepClone(vhToClone) as ValidatorsValueHostBaseConfig;
                let clonedVC = clonedVH.validatorConfigs!.find((item) => resolveErrorCode(item) === errorCode);
                this.destinationValueHostConfigs().push(clonedVH);
                return { vhc: clonedVH, vc: clonedVC! };
            }

        }
        let msg = (vhToModify || vhToClone) ?
            `ValueHost name "${valueHostName}" does not have a validator with error code "${errorCode}".` :
            `ValueHost name "${valueHostName}" is not defined.`;

        let error = new CodingError(msg);
        this.logger.error(error);
        throw error;
    }

    //#endregion utilities for ValidationManager-based subclasses

}

/**
 * Each private storage field in ManagerConfigBuilderBase is stored here,
 * so this object can be transferred to companion builders who will do additional work.
 */
export class BuilderState<T extends ValueHostsManagerConfig>
{
    constructor(baseConfig: T) {
        this.baseConfig = baseConfig;
        this.logger = new LoggerFacade(baseConfig.services.loggerService,
            'ConfigBuilder', this, null, false);
        this.overriddenValueHostConfigs = [];
    }

    public logger: LoggerFacade;
    public baseConfig: T;
    public overriddenValueHostConfigs!: Array<Array<ValueHostConfig>>;
    
}


/**
 * Supports combineConditionWith to direct how conditions are combined.
 */
export enum CombineUsingCondition {
    When,
    All,
    Any
}

/**
 * This value is used as a special property of a ValidatorConfig to indicate that the conditionConfig
 * has been replaced by a new one. This is used by the ValidatorConfigMergeService to 
 * override its default behavior of ignoring conditionConfig.
 * Expect it to be assigned by ManagerConfigBuilderBase.combineWithRule and replaceRule.
 * Note: We really don't want users to inject the same property, as it is a way to work around the system.
 * Thus its limited to this module and which is where the code is to set it.
 * Other consumers can only check its presence through hasConditionBeenReplaced.
 */
const conditionReplacedSymbol = Symbol('conditionReplaced');
export function hasConditionBeenReplaced(validatorConfig: ValidatorConfig): boolean {
    return conditionReplacedSymbol in validatorConfig;
}
export function deleteConditionReplacedSymbol(validatorConfig: ValidatorConfig): void {
    delete (validatorConfig as any)[conditionReplacedSymbol];
}