
import { ValueHostName } from "../DataTypes/BasicTypes";
import { ConditionConfig } from "../Interfaces/Conditions";
import { FieldValueHostConfig } from "../Interfaces/FieldValueHost";
import { LoggingLevel } from "../Interfaces/LoggerService";
import {
    BuilderOverrideOptions, IManagerConfigBuilder, 
    IValidationManagerConfigFormAdapter } 
from "../Interfaces/ManagerConfigBuilder";
import { IStartConditionBuilder } from "../Interfaces/ChildBuilders"
import { RulesConfigOptions } from "../Interfaces/ModelRules";
import { ValidationManagerConfig } from "../Interfaces/ValidationManager";
import { CodingError } from "../Utilities/ErrorHandling";
import { resolveErrorCode } from "../Utilities/Validation";
import { BuilderState, ManagerConfigBuilderBase } from "./ManagerConfigBuilderBase";
import { CombineUsingCondition } from "../Interfaces/ManagerConfigBuilder";
import { ValidationManagerConfigBuilder } from "./ValidationManagerConfigBuilder";

/**
 * Creates a ValidationManagerConfigFormAdapter from a source IManagerConfigBuilder.
 * @param source 
 * @param options 
 * @returns 
 */
export function createFormAdapter(source: IManagerConfigBuilder<any>, options?: RulesConfigOptions): IValidationManagerConfigFormAdapter
{
    if (source instanceof ManagerConfigBuilderBase) {
        let state = (source as ManagerConfigBuilderBase<ValidationManagerConfig>).handOffState();
        return new ValidationManagerConfigFormAdapter(state, { favorUIMessages: options?.favorUIMessages });
    }
    throw new CodingError("createFormAdapter() expects a ManagerConfigBuilderBase instance.");
}

/** 
 * Variation of ValidationManagerConfigBuilder with extensions designed for the UI layer
 * to override and extend the business layer configuration.
 * It allows us to isolate methods specific to the UI layer, 
 * so that the business layer does not have to know about them.
*/
export class ValidationManagerConfigFormAdapter
    extends ValidationManagerConfigBuilder
    implements IValidationManagerConfigFormAdapter
{
    /**
     * Opens a new override layer for the UI layer to add or modify ValueHostConfigs.
     * @param state 
     * @param options - When options.favorUIMessages is not false, 
     * it will run favorUIMessages() to remove any error messages supplied by business logic,
     * so long as they are covered in TextLocalizationServices.
     */
    constructor(state: BuilderState<ValidationManagerConfig>, options?: BuilderOverrideOptions) {
        super(state);
        this.addOverride();
        if (!options || options.favorUIMessages !== false)
            this.favorUIMessages();        
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
    protected favorUIMessages(): void {
        let tls = this.services.textLocalizerService;
        // goes through all validators, but only on the baseConfig which is setup by business logic.
        // For any with an error message, see if it exists
        // in TextLocalizationService as "*". If so, clear
        // errorMessage, errorMessagel10n, summaryMessage, summaryMessagel10n
        // This allows TextLocalizationService to supply messages.
        for (let i = 0; i < this.baseConfig.valueHostConfigs.length; i++) {
            let vhConfig = this.baseConfig.valueHostConfigs[i] as FieldValueHostConfig;
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
     * When adapting rules inherited from a model, it may have more fields than the UI layer is going to use. This function
     * will disable any ValueHostConfigs that are not in the list of modelFieldNames. 
     * This is useful when the business layer has a model with many fields, 
     * but the UI layer is only going to use a subset of those fields.
     * @param modelFieldNames - names on ValueHosts already declared. 
     * All ValueHosts will have their enabled property set to false, except for those in the list.
     * Empty array disables all ValueHosts. Null or undefined does nothing.
     */
    public useOnlyTheseModelFields(modelFieldNames: Array<ValueHostName>): void
    {
        // clone the array
        let notFound: Array<ValueHostName> = modelFieldNames.slice();
        // uses baseConfig, not destinationValueHostConfigs(), 
        // because the model's ValueHostConfigs are on baseConfig, not the current override.
        for (let vhConfig of this.baseConfig.valueHostConfigs) {
            {
                const index = notFound.indexOf(vhConfig.name);
                if (index > -1)
                    notFound.splice(index, 1);
                if (!modelFieldNames.includes(vhConfig.name))
                    vhConfig.initialEnabled = false;
            }
        }
        if (notFound.length > 0) {
            // log
            let msg = `useOnlyTheseModelFields specified names not already registered: ${notFound.join(', ')}`;
            this.logger.message(LoggingLevel.Warn, () => msg);
        }
    }
    
    /**
     * When adapting rules inherited from a model, it may have more fields than the UI layer is going to use. This function
     * will disable any ValueHostConfigs that are in the list of modelFieldNames.
     * This is useful when the business layer has a model with many fields, 
     * but the UI layer is only going to use a subset of those fields.
     * @param modelFieldNames - names on ValueHosts already declared. 
     * All ValueHosts will have their enabled property set to false, except for those in the list.
     */
    public disableTheseModelFields(modelFieldNames: Array<ValueHostName>): void
    {
        let notFound: Array<ValueHostName> = modelFieldNames.slice();
        // uses baseConfig, not destinationValueHostConfigs(), 
        // because the model's ValueHostConfigs are on baseConfig, not the current override.
        for (let vhConfig of this.baseConfig.valueHostConfigs) {
            {
                const index = notFound.indexOf(vhConfig.name);
                if (index > -1)
                    notFound.splice(index, 1);
                if (modelFieldNames.includes(vhConfig.name))
                    vhConfig.initialEnabled = false;
            }
        }
        if (notFound.length > 0) {
            // log
            let msg = `disableTheseModelFields specified names not already registered: ${notFound.join(', ')}`;
            this.logger.message(LoggingLevel.Warn, () => msg);
        }
    }


    /**
     * If it finds the validator with the errorcode specified, 
     * it will combine the condition with the existing condition
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
        builderFn: (combiningBuilder: IStartConditionBuilder, existingConditionConfig: ConditionConfig) => void): ValidationManagerConfigBuilder;
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
        builderFn: (combiningBuilder: IStartConditionBuilder) => void): ValidationManagerConfigBuilder

    public combineWithRule(valueHostName: ValueHostName, errorCode: string,
        arg3: CombineUsingCondition | ((combiningBuilder: IStartConditionBuilder, existingConditionConfig: ConditionConfig) => void),
        arg4?: (combiningBuilder: IStartConditionBuilder) => void): ValidationManagerConfigBuilder {
        let { vhc, vc } = this.setupValueHostToCombine(valueHostName, errorCode);   // throws if not found
        this.combineWithValidatorConfig(vc, arg3, arg4);
        return this;
    }

    /**
     * Replace the condition supplying the replacement conditionConfig directly.
     * If it finds the validator with the errorcode specified, 
     * it will replace the condition with the existing condition.
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
    public replaceRule(valueHostName: ValueHostName, errorCode: string, 
        builderFn: (replacementBuilder: IStartConditionBuilder) => void): ValidationManagerConfigBuilder
    public replaceRule(valueHostName: ValueHostName, errorCode: string,
        sourceOfConditionConfig: ConditionConfig | ((replacementBuilder: IStartConditionBuilder) => void)): ValidationManagerConfigBuilder {
        let { vhc, vc } = this.setupValueHostToCombine(valueHostName, errorCode);   // throws if not found
        this.replaceConditionWith(vc, sourceOfConditionConfig);
        return this;
    }

}    