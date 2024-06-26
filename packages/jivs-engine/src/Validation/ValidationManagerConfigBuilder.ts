/**
 * @inheritDoc ValidationManager/ConcreteClasses/ValidationManagerConfigBuilder!ValidationManagerConfigBuilder
 * @module ValidationManager/ConcreteClasses/ValidationManagerConfigBuilder
 */

import { ValidationManagerConfig, ValidationManagerInstanceState, ValidationStateChangedHandler } from "../Interfaces/ValidationManager";
import { ValueHostsManagerConfigBuilder } from "../ValueHosts/ValueHostsManagerConfigBuilder";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { ValueHostValidationStateChangedHandler } from "../Interfaces/ValidatableValueHostBase";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { FluentInputParameters, FluentValidatorBuilder, FluentInputValueConfig, FluentPropertyParameters, FluentPropertyValueConfig, ValidationManagerStartFluent, FluentConditionBuilder } from "../ValueHosts/Fluent";
import { InputValueHostConfig } from "../Interfaces/InputValueHost";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { resolveErrorCode } from "../Utilities/Validation";
import { BuilderOverrideOptions, IValidationManagerConfigBuilder } from "../Interfaces/ManagerConfigBuilder";
import { toIServicesAccessor } from "../Interfaces/Services";
import { PropertyValueHostConfig } from "../Interfaces/PropertyValueHost";
import { ConditionWithChildrenBaseConfig } from "../Conditions/ConditionWithChildrenBase";
import { ConditionConfig } from "../Interfaces/Conditions";
import { CombineUsingCondition } from "../ValueHosts/ManagerConfigBuilderBase";


