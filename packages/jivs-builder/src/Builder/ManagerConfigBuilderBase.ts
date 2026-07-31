/**
 * @inheritDocjivs-builder/Builders/AbstractClasses!ManagerConfigBuilderBase:class
 * @module jivs-builder/Builders/AbstractClasses
 */

import { ValueHostName } from '@plblum/jivs-engine/build/DataTypes/BasicTypes';
import { CalcValueHostConfig, CalculationHandler } from '@plblum/jivs-engine/build/Interfaces/CalcValueHost';
import { StaticValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/StaticValueHost';
import { ValueHostConfig } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import {
    FluentAnyValueHostConfig,
    FluentAnyValueHostParameters, FluentStaticParameters
} from '../Interfaces/ValueHostConfigBuilders';

import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggerService';
import { toIServices, toIServicesAccessor } from '@plblum/jivs-engine/build/Interfaces/Services';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { ValidatorsValueHostBaseConfig } from '@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { CodingError, assertFunction, assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { LoggerFacade } from '@plblum/jivs-engine/build/Utilities/LoggerFacade';
import { deepClone, isPlainObject } from '@plblum/jivs-engine/build/Utilities/Utilities';
import { IStartConditionWithOneChildBuilder } from '../Interfaces/ChildBuilders';
import { IManagerConfigBuilder } from '../Interfaces/ManagerConfigBuilder';

import { ValidationManagerConfig } from '@plblum/jivs-engine/build/Interfaces/ValidationManager';
import { ValidationManager } from '@plblum/jivs-engine/build/Validation/ValidationManager';
import { StartConditionWithOneChildBuilder } from './StartConditionWithOneChildBuilder';
import { ValueHostConfigBuilder } from './ValueHostConfigBuilder';

/**
 * The ValueHostConfig object configures one ValueHost and its validators. 
 * That object isn't ideal for typing in configurations
 * (although its great if you have to write conversion between your own business logic
 * and Jivs).
 * 
 * The Builder provides a fluent API to create the ValueHostConfig objects and add them to the ValidationManagerConfig.
 * ManagerConfigBuilderBase is the base class.
 * 
 * The ManagerConfigBuilderBase provides a way to configure through meaningful code.
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
 *  protected configureRules(builder: IValidationManagerConfigBuilder, options?: RulesConfigOptions): void {
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
 *   adaptToForm(adapter: IFormConfigAdapter, options?: RulesConfigOptions): void {
 *      adapter.field('birthDate', null, { label: 'Birth date' })
 *        .lessThan('today');
 *      adapter.static('today', LookupKey.Date, { initialValue: new Date() });
 *   }
 * }
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
 * builder.static('today', LookupKey.Date, { initialValue: new Date() });
 * let vm = new ValidationManager(builder); // consider builder disposed at this point
 * ```
 */
export abstract class ManagerConfigBuilderBase<T extends ValidationManagerConfig>
    implements IManagerConfigBuilder<T> {

    constructor(services: IJivsServices)
    constructor(config: T)
    constructor(state: BuilderState<T>) // eslint-disable-line @typescript-eslint/unified-signatures
    constructor(arg1: IJivsServices | T | BuilderState<T>) {
        assertNotNull(arg1);
        if (arg1 instanceof BuilderState)
        {
            this._state = arg1;
            return;
        }
        const services = toIServices(arg1) as IJivsServices;
        if (services) {
            this._state = new BuilderState<T>({
                services: services,
                valueHostConfigs: []
            } as unknown as T);
        }
        else if (toIServicesAccessor(arg1) && // ensures we have the required 'services' property
            'valueHostConfigs' in arg1) {
            const baseConfig = arg1 as T;
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
     * it is exposed to allow sharing it with other Builder instances, 
     * so that they can edit the same configuration.
     * This member is not part of the IManagerConfigBuilder interface, and is not intended to be used directly.
     * @returns 
     */
    public handOffState(): BuilderState<T> {
        return this.state;
    }

    public get services(): IJivsServices {
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
    /**
     * Captures an error in the configuration and throws an exception
     * if the message is an instance of Error.
     * Always writes to the console and to the logger.
     * @param message - The error message to report. If it is an instance of Error, it will be thrown after logging.
     */
    protected reportError(message: string | Error): void {
        if (message instanceof Error)
        {
            const msg = message.message;
            console.error(msg);
            this.logger.message(LoggingLevel.Error, () => msg);
            throw message;
        }
        const msg = message;
        console.error(msg);
        this.logger.message(LoggingLevel.Error, ()=> msg);
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
     * A ValidationManagerConfig that is getting overridden ValueHost configurations.
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
        const valueHostConfigs: Array<ValueHostConfig> = [];
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
        const vhms = this.baseConfig.services.valueHostConfigMergeService;

        // merge overrides into baseConfig
        const destination = this.baseConfig;
        this.overriddenValueHostConfigs.forEach((o) => {
            o.forEach((sourceConfig) => {
                const destinationConfig = vhms.identifyValueHostConflict(sourceConfig, destination.valueHostConfigs);
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
        
        const destination = ValidationManager.safeConfigClone(this.baseConfig) as T;
        const vhms = destination.services.valueHostConfigMergeService;

        this.overriddenValueHostConfigs.forEach((o) => {
            o.forEach((sourceConfig) => {
                sourceConfig = deepClone(sourceConfig); // don't change the original
                const destinationConfig = vhms.identifyValueHostConflict(sourceConfig, destination.valueHostConfigs);
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
     * Supplies the ValidatableValueHostConfigBuilder object, already setup
     */
    protected abstract createValueHostBuilder(): ValueHostConfigBuilder;

    /**
     * Gets a ValueHostConfig with matching name by looking in previous overrides and the baseConfig.
     * Goal is to find a ValueHostConfig that existed prior to using addOverride().
     * @param valueHostName - case sensitive match against existing
     * @param throwWhenNotFound 
     * @returns 
     */
    protected getExistingValueHostConfig(valueHostName: ValueHostName, throwWhenNotFound: boolean): ValueHostConfig | null {

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

        const error = `ValueHost name "${valueHostName}" is not defined.`;
        if (throwWhenNotFound)
            this.reportError(new CodingError(error));
        else
            this.reportError(error);
        // istanbul ignore next   // currently no code passes in false for throwWhenNotFound
        return null;
    }

    /**
     * Gets a ValueHostConfig, cloning it into the current array if necessary.
     * It looks in earlier and current arrays, and the baseConfig. If not found, it throws an error.
     * @param valueHostName - case sensitive match against existing
     * @param throwWhenNotFound - whether to throw an error if not found
     * @returns the ValueHostConfig
     */
    protected getValueHostConfig(valueHostName: ValueHostName, throwWhenNotFound: boolean): ValueHostConfig
    {
        // replace condition in existing ValueHostConfig if in destinationValueHostConfigs.
        const vhToModify = this.destinationValueHostConfigs().find((item) => item.name === valueHostName) as ValidatorsValueHostBaseConfig | undefined;
        if (vhToModify) {
            return vhToModify;
        }
        // find in earlier arrays. Clone the ValueHostConfig and add it to the current array, replacing the validator's condition
        const vhToClone = this.getExistingValueHostConfig(valueHostName, false) as ValidatorsValueHostBaseConfig;
        if (vhToClone) {
            const clonedVH = deepClone(vhToClone) as ValidatorsValueHostBaseConfig;
            this.destinationValueHostConfigs().push(clonedVH);
            return clonedVH;
        }
        const error = new CodingError(`ValueHost name "${valueHostName}" is not defined.`);
        this.reportError(error); // throws
        throw error;    // only here to stop Typescript from demanding a return type
    }

    //#region fluent for creating ValueHosts
    /**
     * Utility to use the Fluent system to add a ValueHostConfig to the ValidationManagerConfig.
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
        arg3?: Partial<TVHConfig>): IManagerConfigBuilder<T> {
        assertNotNull(arg1, 'arg1');
        const builder = this.createValueHostBuilder();
        const vhConfig = builder.withoutValidators<TVHConfig>(valueHostType,
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
    public static(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentStaticParameters): IManagerConfigBuilder<T>;

    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a StaticValueHostConfig.
     * @returns Same instance for chaining.
     */
    public static(valueHostName: ValueHostName, parameters: FluentStaticParameters): IManagerConfigBuilder<T>;
    /**
     * Fluent format to create a StaticValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire StaticValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns Same instance for chaining.
     */
    public static(config: Omit<StaticValueHostConfig, 'valueHostType' | 'enablerConfig'>): IManagerConfigBuilder<T>;
    // overload resolution
    public static(arg1: ValueHostName | StaticValueHostConfig, arg2?: FluentStaticParameters | string | null, arg3?: FluentStaticParameters): IManagerConfigBuilder<T> {
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
    public calc(valueHostName: ValueHostName, dataType: string | null | undefined, calcFn: CalculationHandler): IManagerConfigBuilder<T>;
    /**
     * Fluent format to create a CalcValueHostConfig.
     * This is the start of a fluent series. However, at this time, there are no further items in the series.
     * @param config - Supply the entire CalcValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns Same instance for chaining.
     */
    public calc(config: Omit<CalcValueHostConfig, 'valueHostType'>): IManagerConfigBuilder<T>;
    // overload resolution
    public calc(arg1: ValueHostName | CalcValueHostConfig, dataType?: string | null, calcFn?: CalculationHandler): IManagerConfigBuilder<T> {
        this.assertNotDisposed();
        assertNotNull(arg1, 'arg1');
        const builder = this.createValueHostBuilder();
        let vhConfig: CalcValueHostConfig | undefined = undefined;

        if (isPlainObject(arg1)) {
            vhConfig = builder.calc(arg1 as CalcValueHostConfig);
        }
        else if (typeof arg1 === 'string') {
            vhConfig = builder.calc(arg1, dataType ?? null, calcFn!);
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
     * Establishes the condition that must be met for the ValueHost to be enabled. It is a fluent format that returns a ConditionBuilder
     * that can be used to build the conditionConfig. The resulting conditionConfig is attached to the ValueHost as its enabler.
     * If called on a ValueHost already with an enabler, it will replace the existing enabler.
     * ```ts
     * builder.whenToEnable('Field1', (childBuilder)=>
     *  childBuilder.fieldName('Field2').equalToValue('YES'));
     * builder.whenToEnable('Field1', (childBuilder)=>
     *  childBuilder.fieldName('Field2').conditionConfig(existingConditionConfig));
     * builder.whenToEnable('Field1', handler).any validator can be chained
     * ```
     * Sets this value:
     * ```ts
     * valueHostConfig.enablerCondition = conditionConfig;
     * ```
     * @param valueHostName - the name of the ValueHost to configure.
     * @param callback - a function that is passed a IStartConditionWithOneChildBuilder to build the conditionConfig.
     * @returns same builder for chaining.
     */
    public whenToEnable(valueHostName: ValueHostName, callback: (builder: IStartConditionWithOneChildBuilder) => void):
        IManagerConfigBuilder<T> {
        this.assertNotDisposed();
        assertNotNull(valueHostName, 'valueHostName');
        assertFunction(callback);

        this.logger.message(LoggingLevel.Debug, () => `whenToEnable("${valueHostName}")`);
        
        const vhConfig = this.getValueHostConfig(valueHostName, true);
        const startBuilder = new StartConditionWithOneChildBuilder(
            this.services as IJivsServices,
            null,
            (conditionConfig) => {
            if (conditionConfig)
                vhConfig.enablerConfig = conditionConfig;
        });
        callback(startBuilder);
        const conditionConfig = startBuilder.getConfig();
        if (!conditionConfig)
            this.reportError(new Error('Child builder was not used to define a Condition'));
        return this;
    }
}

/**
 * Each private storage field in ManagerConfigBuilderBase is stored here,
 * so this object can be transferred to companion builders who will do additional work.
 */
export class BuilderState<T extends ValidationManagerConfig>
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
