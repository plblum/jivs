/**
 * @inheritDocjivs-builder/Builders/ConcreteClasses!ValueHostsManagerConfigBuilder:class
 * @module jivs-builder/Builders/ConcreteClasses
 */

import { ValueHostName } from '@plblum/jivs-engine/build/DataTypes/BasicTypes';
import { FieldValueHostConfig, TextValueChangedHandler } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { toIServicesAccessor } from '@plblum/jivs-engine/build/Interfaces/Services';
import { ValueHostValidationStateChangedHandler } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import {
    ValueHostsManagerConfig, ValueHostsManagerConfigChangedHandler, ValueHostsManagerInstanceState,
    ValueHostsManagerInstanceStateChangedHandler, ValidationStateChangedHandler
} from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { ValidatorsValueHostBaseConfig } from '@plblum/jivs-engine/build/Interfaces/ValidatorsValueHostBase';
import { ValueChangedHandler, ValueHostInstanceState, ValueHostInstanceStateChangedHandler } from '@plblum/jivs-engine/build/Interfaces/ValueHost';
import { ValueHostType } from '@plblum/jivs-engine/build/Interfaces/ValueHostFactory';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IValidatorBuilder } from '../Interfaces/ChildBuilders';
import {
    FluentFieldParameters, FluentFieldValueConfig,
    FluentValidatorsValueHostConfig, FluentValidatorsValueHostParameters
} from '../Interfaces/ValueHostConfigBuilders';
import { IValueHostsManagerConfigBuilder } from '../Interfaces/ManagerConfigBuilder';
import { BuilderState, ManagerConfigBuilderBase } from './ManagerConfigBuilderBase';
import { ValidatableValueHostConfigBuilder } from './ValueHostConfigBuilder';

/**
 * Access point for using ValueHostsManagerConfigBuilder.
 * We recommend that you choose another approach: create your own subclass of ModelRulesBase, 
 * and use its builder property to configure your ValueHostsManagerConfig.
 * @returns 
 */
export function createConfigBuilder(arg1: IJivsServices | ValueHostsManagerConfig): ValueHostsManagerConfigBuilder {
    if (toIServicesAccessor(arg1)) {
        const services = (arg1 as ValueHostsManagerConfig).services;
        return services.buildersFactory.createManagerConfigBuilder(arg1 as ValueHostsManagerConfig) as unknown as ValueHostsManagerConfigBuilder;
    }
    const services = arg1 as IJivsServices;
    return services.buildersFactory.createManagerConfigBuilder(null) as unknown as ValueHostsManagerConfigBuilder;
}

/**
 * For building the ValueHostsManagerConfig
 * 
 * ```ts
 * let builder = new ValueHostsManagerConfigBuilder(createJivsServices());
 * builder.field('Field1').requireText();
 * let vmConfig = builder.complete();
 * 
 * let vhm = new ValueHostsManager(vmConfig);
 * ```
 * instead of
 * ```ts
 * let vmConfig: ValueHostsManagerConfig = {
 *      services: createJivsServices(),
 *      valueHostConfigs: [
 *          {
 *              valueHostType: ValueHostType.Field,
 *              name: 'Field1',
 *              validatorConfigs: [
 *                  {
 *                      conditionConfig: { conditionType: ConditionType.RequireText }
 *                  }
 *              ]
 *          }
 *      ]
 * }
 * 
 * let vhm = new ValueHostsManager(vmConfig);
 * ```
 */

