/**
 * @inheritDoc ValidationManager/ConcreteClasses/ValidationManagerConfigBuilder!ValidationManagerConfigBuilder
 * @module ValidationManager/ConcreteClasses/ValidationManagerConfigBuilder
 */

import { IValidationManagerCallbacks, ValidationManagerConfig, ValidationManagerInstanceState, ValidationStateChangedHandler } from "../Interfaces/ValidationManager";
import { ValueHostsManagerConfigBuilder } from "../ValueHosts/ValueHostsManagerConfigBuilder";
import { IValidationServices } from "../Interfaces/ValidationServices";
import { ValueHostValidationStateChangedHandler } from "../Interfaces/ValidatableValueHostBase";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { FluentInputParameters, FluentValidatorCollector, FluentInputValueConfig, FluentPropertyParameters, FluentPropertyValueConfig, ValidationManagerStartFluent } from "../ValueHosts/Fluent";
import { InputValueHostConfig } from "../Interfaces/InputValueHost";
import { ValueHostType } from "../Interfaces/ValueHostFactory";
import { resolveErrorCode } from "../Utilities/Validation";


/**
 * Access point for using ValidationManagerConfigBuilder. It wraps an instance of ValueHostsManagerConfigBuilder
 * and lets you start using its functions, which are often chained.
 * @returns 
 */
export function build(arg1: IValidationServices | ValidationManagerConfig): ValidationManagerConfigBuilder
{
    return new ValidationManagerConfigBuilder(arg1 as any);
}

/**
 * Builder specific to ValidationManager.
 * It provides the ability to attach callbacks to the baseConfig.
 */

export class ValidationManagerConfigBuilder extends ValueHostsManagerConfigBuilder<ValidationManagerConfig>
    implements IValidationManagerCallbacks
{
    constructor(services: IValidationServices)
    constructor(config: ValidationManagerConfig)
    constructor(arg1: IValidationServices | ValidationManagerConfig)
    {
        super(arg1 as any);
    }
    protected get services(): IValidationServices {
        return this.baseConfig.services;
    }

    protected createFluent(): ValidationManagerStartFluent
    {
        return new ValidationManagerStartFluent(this.destinationConfig());
    }    
    //#region validation oriented ValueHost support
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a InputValueHostConfig.
     * @returns FluentValidatorCollector for chaining validators to initial InputValueHost
     */
    public input(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector;
    /**
     * Fluent format to create a InputValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire InputValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorCollector for chaining validators to initial InputValueHost
     */
    public input(config: FluentInputValueConfig): FluentValidatorCollector;
    // overload resolution
    public input(arg1: ValueHostName | FluentInputValueConfig, dataType?: string | null, parameters?: FluentInputParameters): FluentValidatorCollector {
        return this.addInputValueHost(this.createFluent(), arg1, dataType, parameters);
    }

    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param valueHostName - the ValueHost name
     * @param dataType - optional and can be null. The value for ValueHost.dataType.
     * @param parameters - optional. Any additional properties of a PropertyValueHostConfig.
     * @returns FluentValidatorCollector for chaining validators to initial PropertyValueHost
     */
    public property(valueHostName: ValueHostName, dataType?: string | null, parameters?: FluentPropertyParameters): FluentValidatorCollector;
    /**
     * Fluent format to create a PropertyValueHostConfig.
     * This is the start of a fluent series. Extend series with validation rules like "required()".
     * @param config - Supply the entire PropertyValueHostConfig. This is a special use case.
     * You can omit the valueHostType property.
     * @returns FluentValidatorCollector for chaining validators to initial PropertyValueHost
     */
    public property(config: FluentPropertyValueConfig): FluentValidatorCollector;
    // overload resolution
    public property(arg1: ValueHostName | FluentPropertyValueConfig, dataType?: string | null, parameters?: FluentPropertyParameters): FluentValidatorCollector {
        return this.addPropertyValueHost(this.createFluent(), arg1, dataType, parameters);
    }
    //#endregion validation oriented ValueHost support

    /**
     * Expand the override behavior to support the options.
     * @param options 
     */
    public override(options?: BuilderOverrideOptions): void {
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
    public favorUIMessages(): void
    {
        let tls = this.services.textLocalizerService;
        // goes through all validators, but only on the baseConfig which is setup by business logic.
        // For any with an error message, see if it exists
        // in TextLocalizationService as "*". If so, clear
        // errorMessage, errorMessagel10n, summaryMessage, summaryMessagel10n
        // This allows TextLocalizationService to supply messages.
        for (let i = 0; i < this.baseConfig.valueHostConfigs.length; i++)
        {
            let vhConfig = this.baseConfig.valueHostConfigs[i] as InputValueHostConfig;
            if (vhConfig.validatorConfigs)
                vhConfig.validatorConfigs.forEach((ivConfig) => {
                    if (ivConfig.errorMessage || ivConfig.errorMessagel10n)
                        if (tls.getErrorMessage('*', resolveErrorCode(ivConfig), null))
                        {
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
    public convertPropertyToInput(): boolean
    {
        let changed = false;
        this.baseConfig.valueHostConfigs.forEach((vhConfig) => {
            if (vhConfig.valueHostType === ValueHostType.Property)
            {
                vhConfig.valueHostType = ValueHostType.Input;
                changed = true;
            }
        });
        return changed;
    }


    //#region InstanceState
    public get savedInstanceState(): ValidationManagerInstanceState | null | undefined {
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
    public get onValueHostValidationStateChanged(): ValueHostValidationStateChangedHandler | null | undefined {
        return this.baseConfig.onValueHostValidationStateChanged;
    }
    public set onValueHostValidationStateChanged(value: ValueHostValidationStateChangedHandler | null) {
        this.baseConfig.onValueHostValidationStateChanged = value;
    }

    /**
     * @inheritDoc ValidationManager/Types!IValidationManagerCallbacks.onValidationStateChanged
     */
    public get onValidationStateChanged(): ValidationStateChangedHandler | null | undefined {
        return this.baseConfig.onValidationStateChanged;
    }
    public set onValidationStateChanged(value: ValidationStateChangedHandler | null) {
        this.baseConfig.onValidationStateChanged = value;
    }

    /**
     * @inheritDoc ValidationManager/Types!IValidationManagerCallbacks.notifyValidationStateChangedDelay
     */
    public get notifyValidationStateChangedDelay(): number | undefined {
        return this.baseConfig.notifyValidationStateChangedDelay;
    }
    public set notifyValidationStateChangedDelay(value: number) {
        this.baseConfig.notifyValidationStateChangedDelay = value;
    }
//#endregion IValidationManagerCallbacks
}


/**
 * Parameter for the overrides function to supply its options.
 */
export interface BuilderOverrideOptions
{
    /**
     * When true, use the favorUIMessages() function to delete
     * any error messages supplied by business logic for which
     * you have a replacement in TextLocalizationService.
     * If undefined, it defaults to true.
     */
    favorUIMessages?: boolean,
    /**
     * When true, use the convertPropertyToInput() function to
     * replace the valueHostType property value, from 'Property'
     * to 'Input' (no changes to any other case).
     * This allows business logic to output in its preferred ValueHostType
     * and UI to upscale it to InputValueHost.
     */
    convertPropertyToInput?: boolean
}