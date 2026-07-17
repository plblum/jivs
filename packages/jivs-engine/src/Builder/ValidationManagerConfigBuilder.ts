/**
 * @inheritDoc Builder/ConcreteClasses/ValidationManagerConfigBuilder!ValidationManagerConfigBuilder
 * @module Builder/ConcreteClasses/ValidationManagerConfigBuilder
 */

import { ValueHostName } from "../DataTypes/BasicTypes";
import { FieldValueHostConfig } from "../Interfaces/FieldValueHost";
import { IValidationManagerConfigBuilder } from "../Interfaces/ManagerConfigBuilder";
import { IValidatorBuilder } from "../Interfaces/ChildBuilders";
import { toIServicesAccessor } from "../Interfaces/Services";
import { ValueHostValidationStateChangedHandler } from "../Interfaces/ValidatableValueHostBase";
import { ValidationManagerConfig, ValidationManagerInstanceState, ValidationStateChangedHandler } from "../Interfaces/ValidationManager";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { FluentFieldParameters, FluentFieldValueConfig, FluentValidatorsValueHostConfig, FluentValidatorsValueHostParameters } from "../Interfaces/Fluent";
import { BuilderState } from "./ManagerConfigBuilderBase";
import { ValueHostsManagerConfigBuilder } from "./ValueHostsManagerConfigBuilder";
import { ValidatableValueHostConfigBuilder } from "./ValueHostConfigBuilder"
import { ValidatorsValueHostBaseConfig } from "../Interfaces/ValidatorsValueHostBase";
import { assertNotNull } from "../Utilities/ErrorHandling";

/**
 * Access point for using ValidationManagerConfigBuilder. It wraps an instance of ValueHostsManagerConfigBuilder
 * and lets you start using its functions, which are often chained.
 * We recommend that you choose another approach: create your own subclass of ModelRulesBase, 
 * and use its builder property to configure your ValidationManagerConfig.
 * @returns 
 */
export function createConfigBuilder(arg1: IValidationServices | ValidationManagerConfig): ValidationManagerConfigBuilder {
    if (toIServicesAccessor(arg1)) {
        let services = (arg1 as ValidationManagerConfig).services;
        return services.buildersFactory.createManagerConfigBuilder(arg1 as ValidationManagerConfig) as ValidationManagerConfigBuilder;
    }
    let services = arg1 as IValidationServices;
    return services.buildersFactory.createManagerConfigBuilder(null) as ValidationManagerConfigBuilder;
}

/**
 * Builder specific to ValidationManager.
 * It provides the ability to attach callbacks to the baseConfig.
 */

export class ValidationManagerConfigBuilder extends ValueHostsManagerConfigBuilder<ValidationManagerConfig>
    implements IValidationManagerConfigBuilder<ValidationManagerConfig> {
    constructor(services: IValidationServices)
    constructor(config: ValidationManagerConfig)
    constructor(state: BuilderState<ValidationManagerConfig>)
    constructor(arg1: IValidationServices | ValidationManagerConfig | BuilderState<ValidationManagerConfig>) {
        super(arg1 as any);
    }
    public get services(): IValidationServices {
        return this.baseConfig.services;
    }

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
     * @returns ValidatorBuilder for chaining validators to initial FieldValueHost
     */
    protected addValidatorsValueHost<TVHConfig extends ValidatorsValueHostBaseConfig>(
        valueHostType: ValueHostType | string,
        arg1: Partial<TVHConfig> | ValueHostName,
        arg2?: Partial<TVHConfig> | string | null,
        arg3?: Partial<TVHConfig>): IValidatorBuilder {
        this.assertNotDisposed();
        assertNotNull(arg1, 'arg1');
        let builder = this.createValueHostBuilder() as ValidatableValueHostConfigBuilder;
        let config = builder.withValidators(valueHostType,
            arg1 as FluentValidatorsValueHostConfig<TVHConfig> | ValueHostName,
            arg2 as FluentValidatorsValueHostParameters<TVHConfig> | string | null,
            arg3 as FluentValidatorsValueHostParameters<TVHConfig>);

        this.applyConfig(config);
        return this.services.buildersFactory.createValidatorBuilder(config);        
  //    return builder;
    }

    //#endregion validation oriented ValueHost support

    //#region InstanceState
    public get savedInstanceState(): ValidationManagerInstanceState | null {
        return super.savedInstanceState;
    }
    public set savedInstanceState(value: ValidationManagerInstanceState | null) {
        super.savedInstanceState = value;
    }
    //#endregion InstanceState

    //#region IValidationManagerCallbacks
    /**
     * @inheritDoc ValueHosts/Types/ValidatableValueHostBase!IValidatableValueHostBaseCallbacks.onValueHostValidationStateChanged
     */
    public get onValueHostValidationStateChanged(): ValueHostValidationStateChangedHandler | null {
        return this.baseConfig.onValueHostValidationStateChanged ?? null;
    }
    public set onValueHostValidationStateChanged(value: ValueHostValidationStateChangedHandler | null) {
        this.baseConfig.onValueHostValidationStateChanged = value;
    }

    /**
     * @inheritDoc ValidationManager/Types!IValidationManagerCallbacks.onValidationStateChanged
     */
    public get onValidationStateChanged(): ValidationStateChangedHandler | null {
        return this.baseConfig.onValidationStateChanged ?? null;
    }
    public set onValidationStateChanged(value: ValidationStateChangedHandler | null) {
        this.baseConfig.onValidationStateChanged = value;
    }

    /**
     * @inheritDoc ValidationManager/Types!IValidationManagerCallbacks.notifyValidationStateChangedDelay
     */
    public get notifyValidationStateChangedDelay(): number {
        return this.baseConfig.notifyValidationStateChangedDelay ?? 0;
    }
    public set notifyValidationStateChangedDelay(value: number) {
        this.baseConfig.notifyValidationStateChangedDelay = value;
    }
    //#endregion IValidationManagerCallbacks
}


