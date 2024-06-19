/**
 * @inheritDoc ValueHosts/AbstractClasses/ManagerConfigBuilderBase!ManagerConfigBuilderBase:class
 * @module ValueHosts/AbstractClasses/ManagerConfigBuilderBase
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ValueHostConfig } from '../Interfaces/ValueHost';
import {
    FluentAnyValueHostConfig,
    FluentAnyValueHostParameters,
    FluentInputParameters, FluentInputValueConfig, FluentPropertyParameters, FluentPropertyValueConfig,
    FluentStaticParameters, FluentValidatorCollector, FluentValidatorsValueHostConfig, FluentValidatorsValueHostParameters, ValidationManagerStartFluent, ValueHostsManagerStartFluent
} from './Fluent';
import { StaticValueHostConfig } from '../Interfaces/StaticValueHost';
import { CalcValueHostConfig, CalculationHandler } from '../Interfaces/CalcValueHost';
import { IValueHostsServices } from '../Interfaces/ValueHostsServices';

import { ValueHostsManagerConfig } from '../Interfaces/ValueHostsManager';
import { toIServices, toIServicesAccessor } from '../Interfaces/Services';
import { CodingError, assertNotNull } from '../Utilities/ErrorHandling';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { isPlainObject, isSupportedAsValue } from '../Utilities/Utilities';
import { ValidatorsValueHostBaseConfig } from '../Interfaces/ValidatorsValueHostBase';
import { IManagerConfigBuilder } from '../Interfaces/ManagerConfigBuilder';
import { InputValueHostConfig } from '../Interfaces/InputValueHost';
import { PropertyValueHostConfig } from '../Interfaces/PropertyValueHost';


/**
 * The ValueHostConfig object configures one ValueHost and its validators. 
 * That object isn't ideal for typing in configurations
 * (although its great if you have to write conversion between your own business logic
 * and Jivs).
 * 
 * The ManagerConfigBuilderBase provides a way to configure through meaningful code.
 * There are actually 2 of these, the builder and the modifier. ValueHostsManagerConfigBuilder is used for
 * the initial configuration passed into ValueHostManager/ValidationManager.
 * ValueHostsManagerConfigModifier is used to modify the configuration in an existing ValueHostManager.
 * 
 * Here are two ways to use it. 1) Without business logic 2) with Business logic.
 * 
 * ## Without Business Logic
 * ```ts
 * let builder = build(createValidatorServices('client'));
 * builder.input('Field1', LookupKey.String).requireText();
 * builder.static('Field2', LookupKey.Date);
 * builder.input('Field3', LookupKey.String).requireText().regExp(^/\d\d\d\-\d\d\d\d$/);
 * let vm = new ValidationManager(builder); // consider builder disposed at this point
 * // later when you need to modify vm:
 * let modifier = vm.startModifying();
 * modifier.input('Field3').regExp(null, { enabled: false });   // let's disable the existing validator
 * modifier.apply(); // consider modifier disposed at this point
 * ```
 * 
 * ## With Business Logic using the builder and UI overrides its settings
 * ```ts
 * let builder = build(createValidatorServices('client'));  // 'client' because the config targets the UI
 * builder.property('Field1', LookupKey.String).requireText({ errorMessage: 'Requires a value'});
 * builder.static('Field2', LookupKey.Date);
 * builder.property('Field3', LookupKey.String).requireText().regExp(^/\d\d\d\-\d\d\d\d$/);
 * builder.override({ favorUIMessages: true, convertPropertyToInput: true });
 * // At this point, we've converted PropertyValueHosts to InputValueHosts and discarded 
 * // all error messages that were covered by the TextLocalizerService.
 * builder.input('Field4', LookupKey.String, { label: 'Phone number', parserLookupKey: 'PhoneNumber' }).requireText(); // ui created this ValueHost
 * builder.input('Field1', null { label: 'Product name' })
 * builder.input('Field3', null, { label: 'Product code', parserLookupKey: 'ProductCode' });
 * 
 * let vm = new ValidationManager(builder); // consider builder disposed at this point
 * // later when you need to modify vm:
 * let modifier = vm.startModifying();
 * modifier.input('Field3').regExp(null, { enabled: false });   // let's disable the existing validator
 * modifier.apply(); // consider modifier disposed at this point
 * ```
 * 
 * ## With Business Logic using its own conversion logic and UI overrides its settings
 * ```ts
 * let vmConfig: ValidationManagerConfig = {
 *   services: createValidatorServices('client');
 *   validatorConfigs: []
 * };
 * myBusinessLogicToJivsConverter(vmConfig); // expect 'Field1', 'Field2', and 'Field3' to be generated as shown in the previous case
 * let builder = build(vmConfig);
 * builder.override({ favorUIMessages: true, convertPropertyToInput: true });
 * // At this point, we've converted PropertyValueHosts to InputValueHosts and discarded 
 * // all error messages that were covered by the TextLocalizerService.
 * builder.input('Field4', LookupKey.String, { label: 'Phone number', parserLookupKey: 'PhoneNumber' }).requireText(); // ui created this ValueHost
 * builder.input('Field1', null { label: 'Product name' })
 * builder.input('Field3', null, { label: 'Product code', parserLookupKey: 'ProductCode' });
 * 
 * let vm = new ValidationManager(builder); // consider builder disposed at this point
 * // later when you need to modify vm:
 * let modifier = vm.startModifying();
 * modifier.input('Field3').regExp(null, { enabled: false });   // let's disable the existing validator
 * modifier.apply(); // consider modifier disposed at this point
 * ```
 */
