/**
 * @inheritDoc ValidationManager/ConcreteClasses/ValidationManagerConfigBuilder!ValidationManagerConfigBuilder
 * @module ValidationManager/ConcreteClasses/ValidationManagerConfigBuilder
 */

import { ValueHostName } from "../DataTypes/BasicTypes";
import { FieldValueHostConfig } from "../Interfaces/FieldValueHost";
import { BuilderOverrideOptions, IValidationManagerConfigBuilder, IValidationManagerConfigFormAdapter } from "../Interfaces/ManagerConfigBuilder";
import { toIServicesAccessor } from "../Interfaces/Services";
import { ValueHostValidationStateChangedHandler } from "../Interfaces/ValidatableValueHostBase";
import { ValidationManagerConfig, ValidationManagerInstanceState, ValidationStateChangedHandler } from "../Interfaces/ValidationManager";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { FluentFieldParameters, FluentFieldValueConfig, FluentValidatorBuilder, ValidationManagerStartFluent } from "../ValueHosts/Fluent";
import { BuilderState } from "../ValueHosts/ManagerConfigBuilderBase";
import { ValueHostsManagerConfigBuilder } from "../ValueHosts/ValueHostsManagerConfigBuilder";


/**
 * Access point for using ValidationManagerConfigBuilder. It wraps an instance of ValueHostsManagerConfigBuilder
 * and lets you start using its functions, which are often chained.
 * We recommend that you choose another approach: create your own subclass of ModelRulesBase, 
 * and use its builder property to configure your ValidationManagerConfig.
 * @returns 
 */
export function build(arg1: IValidationServices | ValidationManagerConfig): ValidationManagerConfigBuilder {
    if (toIServicesAccessor(arg1)) {
        let services = (arg1 as ValidationManagerConfig).services;
        return services.managerConfigBuilderFactory.create(arg1 as ValidationManagerConfig) as ValidationManagerConfigBuilder;
    }
    let services = arg1 as IValidationServices;
    return services.managerConfigBuilderFactory.create() as ValidationManagerConfigBuilder;
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

    protected createFluent(): ValidationManagerStartFluent {
        return new ValidationManagerStartFluent(this.destinationValueHostConfigs(), this.services);
    }
    //#region validation oriented ValueHost support
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
     */
    public field(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentFieldParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a FieldValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
     */
    public field(valueHostName: ValueHostName, parameters: FluentFieldParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a FieldValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire FieldValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorBuilder for chaining validators to initial FieldValueHost
     */
    public field(config: FluentFieldValueConfig): FluentValidatorBuilder;
    // overload resolution
    public field(arg1: ValueHostName | FluentFieldValueConfig,
        arg2?: FluentFieldParameters | string | null,
        arg3?: FluentFieldParameters): FluentValidatorBuilder {
        return this.addValidatorsValueHost<FieldValueHostConfig>(ValueHostType.Field, arg1, arg2, arg3);
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