export class ValueHostsManagerConfigBuilder<T extends ValueHostsManagerConfig = ValueHostsManagerConfig> extends ManagerConfigBuilderBase<T>
    implements IValueHostsManagerConfigBuilder<T> {
    
    constructor(services: IJivsServices)
    constructor(config: T)
    constructor(state: BuilderState<T>) // eslint-disable-line @typescript-eslint/unified-signatures
    constructor(arg1: IJivsServices | T | BuilderState<T>) {
        super(arg1 as any);
    }
    public get services(): IJivsServices {
        return this.baseConfig.services;
    }
    //#region InstanceState
    /**
     * @inheritDoc jivs-engine/ValueHostsManager/Types!ValueHostsManagerConfig.savedInstanceState
     */
    public get savedInstanceState(): ValueHostsManagerInstanceState | null {
        return this.baseConfig.savedInstanceState ?? null;
    }
    public set savedInstanceState(value: ValueHostsManagerInstanceState | null) {
        this.baseConfig.savedInstanceState = value;
    }
    /**
     * @inheritDoc jivs-engine/ValueHostsManager/Types!ValueHostsManagerConfig.savedValueHostInstanceStates
     */
    public get savedValueHostInstanceStates(): Array<ValueHostInstanceState> | null {
        return this.baseConfig.savedValueHostInstanceStates ?? null;
    }
    public set savedValueHostInstanceStates(value: Array<ValueHostInstanceState> | null) {
        this.baseConfig.savedValueHostInstanceStates = value;
    }
    
    //#endregion InstanceState
    protected createValueHostBuilder(): ValidatableValueHostConfigBuilder {
        return new ValidatableValueHostConfigBuilder(this.destinationValueHostConfigs(), this.services);
    }
    //#region validation oriented ValueHost support
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
     * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
     */
    public field(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentFieldParameters): IValidatorBuilder;
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
     * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
     */
    public field(valueHostName: ValueHostName, parameters: FluentFieldParameters): IValidatorBuilder;
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire FieldValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
     */
    public field(config: FluentFieldValueConfig): IValidatorBuilder;
    // overload resolution
    public field(arg1: ValueHostName | FluentFieldValueConfig,
        arg2?: FluentFieldParameters | string | null,
        arg3?: FluentFieldParameters): IValidatorBuilder {
        return this.addValidatorsValueHost<FieldValueHostConfig>(ValueHostType.Field, arg1, arg2, arg3);
    }

    //#region utilities for ValueHostsManager-based subclasses
    // These utilities should all be protected. The ValueHostsManager subclass will create a public version of it.
    /**
     * Fluent format to create any ValueHostConfig based upon ValidatorsValueHostBaseConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * Protected because ValueHostManager does not support FieldValueHost. 
     * ValueHostsManager offers a public interface.
     * @param valueHostType - the ValueHostType to configure
     * @param arg1 - either the ValueHost name for a multiparameter use or ValidatorsValueHostBaseConfig for a single parameter use.
     * @param arg2 - optional and can be null. The value for ValueHost.dataType or FieldValueHostConfig.
     * @param arg3 - optional. Any additional properties of a FieldValueHostConfig.
     * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
     */
    protected addValidatorsValueHost<TVHConfig extends ValidatorsValueHostBaseConfig>(
        valueHostType: ValueHostType | string,
        arg1: Partial<TVHConfig> | ValueHostName,
        arg2?: Partial<TVHConfig> | string | null,
        arg3?: Partial<TVHConfig>): IValidatorBuilder {
        this.assertNotDisposed();
        assertNotNull(arg1, 'arg1');
        const builder = this.createValueHostBuilder() as ValidatableValueHostConfigBuilder;
        const config = builder.withValidators(valueHostType,
            arg1 as FluentValidatorsValueHostConfig<TVHConfig> | ValueHostName,
            arg2 as FluentValidatorsValueHostParameters<TVHConfig> | string | null,
            arg3 as FluentValidatorsValueHostParameters<TVHConfig>);

        this.applyConfig(config);
        return this.services.buildersFactory.createValidatorBuilder(config);        
  //    return builder;
    }

    //#endregion validation oriented ValueHost support


    //#region IValueHostsManagerCallbacks
    /**
     * @inheritDoc jivs-engine/ValueHosts/Types/ValueHost!IValueHostCallbacks.onValueHostInstanceStateChanged
     */
    public get onValueHostInstanceStateChanged(): ValueHostInstanceStateChangedHandler | null | undefined {
        return this.baseConfig.onValueHostInstanceStateChanged;
    }
    public set onValueHostInstanceStateChanged(value: ValueHostInstanceStateChangedHandler | null) {
        this.baseConfig.onValueHostInstanceStateChanged = value;
    }
    /**
     * @inheritDoc jivs-engine/ValueHosts/Types/ValueHost!IValueHostCallbacks.onValueChanged
     */
    public get onValueChanged(): ValueChangedHandler | null {
        return this.baseConfig.onValueChanged ?? null;
    }
    public set onValueChanged(value: ValueChangedHandler | null) {
        this.baseConfig.onValueChanged = value;
    }

    /**
     * @inheritDoc jivs-engine/ValueHosts/Types/ValidatableValueHostBase!IValidatableValueHostBaseCallbacks.onValueHostValidationStateChanged
     */
    public get onValueHostValidationStateChanged(): ValueHostValidationStateChangedHandler | null {
        return this.baseConfig.onValueHostValidationStateChanged ?? null;
    }
    public set onValueHostValidationStateChanged(value: ValueHostValidationStateChangedHandler | null) {
        this.baseConfig.onValueHostValidationStateChanged = value;
    }

    /**
     * @inheritDoc jivs-engine/ValueHostsManager/Types!IValueHostsManagerCallbacks.onValidationStateChanged
     */
    public get onValidationStateChanged(): ValidationStateChangedHandler | null {
        return this.baseConfig.onValidationStateChanged ?? null;
    }
    public set onValidationStateChanged(value: ValidationStateChangedHandler | null) {
        this.baseConfig.onValidationStateChanged = value;
    }
    /**
     * @inheritDoc jivs-engine/ValueHosts/Types/FieldValueHost!IFieldValueHostChangedCallback.onTextValueChanged
     */
    public get onTextValueChanged(): TextValueChangedHandler | null {
        return this.baseConfig.onTextValueChanged ?? null;
    }
    public set onTextValueChanged(value: TextValueChangedHandler | null) {
        this.baseConfig.onTextValueChanged = value;
    }

    /**
     * @inheritDoc jivs-engine/ValueHostsManager/Types!IValueHostsManagerCallbacks.onInstanceStateChanged
     */

    public get onInstanceStateChanged(): ValueHostsManagerInstanceStateChangedHandler | null {
        return this.baseConfig.onInstanceStateChanged ?? null;
    }
    public set onInstanceStateChanged(value: ValueHostsManagerInstanceStateChangedHandler | null) {
        this.baseConfig.onInstanceStateChanged = value;
    }

    /**
     * @inheritDoc jivs-engine/ValueHostsManager/Types!IValueHostsManagerCallbacks.onConfigChanged
     */
    public get onConfigChanged(): ValueHostsManagerConfigChangedHandler | null {
        return this.baseConfig.onConfigChanged ?? null;
    }
    public set onConfigChanged(value: ValueHostsManagerConfigChangedHandler | null) {
        this.baseConfig.onConfigChanged = value;
    }
  
    /**
     * @inheritDoc jivs-engine/ValueHostsManager/Types!IValueHostsManagerCallbacks.notifyValidationStateChangedDelay
     */
    public get notifyValidationStateChangedDelay(): number {
        return this.baseConfig.notifyValidationStateChangedDelay ?? 0;
    }
    public set notifyValidationStateChangedDelay(value: number) {
        this.baseConfig.notifyValidationStateChangedDelay = value;
    }
    //#endregion IValueHostsManagerCallbacks
}