export abstract class ManagerConfigBuilderBase<T extends ValueHostsManagerConfig>
    implements IManagerConfigBuilder<T> {

    constructor(services: IValueHostsServices)
    constructor(config: T)
    constructor(arg1: IValueHostsServices | T) {
        assertNotNull(arg1);
        let services = toIServices(arg1) as IValueHostsServices;
        if (services) {
            this._baseConfig = {
                services: services,
                valueHostConfigs: []
            } as unknown as T;
        }
        else if (toIServicesAccessor(arg1) && // ensures we have the required 'services' property
            'valueHostConfigs' in arg1) {
            this._baseConfig = arg1 as T;
            if (this._baseConfig.valueHostConfigs == null)  // null or undefined
                this._baseConfig.valueHostConfigs = [];
        }
        else
            throw new CodingError('Unexpected parameter value');
    }
    public dispose(): void {
        this.overrideConfigs.forEach((item) => {
            item.services = undefined!;
            // currently we don't dispose any ValueHostCOnfig that implements IDisposable because they may have been copied to the ValueHostManager
        });
        this._overrideConfigs = undefined!;
        this._baseConfig = undefined!;
    }

    protected get services(): IValueHostsServices {
        return this.baseConfig.services;
    }

    /**
     * The initial setup from the constructor and assigned ValueHostConfigs
     * until an OverrideConfig is added.
     * It always retains the official services and callbacks.
     * Merging overrides updates this object.
     */
    protected get baseConfig(): T {
        return this._baseConfig;
    }
    private _baseConfig: T;

    /**
     * A ValueHostManagerConfig that is getting overridden ValueHost configurations.
     * Each are created by the override() function.
     * They retain a reference to services.
     */
    protected get overrideConfigs(): Array<T> {
        return this._overrideConfigs;
    }
    private _overrideConfigs: Array<T> = [];

    /**
     * Starts a new ValueHostsConfig to collect ValueHostConfigs.
     * They will be merged into baseConfig at getValueHostsConfig();
     */
    protected addOverride(): void {
        let o = {
            services: this.services,
            valueHostConfigs: []
        } as unknown as T;
        this.overrideConfigs.push(o);
    }

    /**
     * Exposes the ValueHostsConfig currently capturing content.
     * @returns 
     */
    protected destinationConfig(): T {
        if (this.overrideConfigs.length)
            return this.overrideConfigs[this.overrideConfigs.length - 1];
        return this.baseConfig;
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
        this.overrideConfigs.forEach((o) => {
            o.valueHostConfigs.forEach((sourceConfig) => {
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
     * Track a new ValueHostConfig in the destinationConfig.
     * @param config 
     */
    protected applyConfig(config: ValueHostConfig): void {
        if (this.destinationConfig().valueHostConfigs.find((item) => item.name === config.name))
            throw new CodingError(`ValueHost name "${config.name}" already defined`);
        this.destinationConfig().valueHostConfigs.push(config);
    }

    /**
     * Supplies the ValidationManagerStartFluent object, already setup
     */
    protected abstract createFluent(): ValueHostsManagerStartFluent<T>;

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
     * Fluent format to create any ValueHostConfig based upon ValidatorsValueHostBaseConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * Protected because ValueHostManager does not support InputValueHost. 
     * ValidationManager offers a public interface.
     * @param valueHostType - the ValueHostType to configure
     * @param arg1 - either the ValueHost name for a multiparameter use or InputValueConfig for a single parameter use.
     * @param arg2 - optional and can be null. The value for ValueHost.dataType or InputValueHostConfig.
     * @param arg3 - optional. Any additional properties of a InputValueHostConfig.
     * @returns FluentValidatorCollector for chaining validators to initial InputValueHost
     */
    protected addValidatorsValueHost<TVHConfig extends ValidatorsValueHostBaseConfig>(
        valueHostType: ValueHostType | string,
        arg1: Partial<TVHConfig> | ValueHostName,
        arg2?: Partial<TVHConfig> | string | null,
        arg3?: Partial<TVHConfig>): FluentValidatorCollector {

        assertNotNull(arg1, 'arg1');
        let fluent = this.createFluent() as ValidationManagerStartFluent;
        let collector = fluent.withValidators(valueHostType,
            arg1 as FluentValidatorsValueHostConfig<TVHConfig> | ValueHostName,
            arg2 as FluentValidatorsValueHostParameters<TVHConfig> | string | null,
            arg3 as FluentValidatorsValueHostParameters<TVHConfig>);

        this.applyConfig(collector.parentConfig);
        return collector;
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
    public static(config: Omit<StaticValueHostConfig, 'valueHostType'>): ManagerConfigBuilderBase<T>;
    // overload resolution
    public static(arg1: ValueHostName | StaticValueHostConfig, arg2?: FluentStaticParameters | string | null, arg3?: FluentStaticParameters): ManagerConfigBuilderBase<T> {
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
                valueHostType = ValueHostType.Input;
                
        if (valueHostType !== expectedType)
            throw new CodingError(`ValueHost name "${valueHostConfig!.name}" is not type=${expectedType}.`);

    }

}