/**
 * Access point for using ValidationManagerConfigBuilder. It wraps an instance of ValueHostsManagerConfigBuilder
 * and lets you start using its functions, which are often chained.
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
    constructor(arg1: IValidationServices | ValidationManagerConfig) {
        super(arg1 as any);
    }
    protected get services(): IValidationServices {
        return this.baseConfig.services;
    }

    protected createFluent(): ValidationManagerStartFluent {
        return new ValidationManagerStartFluent(this.destinationValueHostConfigs(), this.services);
    }
    //#region validation oriented ValueHost support
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial InputValueHost
     */
    public input(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial InputValueHost
     */
    public input(valueHostName: ValueHostName, parameters: FluentInputParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire InputValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorBuilder for chaining validators to initial InputValueHost
     */
    public input(config: FluentInputValueConfig): FluentValidatorBuilder;
    // overload resolution
    public input(arg1: ValueHostName | FluentInputValueConfig,
        arg2?: FluentInputParameters | string | null,
        arg3?: FluentInputParameters): FluentValidatorBuilder {
        return this.addValidatorsValueHost<InputValueHostConfig>(ValueHostType.Input, arg1, arg2, arg3);
    }

    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a PropertyValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial PropertyValueHost
     */
    public property(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentPropertyParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param parameters - optional. Any additional properties of a PropertyValueHostConfig.
     * @returns FluentValidatorBuilder for chaining validators to initial PropertyValueHost
     */
    public property(valueHostName: ValueHostName, parameters: FluentPropertyParameters): FluentValidatorBuilder;
    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire PropertyValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorBuilder for chaining validators to initial PropertyValueHost
     */
    public property(config: FluentPropertyValueConfig): FluentValidatorBuilder;
    // overload resolution
    public property(arg1: ValueHostName | FluentPropertyValueConfig, arg2?: FluentPropertyParameters | string | null, arg3?: FluentPropertyParameters): FluentValidatorBuilder {
        return this.addValidatorsValueHost<PropertyValueHostConfig>(ValueHostType.Property, arg1, arg2, arg3);
    }
    //#endregion validation oriented ValueHost support

    /**
     * When working with both business layer and UI layer configurations,
     * call before starting the UI layer configuration.
     * It will prepare for merging overlapping configurations and optionally
     * change some of the configuration already prepared by the business layer.
     * @param options 
     */
    public startUILayerConfig(options?: BuilderOverrideOptions): void {
        this.addOverride();
        if (options?.favorUIMessages !== false)
            this.favorUIMessages();
        if (options?.convertPropertyToInput !== false)
            this.convertPropertyToInput();
    }

    /**
     * When the business logic provides the initial validators,
     * they include error messages designed from the business logic
     * perspective.
     * 
     * The UI layer can override them in several ways:
     * 1. Replacing them directly using updateValidator during configuration.
     * 2. Replacing them directly once ValidationManager exists, using startModifier().
     *    modifier.updateValidator('valuehostname', 'errorcode', { errorMessage: 'replacement'})
     *    or
     *    modifier.valueHostType('valuehostname').ruleName(null, 'replacement')
     * 3. By using those registered with TextLocalizationService.
     *    To use them, there should not be any error message already
     *    supplied to the validator and business layer messages get in the way.
     * 
     * This function should be called prior to creating ValidationManager
     * to remove all error messages supplied by business logic,
     * so long as they are covered in TextLocalizationServices.
     * Be sure that TextLocalizationServices is setup as desired
     * before calling this.
     */
    public favorUIMessages(): void {
        let tls = this.services.textLocalizerService;
        // goes through all validators, but only on the baseConfig which is setup by business logic.
        // For any with an error message, see if it exists
        // in TextLocalizationService as "*". If so, clear
        // errorMessage, errorMessagel10n, summaryMessage, summaryMessagel10n
        // This allows TextLocalizationService to supply messages.
        for (let i = 0; i < this.baseConfig.valueHostConfigs.length; i++) {
            let vhConfig = this.baseConfig.valueHostConfigs[i] as InputValueHostConfig;
            if (vhConfig.validatorConfigs)
                vhConfig.validatorConfigs.forEach((ivConfig) => {
                    if (ivConfig.errorMessage || ivConfig.errorMessagel10n)
                        if (tls.getErrorMessage('*', resolveErrorCode(ivConfig), null)) {
                            delete ivConfig.errorMessage;
                            delete ivConfig.errorMessagel10n;
                            delete ivConfig.summaryMessage;
                            delete ivConfig.summaryMessagel10n;
                        }
                });
        }
    }
    /**
     * Replaces the valueHostType property value, from 'Property'
     * to 'Input' (no changes to any other case).
     * This allows business logic to output in its preferred ValueHostType
     * and UI to upscale it to InputValueHost.
     * Only impacts the initial ValueHostConfig, not any overrides.
     * @returns when true, changes were made
     */
    public convertPropertyToInput(): boolean {
        let changed = false;
        this.baseConfig.valueHostConfigs.forEach((vhConfig) => {
            if (vhConfig.valueHostType === ValueHostType.Property) {
                vhConfig.valueHostType = ValueHostType.Input;
                changed = true;
            }
        });
        return changed;
    }
    /**
     * If it finds the validator with the errorcode specified, it will combine the condition with the existing condition
     * using a rule supplied or callback to let you create a conditionConfig.
     * If it the validator is not found, it will throw an error and log.
     * If the ValueHost is on an earlier override or baseConfig, a new entry is made in the current override,
     * reflecting the same data as earlier, but now with a modified validator.
     * If the ValueHost is on the current override, the existing entry is modified.
     *
     * The resulting ValidatorConfig's errorCode will not have changed from the original 
     * to ensure it aligns with everything depending on the original error code.
     * @param valueHostName 
     * @param errorCode 
     * @param builderFn - A function to create a conditionConfig that will replace the existing. 
     * You are passed a Builder object, where you can build your new conditions, 
     * and the existing conditionConfig,
     * which can be added to a Builder object with the conditionConfig() function.
     * ```ts
     * builder.combineWithRule('Field1', 'NotNull', 
     *   (combiningBuilder, existingConditionConfig)=> {
     *      combiningBuilder.when(
     *                  (enablerBuilder)=> enablerBuilder.equalToValue('YES', 'Field2'),
     *                  (childBuilder)=> childBuilder.conditionConfig(existingConditionConfig));
     * });
     * ```
     * @returns itself for chaining
     */
    public combineWithRule(valueHostName: ValueHostName, errorCode: string,
        builderFn: (combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => void): ValidationManagerConfigBuilder;
    /**
     * Uses the combineUsing parameter to determine how to combine the conditions.
     * @param valueHostName 
     * @param errorCode 
     * @param combineUsing 
     * @param builderFn - A function to create the condition that you want 
     * to combine with the existing condition.
     * ```ts
     * builder.combineWithRule('Field1', 'NotNull', CombineUsingCondition.When, 
     *    (combiningBuilder)=> combiningBuilder.equalToValue('YES', 'Field2'));
     * ```
     */
    public combineWithRule(valueHostName: ValueHostName, errorCode: string, combineUsing: CombineUsingCondition,
        builderFn: (combiningBuilder: FluentConditionBuilder) => void): ValidationManagerConfigBuilder

    public combineWithRule(valueHostName: ValueHostName, errorCode: string,
        arg3: CombineUsingCondition | ((combiningBuilder: FluentConditionBuilder, existingConditionConfig: ConditionConfig) => void),
        arg4?: (combiningBuilder: FluentConditionBuilder) => void): ValidationManagerConfigBuilder {
        let { vhc, vc } = this.setupValueHostToCombine(valueHostName, errorCode);   // throws if not found
        this.combineWithValidatorConfig(vc, arg3, arg4);
        return this;
    }

    /**
     * Replace the condition supplying the replacement conditionConfig directly.
     * If it finds the validator with the errorcode specified, it will replace the condition with the existing condition.
     * If not, it logs and throws an error.
     * If the ValueHost is on an earlier override or baseConfig, a new entry is made in the current override,
     * reflecting the same data as earlier, but now with a modified validator.
     * If the ValueHost is on the current override, the existing entry is modified.
     *
     * The resulting ValidatorConfig's errorCode will not have changed from the original 
     * to ensure it aligns with everything depending on the original error code.
     * @param valueHostName 
     * @param errorCode 
     * @param conditionConfig - provide a complete ConditionConfig as the replacement
     */
    public replaceRule(valueHostName: ValueHostName, errorCode: string, conditionConfig: ConditionConfig): ValidationManagerConfigBuilder
    /** 
     * Replace supplying the replacement condition through a Builder object.
     * @param valueHostName 
     * @param errorCode 
     * @param builderFn
     * Use a function to create a conditionConfig that will replace the existing. You are
     * passed the builder, where you can build your new conditions.
     * @returns itself for chaining
     */

    public replaceRule(valueHostName: ValueHostName, errorCode: string, builderFn: (replacementBuilder: FluentConditionBuilder) => void): ValidationManagerConfigBuilder
    public replaceRule(valueHostName: ValueHostName, errorCode: string,
        sourceOfConditionConfig: ConditionConfig | ((replacementBuilder: FluentConditionBuilder) => void)): ValidationManagerConfigBuilder {
        let { vhc, vc } = this.setupValueHostToCombine(valueHostName, errorCode);   // throws if not found
        this.replaceConditionWith(vc, sourceOfConditionConfig);
        return this;
    }

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


